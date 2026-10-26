import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, TaskCategory, TaskFilter, TaskPriority } from './domain/tasks/models/task.model';
import { TaskService } from './domain/tasks/services/task.service';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);

  readonly tasks = this.taskService.tasks;
  readonly isLoading = this.taskService.isLoading;
  readonly error = this.taskService.error;
  readonly activeFilter = signal<TaskFilter>('todas');
  readonly searchTerm = signal('');
  readonly isFormOpen = signal(false);
  readonly editingTaskId = signal<string | null>(null);
  readonly pendingDeleteId = signal<string | null>(null);
  readonly categories: TaskCategory[] = [
    'Produto',
    'Design',
    'Engenharia',
    'Marketing',
    'Operações',
  ];
  readonly priorities: TaskPriority[] = ['alta', 'media', 'baixa'];

  readonly taskForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', Validators.maxLength(240)],
    category: ['Produto' as TaskCategory, Validators.required],
    priority: ['media' as TaskPriority, Validators.required],
    dueDate: [''],
  });

  readonly filteredTasks = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchTerm().trim().toLocaleLowerCase();

    return this.tasks().filter((task) => {
      const matchesFilter =
        filter === 'todas' ||
        (filter === 'pendentes' && !task.completed) ||
        (filter === 'concluidas' && task.completed);
      const matchesQuery =
        query.length === 0 ||
        `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  });

  readonly pendingCount = computed(() => this.tasks().filter((task) => !task.completed).length);
  readonly completedCount = computed(() => this.tasks().filter((task) => task.completed).length);
  readonly completionRate = computed(() => {
    const total = this.tasks().length;
    return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
  });

  openCreateForm(): void {
    this.editingTaskId.set(null);
    this.taskForm.reset({
      title: '',
      description: '',
      category: 'Produto',
      priority: 'media',
      dueDate: '',
    });
    this.isFormOpen.set(true);
  }

  openEditForm(task: Task): void {
    this.editingTaskId.set(task.id);
    this.taskForm.reset({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingTaskId.set(null);
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formValue = this.taskForm.getRawValue();
    const taskDetails = {
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      category: formValue.category,
      priority: formValue.priority,
      dueDate: formValue.dueDate,
    };
    const editingId = this.editingTaskId();

    if (editingId) {
      const existingTask = this.tasks().find((task) => task.id === editingId);
      if (existingTask) {
        this.taskService.update({ ...existingTask, ...taskDetails });
      }
    } else {
      this.taskService.add(taskDetails);
    }

    this.closeForm();
  }

  toggleTask(taskId: string): void {
    this.taskService.toggle(taskId);
  }

  requestDelete(taskId: string): void {
    this.pendingDeleteId.set(taskId);
  }

  confirmDelete(taskId: string): void {
    this.taskService.remove(taskId);
    this.pendingDeleteId.set(null);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  onSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchTerm.set(input.value);
    }
  }

  formatDueDate(date: string): string {
    if (!date) {
      return '';
    }
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
}
