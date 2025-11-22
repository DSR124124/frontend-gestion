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

