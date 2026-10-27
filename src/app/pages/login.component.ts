import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../domain/auth/services/auth.service';

type LoginField = 'email' | 'password';

const FIELD_MESSAGES: Record<LoginField, Record<string, string>> = {
  email: {
    required: 'Informe seu e-mail.',
    email: 'Digite um e-mail válido, como nome@empresa.com.',
    maxlength: 'O e-mail é longo demais.',
  },
  password: {
    required: 'Informe sua senha.',
    maxlength: 'A senha é longa demais.',
  },
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="login-title">
        <a class="auth-brand" routerLink="/" aria-label="TechX, página inicial"
          >tech<span>x</span></a
        >

        <h1 id="login-title">Bem-vindo de volta</h1>
        <p class="auth-copy">Entre para continuar organizando suas prioridades.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="isLoading()">
          <div class="auth-field">
            <label for="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              formControlName="email"
              autocomplete="email"
              inputmode="email"
              autocapitalize="none"
              spellcheck="false"
              [class.is-invalid]="fieldError('email')"
              [attr.aria-invalid]="fieldError('email') ? 'true' : null"
              [attr.aria-describedby]="fieldError('email') ? 'login-email-error' : null"
            />
            @if (fieldError('email'); as message) {
              <small class="auth-field-error" id="login-email-error">{{ message }}</small>
            }
          </div>

          <div class="auth-field">
            <label for="login-password">Senha</label>
            <div class="auth-password">
              <input
                id="login-password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                [class.is-invalid]="fieldError('password')"
                [attr.aria-invalid]="fieldError('password') ? 'true' : null"
                [attr.aria-describedby]="fieldError('password') ? 'login-password-error' : null"
              />
              <button
                class="auth-toggle"
                type="button"
                (click)="togglePassword()"
                [attr.aria-pressed]="showPassword()"
                [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
              >
                {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
              </button>
            </div>
            @if (fieldError('password'); as message) {
              <small class="auth-field-error" id="login-password-error">{{ message }}</small>
            }
          </div>

          @if (error()) {
            <div class="auth-error" role="alert">{{ error() }}</div>
          }

          <button class="auth-submit" type="submit" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="auth-spinner" aria-hidden="true"></span>
              Entrando...
            } @else {
              Entrar
            }
          </button>
        </form>

        <p class="auth-switch">Novo por aqui? <a routerLink="/register">Criar conta</a></p>
      </section>
    </main>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        background: #f5f7f4;
        padding: 24px;
      }
      .auth-card {
        width: min(420px, 100%);
        background: #fff;
        border: 1px solid #e4e8e2;
        border-radius: 20px;
        padding: 38px;
        box-shadow: 0 18px 50px rgba(28, 41, 32, 0.08);
      }
      .auth-brand {
        display: inline-block;
        color: #1b211c;
        font-size: 28px;
        font-weight: 800;
        text-decoration: none;
      }
      .auth-brand span {
        color: #d6ad63;
      }
      .auth-card h1 {
        margin: 28px 0 0;
        font-size: 32px;
        line-height: 1.15;
        color: #1b211c;
      }
      .auth-copy {
        margin: 8px 0 24px;
        color: #5d675c;
        line-height: 1.5;
      }
      .auth-card form {
        display: grid;
        gap: 18px;
      }
      .auth-field {
        display: grid;
        gap: 7px;
      }
      .auth-field label {
        font-size: 14px;
        font-weight: 700;
        color: #3e483f;
      }
      .auth-field input {
        width: 100%;
        height: 46px;
        border: 1px solid #dfe4dc;
        border-radius: 10px;
        padding: 0 12px;
        font: inherit;
        color: #1b211c;
        background: #fff;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .auth-field input:hover {
        border-color: #c9d0c5;
      }
      .auth-field input:focus-visible {
        outline: none;
        border-color: #c99a45;
        box-shadow: 0 0 0 3px rgba(215, 174, 103, 0.35);
      }
      .auth-field input.is-invalid {
        border-color: #c8493f;
      }
      .auth-field input.is-invalid:focus-visible {
        box-shadow: 0 0 0 3px rgba(200, 73, 63, 0.2);
      }
      .auth-field-error {
        color: #a43b32;
        font-size: 13px;
      }
      .auth-password {
        position: relative;
      }
      .auth-password input {
        padding-right: 88px;
      }
      .auth-toggle {
        position: absolute;
        top: 50%;
        right: 6px;
        transform: translateY(-50%);
        height: 34px;
        padding: 0 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #3e483f;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .auth-toggle:hover {
        background: #f0f3ee;
      }
      .auth-toggle:focus-visible {
        outline: 2px solid #c99a45;
        outline-offset: 1px;
      }
      .auth-error {
        padding: 10px 12px;
        border-radius: 8px;
        background: #fff1f0;
        color: #a43b32;
        font-size: 14px;
        line-height: 1.4;
      }
      .auth-submit {
        height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 0;
        border-radius: 10px;
        background: #d7ae67;
        color: #1d241d;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .auth-submit:hover:not(:disabled) {
        background: #cfa557;
      }
      .auth-submit:focus-visible {
        outline: 3px solid rgba(215, 174, 103, 0.5);
        outline-offset: 2px;
      }
      .auth-submit:disabled {
        opacity: 0.7;
        cursor: wait;
      }
      .auth-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(29, 36, 29, 0.25);
        border-top-color: #1d241d;
        border-radius: 50%;
        animation: auth-spin 0.7s linear infinite;
      }
      @keyframes auth-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .auth-spinner {
          animation-duration: 2s;
        }
        .auth-field input,
        .auth-submit {
          transition: none;
        }
      }
      .auth-switch {
        text-align: center;
        margin-top: 22px;
        color: #5d675c;
      }
      .auth-switch a {
        color: #1d241d;
        font-weight: 800;
      }
      .auth-switch a:focus-visible {
        outline: 2px solid #c99a45;
        outline-offset: 2px;
        border-radius: 4px;
      }
      @media (max-width: 480px) {
        .auth-page {
          padding: 16px;
        }
        .auth-card {
          padding: 28px 22px;
        }
        .auth-card h1 {
          font-size: 28px;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly dashboardRoute = '/';

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.error()) this.error.set(null);
    });
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  fieldError(field: LoginField): string | null {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) return null;

    const errorKey = Object.keys(control.errors ?? {})[0];
    return FIELD_MESSAGES[field][errorKey] ?? 'Valor inválido.';
  }

  async submit(): Promise<void> {
    if (this.isLoading()) return;

    const email = this.form.controls.email;
    email.setValue(email.value.trim());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.auth.login(this.form.getRawValue()));
      await this.auth.completeAuth(response);

      await this.router.navigateByUrl(this.resolveRedirectUrl(), { replaceUrl: true });
    } catch (error: unknown) {
      this.error.set(this.auth.readError(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private resolveRedirectUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    const isSafeInternalPath =
      !!returnUrl &&
      returnUrl.startsWith('/') &&
      !returnUrl.startsWith('//') &&
      !returnUrl.startsWith('/\\') &&
      !returnUrl.startsWith('/login');

    return isSafeInternalPath ? returnUrl : this.dashboardRoute;
  }

  private focusFirstInvalidField(): void {
    this.host.nativeElement.querySelector<HTMLInputElement>('input.ng-invalid')?.focus();
  }
}
