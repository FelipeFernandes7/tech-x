import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private initialization: Promise<AuthUser | null> | null = null;

  readonly user = signal<AuthUser | null>(null);
  readonly isInitialized = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  register(payload: RegisterPayload): Observable<{ user: AuthUser }> {
    return this.http.post<{ user: AuthUser }>(`${API_BASE_URL}/auth/register`, payload);
  }

  login(payload: LoginPayload): Observable<{ user: AuthUser }> {
    return this.http.post<{ user: AuthUser }>(`${API_BASE_URL}/auth/login`, payload);
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/logout`, {});
  }

  ensureInitialized(): Promise<AuthUser | null> {
    if (this.initialization) return this.initialization;
    this.initialization = firstValueFrom(
      this.http.get<AuthUser>(`${API_BASE_URL}/auth/me`),
    ).then((user) => {
      this.user.set(user);
      this.isInitialized.set(true);
      return user;
    }).catch(() => {
      this.user.set(null);
      this.isInitialized.set(true);
      return null;
    });
    return this.initialization;
  }

  async completeAuth(response: { user: AuthUser }): Promise<void> {
    this.user.set(response.user);
    this.isInitialized.set(true);
  }

  async clearSession(): Promise<void> {
    this.user.set(null);
    this.initialization = null;
    this.isInitialized.set(false);
  }

  readError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Não foi possível conectar ao servidor.';
      if (error.status === 409) return 'Este e-mail já está cadastrado.';
      if (error.status === 401) return 'E-mail ou senha inválidos.';
      if (typeof error.error?.message === 'string') return error.error.message;
      if (Array.isArray(error.error?.message)) return error.error.message.join(' ');
    }
    return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
