import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { ErrorInfo } from '../../../../../shared/services/error-handler.service';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-error',
  imports: [...PrimeNGModules],
  templateUrl: './error.component.html',
  styleUrl: './error.component.css'
})
export class ErrorComponent implements OnInit {

  errorInfo: ErrorInfo | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    // Obtener información del error desde los parámetros de la ruta
    this.route.queryParams.subscribe(params => {
      const errorType = params['type'] || '404';
      const customMessage = params['message'];
      const customDescription = params['description'];
      const customCode = params['code'];

      this.errorInfo = this.errorService.getErrorInfo(
        errorType,
        customMessage,
        customDescription,
        customCode
      );
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.location.back();
  }

  refreshPage(): void {
    window.location.reload();
  }
}
