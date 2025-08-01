import { useQuery } from '@tanstack/react-query';
import type { Card, Line, Trail } from '@/types';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

export function useCards() {
  return useQuery({
    queryKey: ['cards'],
    queryFn: () => fetchJson<Card[]>('/cards.json'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLines() {
  return useQuery({
    queryKey: ['lines'],
    queryFn: () => fetchJson<Line[]>('/lines.json'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTrails() {
  return useQuery({
    queryKey: ['trails'],
    queryFn: () => fetchJson<Trail[]>('/trails.json'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBoardData() {
  const cardsQuery = useCards();
  const linesQuery = useLines();
  
  return {
    cards: cardsQuery.data || [],
    lines: linesQuery.data || [],
    isLoading: cardsQuery.isLoading || linesQuery.isLoading,
    error: cardsQuery.error || linesQuery.error,
  };
}