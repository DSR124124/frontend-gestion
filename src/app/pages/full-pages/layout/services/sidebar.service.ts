import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SidebarItem } from '../interfaces/sidebar-item.interface';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private itemsSubject = new BehaviorSubject<SidebarItem[]>([]);
  public items$: Observable<SidebarItem[]> = this.itemsSubject.asObservable();

  constructor() {
    this.initializeDefaultItems();
  }

  /**
   * Inicializa los items por defecto del sidebar
   */
  private initializeDefaultItems(): void {
    const defaultItems: SidebarItem[] = [
      {
        id: 'dashboard',
        label: 'Inicio',
        icon: 'pi pi-home',
        items: [
          {
            id: 'dashboard-main',
            label: 'Dashboard',
            icon: 'pi pi-chart-line',
            routerLink: ['/dashboard'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: 'pi pi-users',
        items: [
          {
            id: 'users-list',
            label: 'Listar Usuarios',
            icon: 'pi pi-list',
            routerLink: ['/usuarios'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'roles',
        label: 'Roles',
        icon: 'pi pi-shield',
        items: [
          {
            id: 'roles-list',
            label: 'Listar Roles',
            icon: 'pi pi-list',
            routerLink: ['/roles'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'aplicaciones',
        label: 'Aplicaciones',
        icon: 'pi pi-th-large',
        items: [
          {
            id: 'aplicaciones-list',
            label: 'Listar Aplicaciones',
            icon: 'pi pi-list',
            routerLink: ['/aplicaciones'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'lanzamientos',
        label: 'Lanzamientos',
        icon: 'pi pi-download',
        items: [
          {
            id: 'lanzamientos-list',
            label: 'Listar Lanzamientos',
            icon: 'pi pi-list',
            routerLink: ['/lanzamientos'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'grupos-despliegue',
        label: 'Grupos de Despliegue',
        icon: 'pi pi-sitemap',
        items: [
          {
            id: 'grupos-despliegue-list',
            label: 'Listar Grupos',
            icon: 'pi pi-list',
            routerLink: ['/grupos-despliegue'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'usuarios-aplicaciones',
        label: 'Usuarios-Aplicaciones',
        icon: 'pi pi-link',
        items: [
          {
            id: 'usuarios-aplicaciones-list',
            label: 'Listar Relaciones',
            icon: 'pi pi-list',
            routerLink: ['/usuarios-aplicaciones'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'usuarios-grupos',
        label: 'Usuarios-Grupos',
        icon: 'pi pi-users',
        items: [
          {
            id: 'usuarios-grupos-list',
            label: 'Listar Asignaciones',
            icon: 'pi pi-list',
            routerLink: ['/usuarios-grupos'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'lanzamientos-grupos',
        label: 'Lanzamientos-Grupos',
        icon: 'pi pi-share-alt',
        items: [
          {
            id: 'lanzamientos-grupos-list',
            label: 'Listar Asignaciones',
            icon: 'pi pi-list',
            routerLink: ['/lanzamientos-grupos'],
            visible: true,
          },
        ],
        visible: true,
      },
      {
        id: 'lanzamientos-disponibles',
        label: 'Lanzamientos Disponibles',
        icon: 'pi pi-check-circle',
        items: [
          {
            id: 'lanzamientos-disponibles-list',
            label: 'Ver Disponibles',
            icon: 'pi pi-list',
            routerLink: ['/lanzamientos-disponibles'],
            visible: true,
          },
        ],
        visible: true,
      },
    ];

    this.setItems(defaultItems);
  }

  /**
   * Obtiene los items actuales del sidebar
   */
  getItems(): SidebarItem[] {
    return this.itemsSubject.value;
  }

  /**
   * Establece los items del sidebar
   */
  setItems(items: SidebarItem[]): void {
    this.itemsSubject.next(items);
  }

  /**
   * Agrega un item al sidebar
   */
  addItem(item: SidebarItem): void {
    const currentItems = this.itemsSubject.value;
    this.itemsSubject.next([...currentItems, item]);
  }

  /**
   * Actualiza un item existente
   */
  updateItem(itemId: string, updates: Partial<SidebarItem>): void {
    const currentItems = this.itemsSubject.value;
    const updatedItems = currentItems.map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      if (item.items) {
        return {
          ...item,
          items: item.items.map(subItem =>
            subItem.id === itemId ? { ...subItem, ...updates } : subItem
          ),
        };
      }
      return item;
    });
    this.itemsSubject.next(updatedItems);
  }

  /**
   * Elimina un item del sidebar
   */
  removeItem(itemId: string): void {
    const currentItems = this.itemsSubject.value;
    const filteredItems = currentItems
      .filter(item => item.id !== itemId)
      .map(item => {
        if (item.items) {
          return {
            ...item,
            items: item.items.filter(subItem => subItem.id !== itemId),
          };
        }
        return item;
      });
    this.itemsSubject.next(filteredItems);
  }
}

