# 🏗️ Arquitectura Dual Backend - Guía de Integración

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN FLUTTER                        │
└────────┬────────────────────────────────────────────┬────────┘
         │                                             │
         │ 1. Login/Auth                              │ 2. Servicios
         │    Validaciones                            │    Lógica de Negocio
         │    Roles                                   │    CRUD
         │                                             │
    ┌────▼─────────────────────┐          ┌──────────▼──────────────┐
    │  BACKEND DE GESTIÓN      │          │  BACKEND DE SERVICIOS   │
    │  (Ya existe)             │          │  (Nuevo)                │
    │                          │          │                         │
    │  • JWT Authentication    │          │  • API REST             │
    │  • Roles y Permisos      │◄─────────┤  • Valida JWT           │
    │  • Verificación Acceso   │ Valida   │  • Lógica Negocio      │
    │  • Actualizaciones       │ Token    │  • CRUD                 │
    └──────────┬───────────────┘          └─────────┬───────────────┘
               │                                     │
        ┌──────▼──────────┐                 ┌───────▼────────┐
        │  BD GESTIÓN     │                 │  BD SERVICIOS  │
        │  PostgreSQL     │                 │  MySQL/Mongo/  │
        └─────────────────┘                 │  PostgreSQL    │
                                            └────────────────┘
```

---

## 📋 Flujo de Autenticación y Comunicación

### 1. Proceso de Login

```
Usuario ingresa credenciales
         │
         ▼
Flutter App → Backend de Gestión (/api/auth/login)
         │
         ▼
Backend valida en BD Gestión
         │
         ▼
Retorna JWT Token + Datos Usuario
         │
         ▼
Flutter guarda Token
         │
         ▼
Flutter usa Token para:
   ├─→ Backend de Gestión (verificaciones, actualizaciones)
   └─→ Backend de Servicios (lógica de negocio)
```

### 2. Llamadas a Servicios

```
Flutter App necesita datos
         │
         ▼
Envía Token JWT en header Authorization
         │
         ▼
Backend de Servicios recibe request
         │
         ▼
Valida Token JWT (verifica firma y expiración)
         │
         ├─→ Token válido → Procesa request
         │                  Retorna datos
         │
         └─→ Token inválido → Error 401
```

---

## 🔧 Implementación en Backend de Servicios

### Opción 1: Backend de Servicios en Spring Boot (Java)

#### 1. Agregar Dependencias (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- JWT para validación -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.5</version>
    </dependency>
    
    <!-- Tu base de datos -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
    </dependency>
</dependencies>
```

#### 2. Configuración (application.properties)

```properties
spring.application.name=backend-servicios

# Base de datos de servicios (diferente a la de gestión)
spring.datasource.url=jdbc:mysql://localhost:3306/bd_servicios
spring.datasource.username=root
spring.datasource.password=tupassword

# JWT Configuration - DEBE SER LA MISMA SECRET KEY del Backend de Gestión
jwt.secret=Y2Y4ZjE2NzM5YjQ4ZTNhMjVkNGI2YzVmODcwMTIzNDU2Nzg5MGFiY2RlZjEwMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWY=

# Puerto diferente al Backend de Gestión
server.port=8081
```

#### 3. Utilidad JWT (JwtUtil.java)

```java
package com.tuempresa.servicios.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }
    
    public Integer extractIdUsuario(String token) {
        return extractAllClaims(token).get("idUsuario", Integer.class);
    }
    
    public Integer extractIdRol(String token) {
        return extractAllClaims(token).get("idRol", Integer.class);
    }
    
    public String extractNombreRol(String token) {
        return extractAllClaims(token).get("nombreRol", String.class);
    }
    
    public Boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
```

#### 4. Filtro de Autenticación (JwtAuthFilter.java)

```java
package com.tuempresa.servicios.security;

import com.tuempresa.servicios.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain chain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                Integer idUsuario = jwtUtil.extractIdUsuario(token);
                Integer idRol = jwtUtil.extractIdRol(token);
                String nombreRol = jwtUtil.extractNombreRol(token);
                
                // Crear autenticación
                UsernamePasswordAuthenticationToken authToken = 
                    new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        Collections.singletonList(
                            new SimpleGrantedAuthority("ROLE_" + nombreRol)
                        )
                    );
                
                // Agregar detalles adicionales
                authToken.setDetails(new UserDetails(idUsuario, username, idRol, nombreRol));
                
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        chain.doFilter(request, response);
    }
}

// Clase auxiliar para detalles del usuario
class UserDetails {
    private final Integer idUsuario;
    private final String username;
    private final Integer idRol;
    private final String nombreRol;
    
    public UserDetails(Integer idUsuario, String username, Integer idRol, String nombreRol) {
        this.idUsuario = idUsuario;
        this.username = username;
        this.idRol = idRol;
        this.nombreRol = nombreRol;
    }
    
    // Getters
    public Integer getIdUsuario() { return idUsuario; }
    public String getUsername() { return username; }
    public Integer getIdRol() { return idRol; }
    public String getNombreRol() { return nombreRol; }
}
```

