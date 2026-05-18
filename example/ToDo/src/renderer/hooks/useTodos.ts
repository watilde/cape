import { useTodoContext } from '../context/TodoContext';

/**
 * Todoの操作と状態を取り出すカスタムhook
 * コンポーネントはContextの内部実装を意識しなくて良い
 */
export function useTodos() {
  const { todos, storageAvailable, initialized, handleAdd, handleToggle, handleDelete } =
    useTodoContext();

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return {
    todos,
    activeTodos,
    completedTodos,
    totalCount: todos.length,
    completedCount: completedTodos.length,
    storageAvailable,
    initialized,
    addTodo: handleAdd,
    toggleTodo: handleToggle,
    deleteTodo: handleDelete,
  };
}
