import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import { ApiTask, Task, TaskCategory, TaskPriority } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly taskState = signal<Task[]>([]);

  readonly tasks = this.taskState.asReadonly();
  readonly isLoading = signal(false);
  readonly isMutating = signal(false);
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const apiTasks = await firstValueFrom(this.http.get<ApiTask[]>(`${API_BASE_URL}/tasks`));
      this.taskState.set(apiTasks.map((task) => this.toTask(task)));
    } catch (error: unknown) {
      this.error.set(this.readError(error, 'Não foi possível carregar suas tarefas.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async add(task: Omit<Task, 'id' | 'completed'>): Promise<void> {
    await this.mutate(async () => {
      const created = await firstValueFrom(this.http.post<ApiTask>(`${API_BASE_URL}/tasks`, {
        title: task.title,
        description: task.description || undefined,
      }));
      this.taskState.update((tasks) => [this.toTask(created, task.category, task.priority, task.dueDate), ...tasks]);
    });
  }

  async update(updatedTask: Task): Promise<void> {
    await this.mutate(async () => {
      const saved = await firstValueFrom(this.http.patch<ApiTask>(`${API_BASE_URL}/tasks/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description || undefined,
      }));
      this.taskState.update((tasks) => tasks.map((task) => task.id === saved.id
        ? this.toTask(saved, updatedTask.category, updatedTask.priority, updatedTask.dueDate)
        : task));
    });
  }

  async toggle(taskId: string): Promise<void> {
    const current = this.taskState().find((task) => task.id === taskId);
    if (!current) return;
    await this.mutate(async () => {
      const saved = await firstValueFrom(this.http.patch<ApiTask>(`${API_BASE_URL}/tasks/${taskId}/completion`, {
        completed: !current.completed,
      }));
      this.taskState.update((tasks) => tasks.map((task) => task.id === saved.id
        ? this.toTask(saved, current.category, current.priority, current.dueDate)
        : task));
    });
  }

  async remove(taskId: string): Promise<void> {
    await this.mutate(async () => {
      await firstValueFrom(this.http.delete<void>(`${API_BASE_URL}/tasks/${taskId}`));
      this.taskState.update((tasks) => tasks.filter((task) => task.id !== taskId));
    });
  }

  clear(): void {
    this.taskState.set([]);
    this.error.set(null);
  }

  private async mutate(operation: () => Promise<void>): Promise<boolean> {
    if (this.isMutating()) return false;
    this.isMutating.set(true);
    this.error.set(null);
    try {
      await operation();
      return true;
    } catch (error: unknown) {
      this.error.set(this.readError(error, 'Não foi possível salvar a alteração da tarefa.'));
      return false;
    } finally {
      this.isMutating.set(false);
    }
  }

  private toTask(apiTask: ApiTask, category: TaskCategory = 'Produto', priority: TaskPriority = 'media', dueDate = ''): Task {
    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description ?? '',
      completed: apiTask.completed,
      category,
      priority,
      dueDate,
      userId: apiTask.userId,
      createdAt: apiTask.createdAt,
      updatedAt: apiTask.updatedAt,
    };
  }

  private readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Não foi possível conectar ao servidor.';
      if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
      if (typeof error.error?.message === 'string') return error.error.message;
      if (Array.isArray(error.error?.message)) return error.error.message.join(' ');
    }
    return fallback;
  }
}
