import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
  enabled: boolean;
  aliadoEstrategicoId?: number | null;
  aliadoEstrategicoNombre?: string | null;
}

export interface UpdateRolesRequest {
  roles: string[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  aliadoEstrategicoId?: number | null;
}

export interface CreateUserResponse {
  id?: number;
  username: string;
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/admin`;
  private authUrl = `${environment.apiUrl}/api/auth`;

  /**
   * GET /api/admin/users
   * Obtiene todos los usuarios del sistema
   */
  getAllUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.baseUrl}/users`).pipe(
      map((users: any[]) => {
        return users.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          roles: Array.isArray(u.roles) ? u.roles : [],
          enabled: u.enabled ?? true,
          aliadoEstrategicoId: u.aliadoEstrategicoId || null,
          aliadoEstrategicoNombre: u.aliadoEstrategicoNombre || null
        }));
      })
    );
  }

  /**
   * POST /api/admin/users/{userId}/roles
   * Actualiza los roles de un usuario
   */
  updateUserRoles(userId: number, roles: string[]): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.baseUrl}/users/${userId}/roles`, { roles });
  }

  /**
   * PUT /api/admin/users/{userId}
   * Actualiza un usuario completo (roles, aliado estratégico y opcionalmente contraseña)
   */
  updateUser(userId: number, roles: string[], aliadoEstrategicoId: number | null, password?: string): Observable<AppUser> {
    const body: any = { 
      roles, 
      aliadoEstrategicoId 
    };
    
    // Solo incluir contraseña si se proporciona y no está vacía
    if (password && password.trim() !== '') {
      body.password = password.trim();
    }
    
    return this.http.put<AppUser>(`${this.baseUrl}/users/${userId}`, body);
  }

  /**
   * DELETE /api/admin/users/{userId}
   * Elimina un usuario del sistema
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * POST /api/admin/users
   * Crea un nuevo usuario en el sistema (solo admins)
   */
  createUser(data: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`${this.baseUrl}/users`, data);
  }

  /**
   * PATCH /api/admin/users/{userId}/status
   * Activa o desactiva un usuario
   * Nota: Este endpoint aún no existe en el backend, se debe implementar
   */
  toggleUserStatus(userId: number, enabled: boolean): Observable<AppUser> {
    // Por ahora, como workaround, actualizamos los roles para mantener el estado
    // El backend debería tener un endpoint específico: PATCH /api/admin/users/{userId}/status
    return this.http.patch<AppUser>(`${this.baseUrl}/users/${userId}/status`, { enabled });
  }
}
