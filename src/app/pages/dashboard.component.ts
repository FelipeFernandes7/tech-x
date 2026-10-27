import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../domain/auth/services/auth.service';
import { Task, TaskCategory, TaskFilter, TaskPriority } from '../domain/tasks/models/task.model';
import { TaskService } from '../domain/tasks/services/task.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: '../app.html',
  styleUrl: '../app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly tasks = this.taskService.tasks;
  readonly isLoading = this.taskService.isLoading;
  readonly error = this.taskService.error;
  readonly user = this.auth.user;
  readonly activeFilter = signal<TaskFilter>('todas');
  readonly searchTerm = signal('');
  readonly isFormOpen = signal(false);
  readonly editingTaskId = signal<string | null>(null);
  readonly pendingDeleteId = signal<string | null>(null);
  readonly categories: TaskCategory[] = ['Produto', 'Design', 'Engenharia', 'Marketing', 'Operações'];
  readonly priorities: TaskPriority[] = ['alta', 'media', 'baixa'];

  readonly taskForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(5000)],
    category: ['Produto' as TaskCategory, Validators.required],
    priority: ['media' as TaskPriority, Validators.required],
    dueDate: [''],
  });

  readonly filteredTasks = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchTerm().trim().toLocaleLowerCase();
    return this.tasks().filter((task) => {
      const matchesFilter = filter === 'todas' || (filter === 'pendentes' && !task.completed) || (filter === 'concluidas' && task.completed);
      const matchesQuery = !query || `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  });
  readonly pendingCount = computed(() => this.tasks().filter((task) => !task.completed).length);
  readonly completedCount = computed(() => this.tasks().filter((task) => task.completed).length);
  readonly completionRate = computed(() => this.tasks().length === 0 ? 0 : Math.round((this.completedCount() / this.tasks().length) * 100));

  ngOnInit(): void { void this.taskService.load(); }

  openCreateForm(): void {
    this.editingTaskId.set(null);
    this.taskForm.reset({ title: '', description: '', category: 'Produto', priority: 'media', dueDate: '' });
    this.isFormOpen.set(true);
  }
  openEditForm(task: Task): void {
    this.editingTaskId.set(task.id);
    this.taskForm.reset({ title: task.title, description: task.description, category: task.category, priority: task.priority, dueDate: task.dueDate });
    this.isFormOpen.set(true);
  }
  closeForm(): void { this.isFormOpen.set(false); this.editingTaskId.set(null); }
  saveTask(): void {
    if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }
    const value = this.taskForm.getRawValue();
    const details = { title: value.title.trim(), description: value.description.trim(), category: value.category, priority: value.priority, dueDate: value.dueDate };
    const editingId = this.editingTaskId();
    if (editingId) {
      const existing = this.tasks().find((task) => task.id === editingId);
      if (existing) void this.taskService.update({ ...existing, ...details });
    } else void this.taskService.add(details);
    this.closeForm();
  }
  toggleTask(id: string): void { void this.taskService.toggle(id); }
  requestDelete(id: string): void { this.pendingDeleteId.set(id); }
  confirmDelete(id: string): void { void this.taskService.remove(id); this.pendingDeleteId.set(null); }
  cancelDelete(): void { this.pendingDeleteId.set(null); }
  onSearch(event: Event): void { if (event.target instanceof HTMLInputElement) this.searchTerm.set(event.target.value); }
  formatDueDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  async logout(): Promise<void> {
    try { await firstValueFrom(this.auth.logout()); } catch { /* Local state is cleared even if the backend is unavailable. */ }
    await this.auth.clearSession();
    this.taskService.clear();
    await this.router.navigate(['/login']);
  }
}
