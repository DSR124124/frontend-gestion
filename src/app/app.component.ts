import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNGModules } from './prime-ng/prime-ng';
import { ThemeService } from './shared/services/theme.service';
import { Subscription } from 'rxjs';

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

  private themeSub!: Subscription;
  currentTheme = 'light';

  constructor(
    private themeService: ThemeService
  ) {
  }

  ngOnInit(): void {
    this.themeSub = this.themeService.theme$.subscribe(tema => {
      this.currentTheme = tema;
    });
  }
}
