import React from 'react';

interface EditHintTextProps {
  isError: boolean;
}

/**
 * 編集モード中に入力フィールド下に表示するヒントテキスト。
 * エラー時はメッセージが切り替わる。
 */
const EditHintText: React.FC<EditHintTextProps> = ({ isError }) => {
  return (
    <p
      className={`task-item__edit-hint${isError ? ' task-item__edit-hint--error' : ''}`}
      role={isError ? 'alert' : undefined}
      aria-live={isError ? 'polite' : undefined}
    >
      {isError ? 'タスクは空にできません' : 'Enter で保存 · Esc でキャンセル'}
    </p>
  );
};

export default EditHintText;
