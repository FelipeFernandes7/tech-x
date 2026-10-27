import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../domain/auth/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page"><section class="auth-card">
      <a class="auth-brand" routerLink="/" aria-label="TechX">tech<span>x</span></a>
      <p class="auth-eyebrow">COMECE AGORA</p><h1>Crie sua conta</h1>
      <p class="auth-copy">Organize suas tarefas em um só lugar.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label class="auth-field"><span>Nome</span><input type="text" formControlName="name" autocomplete="name" /></label>
        <label class="auth-field"><span>E-mail</span><input type="email" formControlName="email" autocomplete="email" /></label>
        <label class="auth-field"><span>Senha</span><input type="password" formControlName="password" autocomplete="new-password" /></label>
        <label class="auth-field"><span>Confirmar senha</span><input type="password" formControlName="confirmation" autocomplete="new-password" /></label>
        @if (error()) { <div class="auth-error" role="alert">{{ error() }}</div> }
        <button class="auth-submit" type="submit" [disabled]="isLoading()">{{ isLoading() ? 'Criando conta...' : 'Criar conta' }}</button>
      </form>
      <p class="auth-switch">Já tem uma conta? <a routerLink="/login">Entrar</a></p>
    </section></main>`,
  styles: [`
    .auth-page{min-height:100vh;display:grid;place-items:center;background:#f5f7f4;padding:24px}.auth-card{width:min(420px,100%);background:#fff;border:1px solid #e4e8e2;border-radius:20px;padding:38px;box-shadow:0 18px 50px rgba(28,41,32,.08)}.auth-brand{display:inline-block;color:#1b211c;font-size:28px;font-weight:800;text-decoration:none}.auth-brand span{color:#d6ad63}.auth-eyebrow{margin:28px 0 8px;color:#71806f;font-size:12px;font-weight:800;letter-spacing:.12em}.auth-card h1{margin:0;font-size:32px;color:#1b211c}.auth-copy{margin:8px 0 24px;color:#697268}.auth-card form{display:grid;gap:16px}.auth-field{display:grid;gap:7px;font-size:14px;font-weight:700;color:#3e483f}.auth-field input{height:46px;border:1px solid #dfe4dc;border-radius:10px;padding:0 12px;font:inherit}.auth-error{padding:10px 12px;border-radius:8px;background:#fff1f0;color:#a43b32;font-size:14px}.auth-submit{height:48px;border:0;border-radius:10px;background:#d7ae67;color:#1d241d;font-weight:800;cursor:pointer}.auth-submit:disabled{opacity:.65;cursor:wait}.auth-switch{text-align:center;margin-top:22px;color:#697268}.auth-switch a{color:#1d241d;font-weight:800}
  `],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmation: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    if (value.password !== value.confirmation) { this.error.set('As senhas não coincidem.'); return; }
    if (this.isLoading()) return;
    this.isLoading.set(true); this.error.set(null);
    try {
      const response = await firstValueFrom(this.auth.register({ name: value.name.trim(), email: value.email.trim(), password: value.password }));
      await this.auth.completeAuth(response);
      await this.router.navigate(['/']);
    } catch (error: unknown) { this.error.set(this.auth.readError(error)); }
    finally { this.isLoading.set(false); }
  }
}
