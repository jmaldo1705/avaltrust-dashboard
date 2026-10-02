import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService.logout', () => {
  const sesion = () => ({
    username: 'aliado1',
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresIn: Math.floor(Date.now() / 1000) + 3600,
  });

  function crear() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
  }

  afterEach(() => localStorage.clear());

  it('avisa al servidor aunque quien llama no se suscriba', () => {
    localStorage.setItem('avaltrust.auth', JSON.stringify(sesion()));
    const { auth, http } = crear();

    auth.logout(false);

    const req = http.expectOne(r => r.url.endsWith('/api/auth/logout'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh-1' });
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.user()).toBeNull();
    expect(localStorage.getItem('avaltrust.auth')).toBeNull();
    http.verify();
  });

  it('un error del servidor no impide cerrar la sesion local', () => {
    localStorage.setItem('avaltrust.auth', JSON.stringify(sesion()));
    const { auth, http } = crear();

    auth.logout(false);
    http.expectOne(r => r.url.endsWith('/api/auth/logout')).flush(null, { status: 500, statusText: 'Error' });

    expect(auth.user()).toBeNull();
    http.verify();
  });

  it('sin sesion no envia nada', () => {
    const { auth, http } = crear();

    auth.logout(false);

    http.expectNone(r => r.url.endsWith('/api/auth/logout'));
    http.verify();
  });
});
