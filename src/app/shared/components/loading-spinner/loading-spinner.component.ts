import { Component } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { PrimeNGModules } from '../../../prime-ng/prime-ng';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'shared-loading-spinner',
  standalone: true,
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css',
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule,
    CommonModule
  ],
})
export class LoadingSpinnerComponent {

  constructor(private loadingService: LoadingService) {}

  get loading$() {
    return this.loadingService.loading$;
  }
}
