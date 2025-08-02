import { useQuery } from "@tanstack/react-query";
import type { Card, Line, Trail } from "@/types";

// 把 '/xxx' 转为 `${import.meta.env.BASE_URL}xxx`，生产下会是 '/card-trail-map/xxx'
function resolveUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url; // 已是绝对地址，直接用
  const base = import.meta.env.BASE_URL; // dev: '/', prod: '/card-trail-map/'
  const path = url.replace(/^\//, ""); // 去掉开头的 '/'
  return new URL(path, base).toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const full = resolveUrl(url);
  const res = await fetch(full);
  if (!res.ok)
    throw new Error(`Failed to fetch ${full}: ${res.status} ${res.statusText}`);
  return res.json();
}

export function useCards() {
  return useQuery({
    queryKey: ["cards"],
    queryFn: () => fetchJson<Card[]>("/cards.json"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLines() {
  return useQuery({
    queryKey: ["lines"],
    queryFn: () => fetchJson<Line[]>("/lines.json"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrails() {
  return useQuery({
    queryKey: ["trails"],
    queryFn: () => fetchJson<Trail[]>("/trails.json"),
    staleTime: 5 * 60 * 1000,
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
