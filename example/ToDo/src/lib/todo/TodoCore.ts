export const MAX_TITLE_LENGTH = 200;

export interface Todo {
  id: string;
  title: string;
  emoji: string;
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
  updatedAt?: number;
}

export function createTodo(title: string, emoji: string): Todo {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('タスクのタイトルは空にできません');
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(`タイトルは${MAX_TITLE_LENGTH}文字以内にしてください`);
  }
  return {
    id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: trimmed,
    emoji,
    isCompleted: false,
    createdAt: Date.now(),
  };
}

export function updateTodo(todo: Todo, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Todo {
  if (updates.title !== undefined) {
    const trimmed = updates.title.trim();
    if (!trimmed) throw new Error('タスクのタイトルは空にできません');
    if (trimmed.length > MAX_TITLE_LENGTH) {
      throw new Error(`タイトルは${MAX_TITLE_LENGTH}文字以内にしてください`);
    }
    updates = { ...updates, title: trimmed };
  }
  return {
    ...todo,
    ...updates,
    updatedAt: Date.now(),
  };
}

export function validateTodoData(data: unknown): data is Todo {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d['id'] === 'string' &&
    typeof d['title'] === 'string' &&
    typeof d['emoji'] === 'string' &&
    typeof d['isCompleted'] === 'boolean' &&
    typeof d['createdAt'] === 'number'
  );
}