#### 5. Configuración de Seguridad (SecurityConfig.java)

```java
package com.tuempresa.servicios.config;

import com.tuempresa.servicios.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthFilter jwtAuthFilter;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health").permitAll()  // Health check público
                .anyRequest().authenticated()                 // Todo lo demás requiere autenticación
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

#### 6. Controlador de Ejemplo (ClienteController.java)

```java
package com.tuempresa.servicios.controllers;

import com.tuempresa.servicios.security.UserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {
    
    // Obtener usuario autenticado
    private UserDetails getUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetails) auth.getDetails();
    }
    
    @GetMapping("/mi-perfil")
    public ResponseEntity<?> miPerfil() {
        UserDetails userDetails = getUserDetails();
        
        Map<String, Object> response = new HashMap<>();
        response.put("idUsuario", userDetails.getIdUsuario());
        response.put("username", userDetails.getUsername());
        response.put("rol", userDetails.getNombreRol());
        response.put("mensaje", "Token válido - Usuario autenticado");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<?> listarClientes() {
        UserDetails userDetails = getUserDetails();
        
        // Tu lógica de negocio aquí
        // Puedes filtrar por usuario: userDetails.getIdUsuario()
        // Puedes validar rol: userDetails.getNombreRol()
        
        // Ejemplo de datos
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Lista de clientes");
        response.put("solicitadoPor", userDetails.getUsername());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<?> crearCliente(@RequestBody Map<String, Object> cliente) {
        UserDetails userDetails = getUserDetails();
        
        // Validar rol
        if (!"Administrador".equals(userDetails.getNombreRol())) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "No tienes permisos para crear clientes"));
        }
        
        // Tu lógica de creación aquí
        cliente.put("creadoPor", userDetails.getIdUsuario());
        
        return ResponseEntity.ok(Map.of(
            "mensaje", "Cliente creado exitosamente",
            "cliente", cliente
        ));
    }
    
    // Health check
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
```

---

### Opción 2: Backend de Servicios en Node.js (Express)

#### 1. Instalar Dependencias

```bash
npm init -y
npm install express jsonwebtoken cors dotenv
```

#### 2. Configuración (.env)

```env
PORT=8081
JWT_SECRET=Y2Y4ZjE2NzM5YjQ4ZTNhMjVkNGI2YzVmODcwMTIzNDU2Nzg5MGFiY2RlZjEwMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWY=

# Base de datos de servicios
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bd_servicios
DB_USER=root
DB_PASSWORD=tupassword
```

#### 3. Middleware de Autenticación (authMiddleware.js)

```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al request
    req.user = {
      idUsuario: decoded.idUsuario,
      username: decoded.sub,
      idRol: decoded.idRol,
      nombreRol: decoded.nombreRol
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
```

#### 4. Middleware de Roles (roleMiddleware.js)

```javascript
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!rolesPermitidos.includes(req.user.nombreRol)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso' 
      });
    }
    
    next();
  };
};

module.exports = requireRole;
```

#### 5. Servidor (server.js)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/authMiddleware');
const requireRole = require('./middleware/roleMiddleware');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Health check (público)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-servicios' });
});

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// Obtener perfil (requiere autenticación)
app.get('/api/perfil', authMiddleware, (req, res) => {
  res.json({
    idUsuario: req.user.idUsuario,
    username: req.user.username,
    rol: req.user.nombreRol,
    mensaje: 'Token válido - Usuario autenticado'
  });
});

// Listar clientes (requiere autenticación)
app.get('/api/clientes', authMiddleware, (req, res) => {
  // Tu lógica aquí
  // Puedes filtrar por usuario: req.user.idUsuario
  
  res.json({
    mensaje: 'Lista de clientes',
    solicitadoPor: req.user.username,
    datos: [] // Tus datos aquí
  });
});

// Crear cliente (solo administradores)
app.post('/api/clientes', 
  authMiddleware, 
  requireRole(['Administrador']), 
  (req, res) => {
    const cliente = req.body;
    cliente.creadoPor = req.user.idUsuario;
    
    // Tu lógica de creación aquí
    
    res.json({
      mensaje: 'Cliente creado exitosamente',
      cliente: cliente
    });
  }
);

// Ruta para gestores
app.get('/api/reportes', 
  authMiddleware,
  requireRole(['Administrador', 'Gestor']),
  (req, res) => {
    res.json({
      mensaje: 'Reportes',
      usuario: req.user.username
    });
  }
);

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Backend de Servicios corriendo en puerto ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
```

