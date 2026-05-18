/**
 * TaskListコンポーネント
 * - 未完了タスクを上部、完了済みを下部にグループ化
 * - DAワイヤーフレーム準拠のセクションラベル
 * - 全完了時のお祝いメッセージ
 */
import React, { useMemo } from 'react';
import { Todo } from '../../lib/types/todo';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  todos: Todo[];
  onToggleCompletion: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TaskList({
  todos,
  onToggleCompletion,
  onRemove,
}: TaskListProps): JSX.Element {
  const { activeTodos, completedTodos } = useMemo(() => {
    return {
      activeTodos: todos.filter((t) => !t.isCompleted),
      completedTodos: todos.filter((t) => t.isCompleted),
    };
  }, [todos]);

  const isAllCompleted =
    todos.length > 0 && activeTodos.length === 0;

  if (todos.length === 0) {
    return (
      <div className="task-list__empty" data-testid="empty-state">
        <p className="task-list__empty-text">
          タスクがありません✨ 新しいタスクを追加してみよう！
        </p>
      </div>
    );
  }

  return (
    <div className="task-list" data-testid="task-list">
      {/* 全完了時のお祝いメッセージ */}
      {isAllCompleted && (
        <div className="task-list__all-completed" data-testid="all-completed-message">
          <p className="task-list__all-completed-text">
            全部完了！素晴らしい✨
          </p>
        </div>
      )}

      {/* 未完了タスクセクション */}
      {activeTodos.length > 0 && (
        <ul className="task-list__section" aria-label="未完了のタスク">
          {activeTodos.map((todo) => (
            <TaskItem
              key={todo.id}
              todo={todo}
              onToggleCompletion={onToggleCompletion}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      {/* 完了済みセクション（1件以上の時のみ表示） */}
      {completedTodos.length > 0 && (
        <section
          className="task-list__completed-section"
          aria-label={`完了済みタスク（${completedTodos.length}件）`}
        >
          <h2 className="task-list__section-label">
            完了済み ({completedTodos.length}件)
          </h2>
          <ul className="task-list__section">
            {completedTodos.map((todo) => (
              <TaskItem
                key={todo.id}
                todo={todo}
                onToggleCompletion={onToggleCompletion}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
