import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');
  focused: 'user' | 'pass' | '' = '';

  constructor(){
    // If already logged in, go to dashboard
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(){
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.login(this.username.trim(), this.password)
      .then(() => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      })
      .catch(err => this.error.set(err?.message || 'No se pudo iniciar sesión'))
      .finally(() => this.loading.set(false));
  }
}
