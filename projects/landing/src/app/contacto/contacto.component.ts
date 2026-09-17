import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FotoComponent } from '../ui/foto.component';
import { PageHeroComponent } from '../ui/page-hero.component';
import { definirSeo } from '../ui/seo';
import { MailService, plantillaCorreo } from './mail.service';
import { TurnstileComponent } from './turnstile.component';

type Estado = 'inactivo' | 'enviando' | 'enviado' | 'error';

const DESTINATARIO = 'comercial@avaltrust.co';

@Component({
  selector: 'at-contacto',
  imports: [ReactiveFormsModule, PageHeroComponent, TurnstileComponent, RouterLink, FotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css',
})
export class ContactoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mail = inject(MailService);
  private readonly captcha = viewChild(TurnstileComponent);

  protected readonly estado = signal<Estado>('inactivo');
  protected readonly token = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    empresa: [''],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[\d\s()+-]{7,20}$/)]],
    mensaje: ['', [Validators.required, Validators.minLength(10)]],
    acepta: [false, Validators.requiredTrue],
  });

  constructor() {
    definirSeo({
      titulo: 'Contáctanos | AvalTrust',
      descripcion:
        'En AvalTrust estamos listos para construir soluciones de aval y garantía que impulsen tu crecimiento financiero. ¡Hablemos y transformemos juntos el acceso al crédito!',
      ruta: '/contacto',
    });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!this.token()) {
      this.estado.set('error');
      return;
    }

    const datos = this.formulario.getRawValue();
    this.estado.set('enviando');

    this.mail
      .enviar({
        para: [DESTINATARIO],
        asunto: `Nuevo mensaje de contacto - ${datos.nombre}`,
        turnstileToken: this.token(),
        cuerpoHtml: plantillaCorreo({
          titulo: 'Nuevo mensaje de contacto',
          introduccion: 'Alguien escribió desde el formulario de contacto del sitio.',
          filas: [
            ['Nombre', datos.nombre],
            ['Empresa', datos.empresa || 'No indicada'],
            ['Correo', datos.correo],
            ['Teléfono', datos.telefono],
            ['Fecha', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })],
          ],
          bloques: [['Mensaje', datos.mensaje]],
        }),
      })
      .subscribe({
        next: () => {
          this.estado.set('enviado');
          this.formulario.reset();
          this.token.set(null);
          this.captcha()?.reiniciar();
        },
        error: () => {
          this.estado.set('error');
          this.token.set(null);
          this.captcha()?.reiniciar();
        },
      });
  }
}
