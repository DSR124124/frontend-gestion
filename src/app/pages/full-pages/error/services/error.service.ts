import { Injectable } from '@angular/core';
import { ErrorInfo } from '../../../../shared/services/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  /**
   * Obtiene la información del error basado en el tipo
   */
  getErrorInfo(type: string, customMessage?: string, customDescription?: string, customCode?: string): ErrorInfo {
    const baseInfo = this.getBaseErrorInfo(type);

    return {
      ...baseInfo,
      code: customCode || baseInfo.code,
      message: customMessage || baseInfo.message,
      description: customDescription || baseInfo.description
    };
  }

  /**
   * Obtiene la información base del error según el tipo
   */
  private getBaseErrorInfo(type: string): ErrorInfo {
    switch (type) {
      case '404':
        return {
          code: '404',
          title: 'Página no encontrada',
          message: 'Lo sentimos, la página que buscas no existe.',
          description: 'La URL que intentaste acceder no se encuentra disponible o ha sido movida.',
          icon: 'pi pi-exclamation-triangle',
          severity: 'warning',
          showSupport: false,
          showRefresh: false
        };

      case '403':
        return {
          code: '403',
          title: 'Acceso denegado',
          message: 'No tienes permisos para acceder a este recurso.',
          description: 'Tu cuenta no tiene los permisos necesarios para ver esta página.',
          icon: 'pi pi-times-circle',
          severity: 'error',
          showSupport: true,
          showRefresh: false
        };

      case '500':
        return {
          code: '500',
          title: 'Error del servidor',
          message: 'Ha ocurrido un error en el servidor.',
          description: 'El servidor encontró un error interno. Por favor, intenta más tarde o contacta al soporte técnico.',
          icon: 'pi pi-times-circle',
          severity: 'error',
          showSupport: true,
          showRefresh: true
        };

      case '419':
        return {
          code: '419',
          title: 'Sesión expirada',
          message: 'Tu sesión ha expirado.',
          description: 'Por seguridad, tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          icon: 'pi pi-info-circle',
          severity: 'info',
          showSupport: false,
          showRefresh: false
        };

      case 'network':
        return {
          code: 'NET',
          title: 'Error de conexión',
          message: 'No se pudo conectar al servidor.',
          description: 'Verifica tu conexión a internet e intenta nuevamente.',
          icon: 'pi pi-globe',
          severity: 'error',
          showSupport: false,
          showRefresh: true
        };

      case 'maintenance':
        return {
          code: '503',
          title: 'Mantenimiento programado',
          message: 'El servicio está temporalmente no disponible.',
          description: 'Estamos realizando mantenimiento programado. El servicio estará disponible pronto.',
          icon: 'pi pi-info-circle',
          severity: 'info',
          showSupport: false,
          showRefresh: true
        };

      default:
        return {
          code: 'ERR',
          title: 'Error desconocido',
          message: 'Ha ocurrido un error inesperado.',
          description: 'Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.',
          icon: 'pi pi-exclamation-triangle',
          severity: 'error',
          showSupport: true,
          showRefresh: true
        };
    }
  }
}
