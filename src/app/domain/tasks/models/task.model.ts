export type TaskPriority = 'alta' | 'media' | 'baixa';

export type TaskCategory =
  | 'Produto'
  | 'Design'
  | 'Engenharia'
  | 'Marketing'
  | 'Operações';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  completed: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskFilter = 'todas' | 'pendentes' | 'concluidas';
