import { useCallback, useRef, useState } from 'react';
import type { Action, BoardController, BoardState, Card, Line } from '@/types';

const DEFAULT_BOARD_STATE: BoardState = {
  transform: { x: 0, y: 0, scale: 0.5 },
  pinnedCards: new Set(),
  highlightedLines: new Set(),
  expandedMeta: new Map(),
  dimmedCards: new Set(),
  filters: {
    kinds: new Set(['profile', 'goal', 'hobby', 'skill', 'project']),
    tags: new Set(),
    onlyConnected: false,
  },
};

interface UseBoardControllerProps {
  cards: Card[];
  lines: Line[];
  onStateChange?: (state: BoardState) => void;
}

export function useBoardController({ 
  cards, 
  lines, 
  onStateChange 
}: UseBoardControllerProps): BoardController {
  const [state, setState] = useState<BoardState>(DEFAULT_BOARD_STATE);
  const animationRef = useRef<number>();
  
  const updateState = useCallback((updates: Partial<BoardState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  const overview = useCallback(async (zoom = 0.5) => {
    // Calculate bounds of all cards
    const bounds = cards.reduce((acc, card) => {
      if (!card.pos) return acc;
      return {
        minX: Math.min(acc.minX, card.pos.x),
        maxX: Math.max(acc.maxX, card.pos.x),
        minY: Math.min(acc.minY, card.pos.y),
        maxY: Math.max(acc.maxY, card.pos.y),
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    if (bounds.minX === Infinity) {
      updateState({
        transform: { x: 0, y: 0, scale: zoom },
        dimmedCards: new Set(),
        highlightedLines: new Set(),
      });
      return;
    }

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    return new Promise<void>(resolve => {
      animationRef.current = requestAnimationFrame(() => {
        updateState({
          transform: { x: -centerX, y: -centerY, scale: zoom },
          dimmedCards: new Set(),
          highlightedLines: new Set(),
        });
        setTimeout(resolve, 500); // Match CSS transition
      });
    });
  }, [cards, updateState]);

  const focus = useCallback(async (cardId: string, opts: { zoom?: number; duration?: number; ease?: string } = {}) => {
    const { zoom = 1.0, duration = 450 } = opts;
    const card = cards.find(c => c.id === cardId);
    
    if (!card?.pos) return;

    // Find connected cards
    const connectedCards = new Set([cardId]);
    lines.forEach(line => {
      if (line.source === cardId) connectedCards.add(line.target);
      if (line.target === cardId) connectedCards.add(line.source);
    });

    // Dim non-connected cards
    const dimmedCards = new Set(
      cards
        .filter(c => !connectedCards.has(c.id))
        .map(c => c.id)
    );

    return new Promise<void>(resolve => {
      animationRef.current = requestAnimationFrame(() => {
        updateState({
          transform: { x: -card.pos!.x, y: -card.pos!.y, scale: zoom },
          selectedCard: cardId,
          dimmedCards,
        });
        setTimeout(resolve, duration);
      });
    });
  }, [cards, lines, updateState]);

  const highlightLink = useCallback(({ from, to, kind }) => {
    const lineId = `${from}-${kind}-${to}`;
    updateState({
      highlightedLines: new Set([lineId]),
    });
  }, [updateState]);

  const revealMeta = useCallback((cardId: string, fields: string[]) => {
    updateState({
      expandedMeta: new Map(state.expandedMeta).set(cardId, fields),
    });
  }, [state.expandedMeta, updateState]);

  const pin = useCallback((cardId: string) => {
    updateState({
      pinnedCards: new Set([...state.pinnedCards, cardId]),
    });
  }, [state.pinnedCards, updateState]);

  const unpin = useCallback((cardId: string) => {
    const newPinned = new Set(state.pinnedCards);
    newPinned.delete(cardId);
    updateState({
      pinnedCards: newPinned,
    });
  }, [state.pinnedCards, updateState]);

  const pulse = useCallback((cardId: string) => {
    // Trigger pulse animation via CSS class
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.classList.add('animate-pulse-card');
      setTimeout(() => {
        cardElement.classList.remove('animate-pulse-card');
      }, 600);
    }
  }, []);

  const run = useCallback(async (actions: Action[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'overview':
          await overview(action.zoom);
          break;
        case 'focus':
          await focus(action.card, { zoom: action.zoom, duration: action.duration });
          break;
        case 'linkHighlight':
          highlightLink({ from: action.from, to: action.to, kind: action.kind });
          break;
        case 'revealMeta':
          revealMeta(action.card, action.fields);
          break;
        case 'pin':
          pin(action.card);
          break;
        case 'unpin':
          unpin(action.card);
          break;
        case 'pulse':
          pulse(action.card);
          break;
      }
    }
  }, [overview, focus, highlightLink, revealMeta, pin, unpin, pulse]);

  const getState = useCallback(() => state, [state]);

  const setStateController = useCallback((newState: Partial<BoardState>) => {
    updateState(newState);
  }, [updateState]);

  return {
    run,
    overview,
    focus,
    highlightLink,
    revealMeta,
    pin,
    unpin,
    pulse,
    getState,
    setState: setStateController,
  };
}