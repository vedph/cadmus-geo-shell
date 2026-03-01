import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';

@Component({
  selector: 'cadmus-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  public readonly logged = signal<boolean>(false);

  constructor(authService: AuthJwtService) {
    this.logged.set(authService.currentUserValue !== null);
  }
}
