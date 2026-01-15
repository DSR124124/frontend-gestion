// src/app/theme/nettalco-preset.ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const NettalcoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e6eaff',
      100: '#ccd5ff',
      200: '#99abff',
      300: '#6680ff',
      400: '#3356ff',
      500: '#1C224D', // color Nettalco
      600: '#1a1f45',
      700: '#171c3d',
      800: '#141934',
      900: '#10152c',
      950: '#0d1123'

    },
    secondary: {
      500: '#4A7AFF'
    }
  }
});
