/**
 * TaskList コンポーネント
 * タスクリストコンテナ
 * DA仕様: overflow-y auto / scrollbar非表示 / touch-action: pan-y
 */

import React, { useRef } from 'react';
import { useTodos } from '../hooks/useTodos';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';

export function TaskList(): React.JSX.Element {
  const { todos, initialized } = useTodos();
  // 最後に追加されたタスクIDを追跡してenteringアニメーションを制御
  const prevTodosRef = useRef<string[]>([]);
  const newTodoIds = new Set<string>();

  if (initialized) {
    const currentIds = todos.map((t) => t.id);
    for (const id of currentIds) {
      if (!prevTodosRef.current.includes(id)) {
        newTodoIds.add(id);
      }
    }
    prevTodosRef.current = currentIds;
  }

  if (!initialized) {
    // ローディング中は空のコンテナ（コンソールエラーなし）
    return <div className="task-list task-list--loading" aria-label="タスクリスト" />;
  }

  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="task-list" role="list" aria-label="タスクリスト">
      {todos.map((todo) => (
        <TaskItem key={todo.id} todo={todo} isNew={newTodoIds.has(todo.id)} />
      ))}
    </ul>
  );
}
