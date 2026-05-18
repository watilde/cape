import React, { useEffect, useState } from 'react';

interface SaveConfirmBadgeProps {
  /** trueになった瞬間アニメーション開始。外部からリセット管理する。 */
  visible: boolean;
  onAnimationComplete?: () => void;
}

/**
 * 保存成功フィードバック。
 * scale(0→1.2→1) + opacity(1→0) のシーケンス。
 * cos()/sin() 等の実験的CSS関数は一切使用しない。
 */
const SaveConfirmBadge: React.FC<SaveConfirmBadgeProps> = ({
  visible,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'exit'>('hidden');

  useEffect(() => {
    if (!visible) {
      setPhase('hidden');
      return;
    }
    setPhase('enter');
    const exitTimer = setTimeout(() => setPhase('exit'), 600);
    const hideTimer = setTimeout(() => {
      setPhase('hidden');
      onAnimationComplete?.();
    }, 1000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [visible, onAnimationComplete]);

  if (phase === 'hidden') return null;

  return (
    <span
      className={`task-item__save-badge task-item__save-badge--${phase}`}
      aria-hidden="true"
    >
      ✓
    </span>
  );
};

export default SaveConfirmBadge;
