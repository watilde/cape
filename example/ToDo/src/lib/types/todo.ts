/**
 * Todo型定義
 * isCompleted フィールドを追加（POA定義のフラグトグル方式）
 */
export interface Todo {
  id: string;
  title: string;
  emoji: string;
  isCompleted: boolean;
  createdAt: number;
  completedAt: number | null;
}

export type CreateTodoInput = Pick<Todo, 'title' | 'emoji'>;

export type UpdateTodoInput = Partial<
  Pick<Todo, 'title' | 'emoji' | 'isCompleted' | 'completedAt'>
>;
