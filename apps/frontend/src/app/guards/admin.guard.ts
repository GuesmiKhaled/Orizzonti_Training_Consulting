import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OrizzontiApiService } from '../services/orizzonti-api.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private readonly apiService: OrizzontiApiService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean {
    if (this.apiService.isAuthenticated()) {
      return true;
    }

    this.router.navigateByUrl('/login');
    return false;
  }
}
