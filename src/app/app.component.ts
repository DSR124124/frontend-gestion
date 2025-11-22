import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNGModules } from './prime-ng/prime-ng';

@Component({
  selector: 'app-root',
  imports: [
    ...PrimeNGModules,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend-gestion';
}
