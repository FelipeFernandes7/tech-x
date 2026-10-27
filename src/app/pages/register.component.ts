import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';
import { AuthService } from '../domain/auth/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-shell">
        <div class="auth-main">
          <a class="auth-brand" routerLink="/" aria-label="TechX">tech<span>x</span></a>
          <div class="auth-content">
            <p class="auth-eyebrow">COMECE AGORA</p><h1>Crie sua conta</h1><p class="auth-copy">Organize suas tarefas em um só lugar.</p>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <label class="auth-field"><span>Nome</span><input type="text" formControlName="name" autocomplete="name" placeholder="Seu nome" /></label>
              <label class="auth-field"><span>E-mail</span><input type="email" formControlName="email" autocomplete="email" placeholder="voce@empresa.com" /></label>
              <label class="auth-field"><span>Senha</span><input type="password" formControlName="password" autocomplete="new-password" placeholder="Mínimo de 8 caracteres" /></label>
              <label class="auth-field"><span>Confirmar senha</span><input type="password" formControlName="confirmation" autocomplete="new-password" placeholder="Repita sua senha" /></label>
              @if (error()) { <div class="auth-error" role="alert">{{ error() }}</div> }
              <button class="auth-submit" type="submit" [disabled]="isLoading()">{{ isLoading() ? 'Criando conta...' : 'Criar conta' }}</button>
            </form>
            <p class="auth-switch">Já tem uma conta? <a routerLink="/login">Entrar</a></p>
          </div>
        </div>
        <aside class="auth-aside" aria-label="TechX produtividade"><span class="aside-icon" aria-hidden="true">✳</span><div class="aside-content"><strong>Transforme planos em progresso.</strong><p>Crie um workspace pessoal para organizar prioridades e celebrar cada tarefa concluída.</p></div></aside>
      </section>
    </main>`,
  styleUrl: 'auth.css',
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
      toast.success('Cadastro realizado com sucesso!');
      await this.router.navigate(['/']);
    } catch (error: unknown) { this.error.set(this.auth.readError(error)); }
    finally { this.isLoading.set(false); }
  }
}
