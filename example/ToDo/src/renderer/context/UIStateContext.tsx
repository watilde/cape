import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { UIState, UIAction, AnimationState } from '../../lib/types';

interface UIStateContextValue extends UIState {
  setAnimation: (id: string, state: AnimationState) => void;
  clearAnimation: (id: string) => void;
}

const initialUIState: UIState = {
  animatingIds: {},
  storageAvailable: true,
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_ANIMATION':
      return {
        ...state,
        animatingIds: { ...state.animatingIds, [action.id]: action.state },
      };
    case 'CLEAR_ANIMATION': {
      const next = { ...state.animatingIds };
      delete next[action.id];
      return { ...state, animatingIds: next };
    }
    default:
      return state;
  }
}

const UIStateContext = createContext<UIStateContextValue | null>(null);

export function UIStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);

  const setAnimation = useCallback((id: string, animState: AnimationState) => {
    dispatch({ type: 'SET_ANIMATION', id, state: animState });
  }, []);

  const clearAnimation = useCallback((id: string) => {
    dispatch({ type: 'CLEAR_ANIMATION', id });
  }, []);

  return (
    <UIStateContext.Provider value={{ ...state, setAnimation, clearAnimation }}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState(): UIStateContextValue {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error('useUIState must be used within UIStateProvider');
  return ctx;
}
