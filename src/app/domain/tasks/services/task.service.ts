import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Task, TaskCategory, TaskPriority } from '../models/task.model';

const STORAGE_KEY = 'techx-tasks';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Revisar fluxo de onboarding',
    description: 'Validar as telas de boas-vindas com o time de produto.',
    category: 'Produto',
    priority: 'alta',
    dueDate: '2026-10-27',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Preparar apresentação da sprint',
    description: 'Organizar os principais avanços para a reunião de sexta.',
    category: 'Design',
    priority: 'media',
    dueDate: '2026-10-29',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Atualizar documentação da API',
    description: 'Adicionar exemplos dos novos endpoints de projetos.',
    category: 'Engenharia',
    priority: 'baixa',
    dueDate: '2026-10-30',
    completed: true,
  },
  {
    id: 'task-4',
    title: 'Alinhar campanha de lançamento',
    description: 'Compartilhar calendário e materiais com marketing.',
    category: 'Marketing',
    priority: 'media',
    dueDate: '2026-11-02',
    completed: false,
  },
  {
    id: 'task-5',
    title: 'Planejar retrospectiva do time',
    description: 'Reunir pontos de atenção e aprendizados da semana.',
    category: 'Operações',
    priority: 'baixa',
    dueDate: '',
    completed: false,
  },
];

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;
  return (
    typeof task['id'] === 'string' &&
    typeof task['title'] === 'string' &&
    typeof task['description'] === 'string' &&
    isTaskCategory(task['category']) &&
    isTaskPriority(task['priority']) &&
    typeof task['dueDate'] === 'string' &&
    typeof task['completed'] === 'boolean'
  );
}

function isTaskCategory(value: unknown): value is TaskCategory {
  return (
    value === 'Produto' ||
    value === 'Design' ||
    value === 'Engenharia' ||
    value === 'Marketing' ||
    value === 'Operações'
  );
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'alta' || value === 'media' || value === 'baixa';
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly taskState = signal<Task[]>(INITIAL_TASKS);
  private nextId = 0;

  readonly tasks = this.taskState.asReadonly();
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    afterNextRender(() => this.restoreTasks());
  }

  add(task: Omit<Task, 'id' | 'completed'>): void {
    this.taskState.update((tasks) => [
      { ...task, id: `task-${Date.now()}-${++this.nextId}`, completed: false },
      ...tasks,
    ]);
    this.persistTasks();
  }

  update(updatedTask: Task): void {
    this.taskState.update((tasks) =>
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    this.persistTasks();
  }

  toggle(taskId: string): void {
    this.taskState.update((tasks) =>
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
    this.persistTasks();
  }

  remove(taskId: string): void {
    this.taskState.update((tasks) => tasks.filter((task) => task.id !== taskId));
    this.persistTasks();
  }

  private restoreTasks(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading.set(true);
    try {
      const storedTasks = globalThis.localStorage.getItem(STORAGE_KEY);
      if (storedTasks !== null) {
        const parsed: unknown = JSON.parse(storedTasks);
        if (!Array.isArray(parsed) || !parsed.every(isTask)) {
          throw new Error('Os dados salvos não têm o formato esperado.');
        }
        this.taskState.set(parsed);
      }
    } catch (error: unknown) {
      console.error('Não foi possível carregar as tarefas salvas.', error);
      this.error.set('Não foi possível carregar suas tarefas salvas neste dispositivo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private persistTasks(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.taskState()));
      this.error.set(null);
    } catch (error: unknown) {
      console.error('Não foi possível salvar as tarefas.', error);
      this.error.set('Não foi possível salvar as alterações neste dispositivo.');
    }
  }
}
