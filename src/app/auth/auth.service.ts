import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, BehaviorSubject, timer, EMPTY, map} from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

export type AuthUser = {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos hasta expiración
  roles?: string[];
  email?: string;
  isAdmin?: boolean;
};

export type UserProfile = {
  username: string;
  email: string;
  roles: string[];
  isAdmin: boolean;
};

export type UserPermissions = {
  username: string;
  roles: string[];
  permissions: {
    canViewAdminPanel: boolean;
    canManageUsers: boolean;
    [key: string]: boolean;
  };
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  expiresIn: number;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly USER_API_URL = 'http://localhost:8080/api/user';
  private readonly storageKey = 'avaltrust.auth';
  private readonly _user = signal<AuthUser | null>(this.readFromStorage());
  private readonly _userProfile = signal<UserProfile | null>(null);
  private readonly _userPermissions = signal<UserPermissions | null>(null);
  private refreshTimer: any;
  private readonly tokenRefreshSubject = new BehaviorSubject<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly userProfile = this._userProfile.asReadonly();
  readonly userPermissions = this._userPermissions.asReadonly();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Iniciar timer de renovación si hay usuario logueado
    if (this.isAuthenticated()) {
      this.startTokenRefreshTimer();
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const profile = this._userProfile();
    return profile?.roles?.includes(role) || false;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN') || this._userProfile()?.isAdmin || false;
  }

  /**
   * Verifica si el usuario es usuario regular
   */
  isUser(): boolean {
    return this.hasRole('ROLE_USER');
  }

  /**
   * Obtiene el perfil del usuario desde el backend
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.USER_API_URL}/profile`)
      .pipe(
        tap(profile => {
          this._userProfile.set(profile);

          // Actualizar el usuario con la información de roles
          const currentUser = this._user();
          if (currentUser) {
            const updatedUser: AuthUser = {
              ...currentUser,
              roles: profile.roles,
              email: profile.email,
              isAdmin: profile.isAdmin
            };
            this._user.set(updatedUser);
            this.writeToStorage(updatedUser);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error obteniendo perfil del usuario:', error);
          throw new Error(this.getErrorMessage(error));
        })
      );
  }

  /**
   * Obtiene los permisos del usuario desde el backend
   */
  getUserPermissions(): Observable<UserPermissions> {
    return this.http.get<UserPermissions>(`${this.USER_API_URL}/permissions`)
      .pipe(
        tap(permissions => {
          this._userPermissions.set(permissions);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error obteniendo permisos del usuario:', error);
          throw new Error(this.getErrorMessage(error));
        })
      );
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const permissions = this._userPermissions();
    return permissions?.permissions?.[permission] || false;
  }

  redirectToAppropriateRoute(): void {
    // Siempre redirigir al dashboard sin importar el rol
    this.router.navigate(['/dashboard']);
  }

  login(username: string, password: string): Observable<AuthUser> {
    const request: LoginRequest = { username: username.trim(), password };

    const httpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request, httpOptions)
      .pipe(
        tap(response => {
          const user: AuthUser = {
            username: response.username,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: Math.floor(Date.now() / 1000) + response.expiresIn
          };

          this._user.set(user);
          this.writeToStorage(user);
          this.startTokenRefreshTimer();

          // Cargar perfil y permisos después del login exitoso
          this.loadUserData();
        }),
        catchError((error: HttpErrorResponse) => {
          throw new Error(this.getErrorMessage(error));
        })
      );
  }

  /**
   * Carga los datos del usuario (perfil y permisos)
   */
  private loadUserData(): void {
    // Cargar perfil
    this.getUserProfile().subscribe({
      next: () => {
        // Cargar permisos después de cargar el perfil
        this.getUserPermissions().subscribe({
          error: (error) => {
            // Los permisos son opcionales, no fallar por esto
            console.warn('No se pudieron cargar los permisos del usuario:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error cargando perfil del usuario:', error);
        // Mantener sesión activa aunque falle la carga del perfil
        // Solo limpiar si hay un error de autenticación real
        if (error?.status === 401) {
          this.logout(false);
        }
      }
    });
  }


  logout(redirectToLogin = true): Observable<any> {
    const user = this._user();
    this.clearTokenRefreshTimer();

    // Limpiar estado local inmediatamente
    this._user.set(null);
    this._userProfile.set(null);
    this._userPermissions.set(null);
    this.writeToStorage(null);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }

    // Notificar al servidor (opcional, no bloquear UI)
    if (user?.refreshToken) {
      return this.http.post(`${this.API_URL}/logout`, {
        refreshToken: user.refreshToken
      }).pipe(
        catchError(() => EMPTY) // Ignorar errores de logout
      );
    }

    return EMPTY;
  }

  private readFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      const user = JSON.parse(raw) as AuthUser;
      // Verificar si el token ha expirado
      if (this.isTokenExpired(user)) {
        this.logout(false);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  private writeToStorage(user: AuthUser | null) {
    try {
      if (user) {
        localStorage.setItem(this.storageKey, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch {
      // ignore storage errors
    }
  }

  private isTokenExpired(user: AuthUser): boolean {
    if (!user.expiresIn) return true;
    const expirationTime = new Date(user.expiresIn * 1000);
    return new Date() >= expirationTime;
  }

  isAuthenticated(): boolean {
    const user = this._user();
    return user !== null && !this.isTokenExpired(user);
  }

  getAccessToken(): string | null {
    const user = this._user();
    return user && !this.isTokenExpired(user) ? user.accessToken : null;
  }

  private refreshToken(): Observable<string> {
    const user = this._user();
    if (!user?.refreshToken) {
      this.logout();
      return EMPTY;
    }

    const request: RefreshRequest = { refreshToken: user.refreshToken };

    return this.http.post<RefreshResponse>(`${this.API_URL}/refresh`, request)
      .pipe(
        tap(response => {
          const updatedUser: AuthUser = {
            ...user,
            accessToken: response.accessToken,
            expiresIn: Math.floor(Date.now() / 1000) + response.expiresIn
          };

          this._user.set(updatedUser);
          this.writeToStorage(updatedUser);
          this.tokenRefreshSubject.next(response.accessToken);
        }),
        map(response => response.accessToken), // Extraer solo el accessToken
        catchError(() => {
          this.logout();
          return EMPTY;
        })
      );
  }

  private startTokenRefreshTimer(): void {
    this.clearTokenRefreshTimer();

    const user = this._user();
    if (!user) return;

    // Renovar token 2 minutos antes de expirar
    const refreshTime = (user.expiresIn * 1000) - Date.now() - (2 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = timer(refreshTime).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe({
        next: () => {
          // Timer se reinicia automáticamente después de renovar
          this.startTokenRefreshTimer();
        },
        error: () => {
          this.logout();
        }
      });
    } else {
      // Token ya expirado, renovar inmediatamente
      this.refreshToken().subscribe();
    }
  }

  private clearTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
      this.refreshTimer = null;
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Credenciales inválidas';
    } else if (error.status === 403) {
      return 'Acceso denegado';
    } else if (error.status === 0) {
      return 'Error de conexión. Verifica tu internet.';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'Error desconocido. Intenta nuevamente.';
    }
  }
}