---

## 📱 Implementación en Flutter

### 1. Servicio HTTP con Dual Backend

Crea `lib/services/http_service.dart`:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'auth_service.dart';

class HttpService {
  static final HttpService _instance = HttpService._internal();
  factory HttpService() => _instance;
  HttpService._internal();

  final AuthService _authService = AuthService();

  // URLs de los backends
  static const String URL_GESTION = 'http://154.38.186.149:8080';
  static const String URL_SERVICIOS = 'http://tu-servidor:8081';

  /// Headers con autenticación
  Map<String, String> _getHeaders() {
    final token = _authService.usuario?.token;
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ====================================
  // MÉTODOS PARA BACKEND DE GESTIÓN
  // ====================================

  /// Login (Backend de Gestión)
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$URL_GESTION/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'usernameOrEmail': username,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Error en login: ${response.body}');
    }
  }

  /// Verificar acceso (Backend de Gestión)
  Future<bool> verificarAcceso(int idUsuario, int idLanzamiento) async {
    final response = await http.get(
      Uri.parse(
        '$URL_GESTION/api/verificar-acceso/usuario/$idUsuario/lanzamiento/$idLanzamiento',
      ),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['tieneAcceso'] as bool;
    }
    return false;
  }

  // ====================================
  // MÉTODOS PARA BACKEND DE SERVICIOS
  // ====================================

  /// GET genérico al Backend de Servicios
  Future<Map<String, dynamic>> getServicios(String endpoint) async {
    final response = await http.get(
      Uri.parse('$URL_SERVICIOS$endpoint'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 401) {
      throw Exception('Token inválido o expirado');
    } else if (response.statusCode == 403) {
      throw Exception('No tienes permisos para este recurso');
    } else {
      throw Exception('Error: ${response.statusCode}');
    }
  }

  /// POST genérico al Backend de Servicios
  Future<Map<String, dynamic>> postServicios(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    final response = await http.post(
      Uri.parse('$URL_SERVICIOS$endpoint'),
      headers: _getHeaders(),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 401) {
      throw Exception('Token inválido o expirado');
    } else if (response.statusCode == 403) {
      throw Exception('No tienes permisos para este recurso');
    } else {
      throw Exception('Error: ${response.statusCode}');
    }
  }

  /// PUT genérico al Backend de Servicios
  Future<Map<String, dynamic>> putServicios(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    final response = await http.put(
      Uri.parse('$URL_SERVICIOS$endpoint'),
      headers: _getHeaders(),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Error: ${response.statusCode}');
    }
  }

  /// DELETE genérico al Backend de Servicios
  Future<bool> deleteServicios(String endpoint) async {
    final response = await http.delete(
      Uri.parse('$URL_SERVICIOS$endpoint'),
      headers: _getHeaders(),
    );

    return response.statusCode == 200 || response.statusCode == 204;
  }
}
```

### 2. Servicio de Clientes (Ejemplo)

Crea `lib/services/cliente_service.dart`:

```dart
import 'http_service.dart';

class ClienteService {
  final HttpService _http = HttpService();

  /// Obtener perfil del usuario
  Future<Map<String, dynamic>> obtenerPerfil() async {
    return await _http.getServicios('/api/perfil');
  }

  /// Listar clientes
  Future<List<dynamic>> listarClientes() async {
    final response = await _http.getServicios('/api/clientes');
    return response['datos'] as List<dynamic>? ?? [];
  }

  /// Crear cliente
  Future<Map<String, dynamic>> crearCliente(Map<String, dynamic> cliente) async {
    return await _http.postServicios('/api/clientes', cliente);
  }

  /// Actualizar cliente
  Future<Map<String, dynamic>> actualizarCliente(
    int id,
    Map<String, dynamic> cliente,
  ) async {
    return await _http.putServicios('/api/clientes/$id', cliente);
  }

