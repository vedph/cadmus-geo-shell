import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { Thesaurus, ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { AppRepository } from '@myrmidon/cadmus-state';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthJwtService, GravatarPipe, User } from '@myrmidon/auth-jwt-login';
import { EnvService } from '@myrmidon/ngx-tools';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    GravatarPipe,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  private _authSub?: Subscription;
  private _brSub?: Subscription;

  public readonly user = signal<User | undefined>(undefined);
  public readonly logged = signal<boolean>(false);
  public readonly itemBrowsers = signal<ThesaurusEntry[] | undefined>(
    undefined,
  );
  public readonly version = signal<string>('');

  constructor(
    @Inject('itemBrowserKeys')
    private _itemBrowserKeys: { [key: string]: string },
    private _authService: AuthJwtService,
    private _appRepository: AppRepository,
    private _router: Router,
    env: EnvService,
  ) {
    this.version.set(env.get('version') || '');
  }

  public ngOnInit(): void {
    this.user.set(this._authService.currentUserValue || undefined);
    this.logged.set(this.user() !== null);

    this._authSub = this._authService.currentUser$.subscribe(
      (user: User | null) => {
        this.logged.set(this._authService.isAuthenticated(true));
        this.user.set(user || undefined);
        if (user) {
          this._appRepository.load();
        }
      },
    );

    this._brSub = this._appRepository.itemBrowserThesaurus$.subscribe(
      (thesaurus: Thesaurus | undefined) => {
        this.itemBrowsers.set(thesaurus ? thesaurus.entries : undefined);
      },
    );
  }

  ngOnDestroy(): void {
    this._authSub?.unsubscribe();
    this._brSub?.unsubscribe();
  }

  public getItemBrowserRoute(id: string): string {
    return this._itemBrowserKeys[id] || id;
  }

  public logout(): void {
    if (!this.logged()) {
      return;
    }
    this._authService
      .logout()
      .pipe(take(1))
      .subscribe((_) => {
        this._router.navigate(['/home']);
      });
  }
}
