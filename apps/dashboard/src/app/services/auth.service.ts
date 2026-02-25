import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Role } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';
import { JwtPayload } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/auth';

export interface User {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: Role;
  organizationId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Use signals for reactive state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.loadUser();
  }

  private loadUser(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeToken(token);
        if (payload) {
          this.currentUser.set({
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            organizationId: payload.organizationId,
          });
          this.isAuthenticated.set(true);
        } else {
          throw new Error("Payload can't be decoded");
        }
      } catch {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.router.navigate(['/tasks']);
      })
    );
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/register', data).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.router.navigate(['/tasks']);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
