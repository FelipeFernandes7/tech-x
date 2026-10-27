import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../domain/auth/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <a class="auth-brand" routerLink="/" aria-label="TechX">tech<span>x</span></a>
        <p class="auth-eyebrow">BEM-VINDO DE VOLTA</p>
        <h1>Entre na sua conta</h1>
        <p class="auth-copy">Continue organizando suas prioridades.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="auth-field"><span>E-mail</span><input type="email" formControlName="email" autocomplete="email" /></label>
          <label class="auth-field"><span>Senha</span><input type="password" formControlName="password" autocomplete="current-password" /></label>
          @if (error()) { <div class="auth-error" role="alert">{{ error() }}</div> }
          <button class="auth-submit" type="submit" [disabled]="isLoading()">{{ isLoading() ? 'Entrando...' : 'Entrar' }}</button>
        </form>
        <p class="auth-switch">Novo por aqui? <a routerLink="/register">Criar conta</a></p>
      </section>
    </main>`,
  styles: [`
    .auth-page{min-height:100vh;display:grid;place-items:center;background:#f5f7f4;padding:24px}.auth-card{width:min(420px,100%);background:#fff;border:1px solid #e4e8e2;border-radius:20px;padding:38px;box-shadow:0 18px 50px rgba(28,41,32,.08)}.auth-brand{display:inline-block;color:#1b211c;font-size:28px;font-weight:800;text-decoration:none}.auth-brand span{color:#d6ad63}.auth-eyebrow{margin:28px 0 8px;color:#71806f;font-size:12px;font-weight:800;letter-spacing:.12em}.auth-card h1{margin:0;font-size:32px;color:#1b211c}.auth-copy{margin:8px 0 24px;color:#697268}.auth-card form{display:grid;gap:16px}.auth-field{display:grid;gap:7px;font-size:14px;font-weight:700;color:#3e483f}.auth-field input{height:46px;border:1px solid #dfe4dc;border-radius:10px;padding:0 12px;font:inherit}.auth-error{padding:10px 12px;border-radius:8px;background:#fff1f0;color:#a43b32;font-size:14px}.auth-submit{height:48px;border:0;border-radius:10px;background:#d7ae67;color:#1d241d;font-weight:800;cursor:pointer}.auth-submit:disabled{opacity:.65;cursor:wait}.auth-switch{text-align:center;margin-top:22px;color:#697268}.auth-switch a{color:#1d241d;font-weight:800}
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.isLoading()) return;
    this.isLoading.set(true); this.error.set(null);
    try {
      const response = await firstValueFrom(this.auth.login(this.form.getRawValue()));
      await this.auth.completeAuth(response);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
      await this.router.navigateByUrl(returnUrl);
    } catch (error: unknown) { this.error.set(this.auth.readError(error)); }
    finally { this.isLoading.set(false); }
  }
}
