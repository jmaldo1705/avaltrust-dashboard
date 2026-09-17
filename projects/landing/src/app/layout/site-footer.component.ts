import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'at-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
})
export class SiteFooterComponent {
  protected readonly anio = new Date().getFullYear();

  protected readonly respaldos: readonly string[] = [
    'Créditos de libranzas',
    'Créditos digitales',
    'Créditos educativos',
    'Créditos de vehículos',
    'Créditos de arrendamiento',
    'Créditos retail',
  ];
}
