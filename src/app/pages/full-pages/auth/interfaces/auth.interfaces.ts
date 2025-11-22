export interface LoginDTO {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  type: string;
  idUsuario: number;
  username: string;
  email: string;
  nombreCompleto: string;
  idRol: number;
  nombreRol: string;
  fechaUltimoAcceso: string;
}

export interface UserInfo {
  idUsuario: number;
  username: string;
  email: string;
  nombreCompleto: string;
  idRol: number;
  nombreRol: string;
  fechaUltimoAcceso: string;
}

