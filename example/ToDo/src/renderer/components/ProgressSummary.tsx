import React, { useEffect, useRef, useState } from 'react';
import { useTodos } from '../hooks/useTodos';

export const ProgressSummary: React.FC = () => {
  const { totalCount, completedCount } = useTodos();
  const prevCount = useRef(completedCount);
  const [isPop, setIsPop] = useState(false);

  // 完了数が増えたときにポップアニメーション
  useEffect(() => {
    if (completedCount !== prevCount.current) {
      setIsPop(true);
      const timer = setTimeout(() => setIsPop(false), 320);
      prevCount.current = completedCount;
      return () => clearTimeout(timer);
    }
  }, [completedCount]);

  if (totalCount === 0) return null;

  const allDone = completedCount === totalCount;

  return (
    <p
      className={['progress-summary', isPop ? 'progress-summary--pop' : ''].filter(Boolean).join(' ')}
      aria-live="polite"
      aria-atomic="true"
    >
      {allDone ? (
        <span>全部完了！最高✨</span>
      ) : (
        <span>
          <span className="progress-summary__count">{completedCount}</span>
          {' / '}
          <span>{totalCount}</span>
          {' 完了 🎉'}
        </span>
      )}
    </p>
  );
};
