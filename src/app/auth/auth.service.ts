import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export type AuthUser = {
  username: string;
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'avaltrust.auth';
  private readonly _user = signal<AuthUser | null>(this.readFromStorage());
  readonly user = this._user.asReadonly();

  constructor(private router: Router) {}

  private readFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  private writeToStorage(user: AuthUser | null) {
    try {
      if (user) localStorage.setItem(this.storageKey, JSON.stringify(user));
      else localStorage.removeItem(this.storageKey);
    } catch {
      // ignore storage errors
    }
  }

  isAuthenticated(): boolean {
    return !!this._user();
  }

  login(username: string, password: string): Promise<AuthUser> {
    // Simulated async login; replace with real API call.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username && password && password.length >= 4) {
          const user: AuthUser = { username, token: cryptoRandom() };
          this._user.set(user);
          this.writeToStorage(user);
          resolve(user);
        } else {
          reject(new Error('Credenciales inválidas.'));
        }
      }, 650);
    });
  }

  logout(redirectToLogin = true) {
    this._user.set(null);
    this.writeToStorage(null);
    if (redirectToLogin) this.router.navigate(['/login']);
  }
}

function cryptoRandom(): string {
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
