/**
 * TodoRepositoryユニットテスト
 */
import {
  initialize,
  getAllTodos,
  addTodo,
  updateTodoInRepo,
  removeTodo,
  toggleTodoCompletion,
  getTodosByStatus,
  _resetForTest,
} from '../lib/repository/todoRepository';

beforeEach(() => {
  localStorage.clear();
  _resetForTest();
});

describe('initialize', () => {
  it('空のストレージで初期化すると空配列になる', () => {
    initialize();
    expect(getAllTodos()).toEqual([]);
  });
});

describe('addTodo', () => {
  it('Todoを追加できる', () => {
    initialize();
    const todo = addTodo({ title: 'テスト', emoji: '📝' });
    expect(todo.isCompleted).toBe(false);
    expect(getAllTodos()).toHaveLength(1);
  });

  it('追加したTodoがlocalStorageに永続化される', () => {
    initialize();
    addTodo({ title: '永続化テスト', emoji: '💾' });

    // 別のリポジトリインスタンスとして再初期化
    _resetForTest();
    initialize();
    const todos = getAllTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('永続化テスト');
  });
});

describe('toggleTodoCompletion', () => {
  it('未完了→完了にトグルできる', () => {
    initialize();
    const todo = addTodo({ title: 'タスク', emoji: '✅' });

    const toggled = toggleTodoCompletion(todo.id);
    expect(toggled.isCompleted).toBe(true);
    expect(toggled.completedAt).not.toBeNull();
  });

  it('完了→未完了にトグルできる', () => {
    initialize();
    const todo = addTodo({ title: 'タスク', emoji: '✅' });
    toggleTodoCompletion(todo.id);
    const unToggled = toggleTodoCompletion(todo.id);
    expect(unToggled.isCompleted).toBe(false);
    expect(unToggled.completedAt).toBeNull();
  });

  it('存在しないIDでエラーをスロー', () => {
    initialize();
    expect(() => toggleTodoCompletion('nonexistent')).toThrow(
      'Todo not found: nonexistent'
    );
  });

  it('トグル後の状態がlocalStorageに永続化される', () => {
    initialize();
    const todo = addTodo({ title: '永続化', emoji: '💾' });
    toggleTodoCompletion(todo.id);

    _resetForTest();
    initialize();
    const todos = getAllTodos();
    expect(todos[0].isCompleted).toBe(true);
  });
});

describe('getTodosByStatus', () => {
  it('activeフィルターで未完了タスクのみ返す', () => {
    initialize();
    addTodo({ title: '未完了', emoji: '📝' });
    const todo2 = addTodo({ title: '完了する', emoji: '✅' });
    toggleTodoCompletion(todo2.id);

    const active = getTodosByStatus('active');
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('未完了');
  });

  it('completedフィルターで完了済みタスクのみ返す', () => {
    initialize();
    addTodo({ title: '未完了', emoji: '📝' });
    const todo2 = addTodo({ title: '完了する', emoji: '✅' });
    toggleTodoCompletion(todo2.id);

    const completed = getTodosByStatus('completed');
    expect(completed).toHaveLength(1);
    expect(completed[0].title).toBe('完了する');
  });
});

describe('removeTodo', () => {
  it('Todoを削除できる', () => {
    initialize();
    const todo = addTodo({ title: '削除対象', emoji: '🗑️' });
    removeTodo(todo.id);
    expect(getAllTodos()).toHaveLength(0);
  });
});
