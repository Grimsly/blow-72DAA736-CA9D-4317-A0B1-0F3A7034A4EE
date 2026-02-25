import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from './auth.service';
import { Role } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jest.Mocked<Router>;

  const mockLoginResponse: LoginResponse = {
    access_token: 'mock-token',
    user: {
      id: '123',
      email: 'test@example.com',
      role: Role.ADMIN,
      organizationId: 'org123',
    },
  };

  beforeEach(() => {
    const routerSpy = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jest.Mocked<Router>;

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', (done) => {
      service
        .login({ email: 'test@example.com', password: 'password' })
        .subscribe((response) => {
          expect(response).toEqual(mockLoginResponse);
          expect(localStorage.getItem('access_token')).toBe('mock-token');
          expect(service.currentUser()).toEqual(mockLoginResponse.user);
          expect(service.isAuthenticated()).toBe(true);
          expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
          done();
        });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      service
        .login({ email: 'test@example.com', password: 'wrong' })
        .subscribe({
          error: (error) => {
            expect(error.status).toBe(401);
            expect(service.isAuthenticated()).toBe(false);
            done();
          },
        });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(
        { message: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('logout', () => {
    it('should clear token and user data', () => {
      localStorage.setItem('access_token', 'mock-token');
      service.currentUser.set(mockLoginResponse.user);
      service.isAuthenticated.set(true);

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('access_token', 'test-token');

      expect(service.getToken()).toBe('test-token');
    });

    it('should return null if no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('loadUser', () => {
    it('should load user from valid token', () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        role: Role.ADMIN,
        organizationId: 'org123',
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorage.setItem('access_token', token);

      service['loadUser']();

      expect(service.currentUser()).toEqual({
        id: '123',
        email: 'test@example.com',
        role: Role.ADMIN,
        organizationId: 'org123',
      });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should logout if token is invalid', () => {
      localStorage.setItem('access_token', 'invalid-token');
      const logoutSpy = jest.spyOn(service, 'logout');

      service['loadUser']();

      expect(logoutSpy).toHaveBeenCalled();
    });
  });
});
