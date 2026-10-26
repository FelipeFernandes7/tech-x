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
}

export type TaskFilter = 'todas' | 'pendentes' | 'concluidas';
