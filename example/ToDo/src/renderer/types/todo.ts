export interface Todo {
  id: string;
  title: string;
  emoji: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  dueDate?: string;
}

export type FilterStatus = 'all' | 'active' | 'completed';

export interface FilterConfig {
  status: FilterStatus;
  emoji?: string;
  searchQuery?: string;
}
