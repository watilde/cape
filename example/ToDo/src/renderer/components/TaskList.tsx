/**
 * TaskList.tsx
 * クイックフィックス: レンダー中副作用（newTodoIds/prevTodosRef）の修正
 *
 * 修正内容:
 *   - newTodoIds の Set をレンダー中に直接変更していた副作用を useEffect に移動
 *   - prevTodosRef の更新もレンダー後（useEffect内）に統一
 *   - isNew prop をTodoCardに正しく渡す
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TodoCard, TodoItem } from './TodoCard';
import { ConfettiOverlay } from './ConfettiOverlay';

interface TaskListProps {
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = React.memo(({
  todos,
  onToggleComplete,
  onDelete,
}) => {
  // クイックフィックス: newTodoIds をstateとして管理し、レンダー中の副作用を排除
  const [newTodoIds, setNewTodoIds] = useState<Set<string>>(new Set());

  // 前回のtodos IDリストを記録（レンダー後に更新）
  const prevTodoIdsRef = useRef<Set<string>>(new Set(todos.map((t) => t.id)));

  useEffect(() => {
    // レンダー後に新規追加されたIDを検出（レンダー中副作用の修正）
    const currentIds = new Set(todos.map((t) => t.id));
    const addedIds = new Set<string>();

    currentIds.forEach((id) => {
      if (!prevTodoIdsRef.current.has(id)) {
        addedIds.add(id);
      }
    });

    if (addedIds.size > 0) {
      setNewTodoIds(addedIds);

      // Effect-02: スライドイン完了後（0.85s）にnewTodoIdsをクリア
      const timer = setTimeout(() => {
        setNewTodoIds((prev) => {
          const next = new Set(prev);
          addedIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 850);

      // prevTodoIdsRef を更新（useEffect内で行うことでレンダー中副作用を排除）
      prevTodoIdsRef.current = currentIds;
      return () => clearTimeout(timer);
    }

    // IDが変わった場合もprevTodoIdsRefを更新
    prevTodoIdsRef.current = currentIds;
  }, [todos]);

  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete],
  );

  if (todos.length === 0) {
    return (
      <div className="task-list task-list--empty" aria-label="タスクリスト（空）">
        <p className="task-list__empty-message">タスクがありません ✨</p>
        <ConfettiOverlay todos={todos} />
      </div>
    );
  }

  return (
    <div className="task-list" role="list" aria-label="タスクリスト">
      {todos.map((todo) => (
        <div key={todo.id} role="listitem">
          <TodoCard
            todo={todo}
            isNew={newTodoIds.has(todo.id)}
            onToggleComplete={onToggleComplete}
            onDelete={handleDelete}
          />
        </div>
      ))}
      {/* Effect-04: 全タスク完了検知 */}
      <ConfettiOverlay todos={todos} />
    </div>
  );
});

TaskList.displayName = 'TaskList';
