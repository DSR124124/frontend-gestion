import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Preset personalizado de PrimeNG basado en la paleta de colores de NETTALCO
 * Mapea los colores de branding a los tokens de PrimeNG
 */
export const CustomNettalcoPreset = definePreset(Aura, {
  semantic: {
    // Configuración del color primario basado en navy-dark (#1c224d)
    primary: {
      50: '#e8eaf6',
      100: '#c5cae9',
      200: '#9fa8da',
      300: '#7986cb',
      400: '#5c6bc0',
      500: '#1c224d', // navy-dark como base
      600: '#1a1f45', // navy-darker
      700: '#141a3d', // navy-darker
      800: '#0f1435',
      900: '#0a0e2d',
      950: '#05071a'
    },
    // Configuración de colores de estado
    colorScheme: {
      light: {
        // Color primario en modo claro
        primary: {
          color: '#1c224d', // navy-dark
          inverseColor: '#ffffff',
          hoverColor: '#2a3066', // navy-lighter
          activeColor: '#141a3d' // navy-darker
        },
        // Highlight (para elementos seleccionados)
        highlight: {
          background: '#4a7aff', // blue-light
          focusBackground: '#2954ff', // blue-darker
          color: '#ffffff',
          focusColor: '#ffffff'
        },
        // Surface (fondos)
        surface: {
          0: '#ffffff',
          50: '#f7fafc', // gray-light
          100: '#edf2f7', // gray-lighter
          200: '#e6e6e6', // light-gray
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#7a7a7a', // gray-medium
          600: '#4a5568', // gray-dark
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        // Form fields
        formField: {
          hoverBorderColor: '#4a7aff', // blue-light
          focusBorderColor: '#4a7aff',
          invalidBorderColor: '#ef5350' // danger
        },
        // Success (mint-light)
        success: {
          color: '#a2f0a1', // mint-light
          inverseColor: '#ffffff',
          hoverColor: '#7ed47d', // mint-darker
          activeColor: '#176973' // teal-dark
        },
        // Info (blue-light)
        info: {
          color: '#4a7aff', // blue-light
          inverseColor: '#ffffff',
          hoverColor: '#6b8fff', // blue-lighter
          activeColor: '#2954ff' // blue-darker
        },
        // Warning
        warning: {
          color: '#ffa726',
          inverseColor: '#ffffff',
          hoverColor: '#fb8c00',
          activeColor: '#f57c00'
        },
        // Danger
        danger: {
          color: '#ef5350',
          inverseColor: '#ffffff',
          hoverColor: '#e53935',
          activeColor: '#c62828'
        }
      },
      dark: {
        // Color primario en modo oscuro
        primary: {
          color: '#4a7aff', // blue-light (más visible en oscuro)
          inverseColor: '#1c224d',
          hoverColor: '#6b8fff', // blue-lighter
          activeColor: '#2954ff' // blue-darker
        },
        // Highlight en modo oscuro
        highlight: {
          background: '#4a7aff',
          focusBackground: '#6b8fff',
          color: '#ffffff',
          focusColor: '#ffffff'
        },
        // Surface en modo oscuro
        surface: {
          0: '#1c224d', // navy-dark como fondo principal
          50: '#2a3066', // navy-lighter
          100: '#141a3d', // navy-darker
          200: '#0f1435',
          300: '#0a0e2d',
          400: '#05071a',
          500: '#4a5568',
          600: '#7a7a7a',
          700: '#9ca3af',
          800: '#d1d5db',
          900: '#e6e6e6',
          950: '#ffffff'
        },
        // Form fields en modo oscuro
        formField: {
          hoverBorderColor: '#4a7aff',
          focusBorderColor: '#4a7aff',
          invalidBorderColor: '#ef5350'
        },
        // Success en modo oscuro
        success: {
          color: '#a2f0a1',
          inverseColor: '#1c224d',
          hoverColor: '#b8f5b7', // mint-lighter
          activeColor: '#7ed47d'
        },
        // Info en modo oscuro
        info: {
          color: '#4a7aff',
          inverseColor: '#1c224d',
          hoverColor: '#6b8fff',
          activeColor: '#2954ff'
        },
        // Warning en modo oscuro
        warning: {
          color: '#ffa726',
          inverseColor: '#1c224d',
          hoverColor: '#fb8c00',
          activeColor: '#f57c00'
        },
        // Danger en modo oscuro
        danger: {
          color: '#ef5350',
          inverseColor: '#ffffff',
          hoverColor: '#e53935',
          activeColor: '#c62828'
        }
      }
    },
    // Focus ring personalizado
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '#4a7aff', // blue-light
      offset: '2px'
    }
  },
  // Componentes específicos
  components: {
    // Botones personalizados
    button: {
      colorScheme: {
        light: {
          root: {
            borderRadius: '6px'
          }
        },
        dark: {
          root: {
            borderRadius: '6px'
          }
        }
      }
    },
    // Inputs personalizados
    inputtext: {
      colorScheme: {
        light: {
          root: {
            borderRadius: '10px'
          }
        },
        dark: {
          root: {
            borderRadius: '10px'
          }
        }
      }
    },
    // Cards personalizados
    card: {
      colorScheme: {
        light: {
          root: {
            borderRadius: '12px',
            background: '#ffffff',
            color: '#000000'
          }
        },
        dark: {
          root: {
            borderRadius: '12px',
            background: '#1c224d',
            color: '#ffffff'
          }
        }
      }
    }
  }
});

