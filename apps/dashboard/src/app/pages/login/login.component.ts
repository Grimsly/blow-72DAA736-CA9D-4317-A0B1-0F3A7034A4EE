import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Task Manager
          </h2>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          @if (error()) {
          <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-800">{{ error() }}</p>
          </div>
          }

          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                [(ngModel)]="email"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                [(ngModel)]="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>

        <div class="text-sm text-center text-gray-600">
          <p>Test credentials:</p>
          <p>Owner: owner@turbovets.com / password123</p>
          <p>Admin: admin@turbovets.com / password123</p>
          <p>Viewer: viewer@turbovets.com / password123</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Login failed');
        },
      });
  }
}