  /// Eliminar cliente
  Future<bool> eliminarCliente(int id) async {
    return await _http.deleteServicios('/api/clientes/$id');
  }
}
```

### 3. Uso en Flutter

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/cliente_service.dart';

class ClientesScreen extends StatefulWidget {
  const ClientesScreen({Key? key}) : super(key: key);

  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  final ClienteService _clienteService = ClienteService();
  List<dynamic> _clientes = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _cargarClientes();
  }

  Future<void> _cargarClientes() async {
    setState(() => _isLoading = true);

    try {
      final clientes = await _clienteService.listarClientes();
      setState(() {
        _clientes = clientes;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      
      if (e.toString().contains('Token inválido')) {
        // Token expirado, volver al login
        _mostrarErrorYVolverLogin('Tu sesión ha expirado');
      } else if (e.toString().contains('No tienes permisos')) {
        _mostrarError('No tienes permisos para ver esta información');
      } else {
        _mostrarError('Error cargando clientes: $e');
      }
    }
  }

  Future<void> _crearCliente() async {
    try {
      final nuevoCliente = {
        'nombre': 'Cliente Nuevo',
        'email': 'cliente@ejemplo.com',
        // ... más datos
      };

      await _clienteService.crearCliente(nuevoCliente);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cliente creado exitosamente')),
      );
      
      _cargarClientes(); // Recargar lista
    } catch (e) {
      if (e.toString().contains('No tienes permisos')) {
        _mostrarError('Solo administradores pueden crear clientes');
      } else {
        _mostrarError('Error: $e');
      }
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.red),
    );
  }

  void _mostrarErrorYVolverLogin(String mensaje) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Sesión Expirada'),
        content: Text(mensaje),
        actions: [
          TextButton(
            onPressed: () async {
              await AuthService().logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/login',
                (route) => false,
              );
            },
            child: const Text('Aceptar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _clientes.length,
              itemBuilder: (context, index) {
                final cliente = _clientes[index];
                return ListTile(
                  title: Text(cliente['nombre'] ?? ''),
                  subtitle: Text(cliente['email'] ?? ''),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _crearCliente,
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

---

## 🔑 Puntos Clave

### 1. Secret Key Compartido

**IMPORTANTE**: Ambos backends deben usar la **MISMA SECRET KEY** para JWT:

```
Backend Gestión:   jwt.secret=Y2Y4ZjE2NzM5...
Backend Servicios: jwt.secret=Y2Y4ZjE2NzM5...  ← DEBE SER IGUAL
```

### 2. Flujo de Token

```
1. Flutter → Login → Backend Gestión → JWT Token
2. Flutter guarda Token
3. Flutter → Request → Backend Servicios (con Token en header)
4. Backend Servicios valida Token (misma secret key)
5. Backend Servicios procesa y responde
```

### 3. Validación de Roles

El Backend de Servicios puede:
- ✅ Leer el rol del Token JWT
- ✅ Validar permisos antes de procesar requests
- ✅ Filtrar datos según el usuario/rol

---

## 📊 Ejemplo de Arquitectura Completa

```
FLUTTER APP
├─ AuthService (Backend Gestión)
│  ├─ login()
│  ├─ verificarAcceso()
│  ├─ obtenerActualizaciones()
│  └─ tieneRol()
│
└─ HttpService (Backend Servicios)
   ├─ getServicios()
   ├─ postServicios()
   ├─ putServicios()
   └─ deleteServicios()
      │
      └─ ClienteService
         ├─ listarClientes()
         ├─ crearCliente()
         └─ ...
```

---

## ✅ Checklist de Implementación

### Backend de Servicios
- [ ] Crear proyecto backend (Spring Boot / Node.js)
- [ ] Configurar misma SECRET KEY que Backend de Gestión
- [ ] Implementar validación de JWT
- [ ] Crear filtro/middleware de autenticación
- [ ] Implementar endpoints de servicios
- [ ] Validar roles en endpoints sensibles
- [ ] Probar con Postman usando token real

### Flutter
- [ ] Crear HttpService con ambos backends
- [ ] Configurar URLs de ambos backends
- [ ] Implementar servicios específicos (Cliente, Producto, etc.)
- [ ] Manejar errores 401 (token expirado)
- [ ] Manejar errores 403 (sin permisos)
- [ ] Probar flujo completo: login → consumir servicios

---

## 🎯 Resumen

1. **Login** → Backend de Gestión genera JWT
2. **Token JWT** → Compartido entre ambos backends (misma secret key)
3. **Validaciones/Roles** → Backend de Gestión
4. **Servicios/CRUD** → Backend de Servicios (valida el token)
5. **Flutter** → Consume ambos backends según necesidad

Esta arquitectura te permite:
- ✅ Centralizar autenticación y permisos
- ✅ Separar lógica de negocio en diferentes backends
- ✅ Escalar servicios independientemente
- ✅ Usar diferentes bases de datos
- ✅ Mantener seguridad con JWT compartido

---

**¡Listo!** 🎉 Ahora tienes una arquitectura dual backend completamente integrada.

