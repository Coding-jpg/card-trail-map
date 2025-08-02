import { useQuery } from "@tanstack/react-query";
import type { Card, Line, Trail } from "@/types";

// 把 '/xxx' 转成 '/card-trail-map/xxx'（生产环境），开发环境仍是 '/'
function resolveUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  const base = import.meta.env.BASE_URL; // dev: '/', prod: '/card-trail-map/'
  const path = url.replace(/^\//, ""); // 去掉开头的 '/'
  return new URL(path, base).toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const full = resolveUrl(url);
  const res = await fetch(full);
  // 调试日志：上线后可删
  console.log("[fetch]", full, res.status);
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

  // 调试：看看数据有没有到
  console.log("[data]", {
    cardsLen: cardsQuery.data?.length,
    linesLen: linesQuery.data?.length,
    isLoading: cardsQuery.isLoading || linesQuery.isLoading,
    error: cardsQuery.error || linesQuery.error,
  });

  return {
    cards: cardsQuery.data || [],
    lines: linesQuery.data || [],
    isLoading: cardsQuery.isLoading || linesQuery.isLoading,
    error: cardsQuery.error || linesQuery.error,
  };
}
