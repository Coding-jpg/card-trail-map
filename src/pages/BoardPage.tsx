import { useNavigate } from "react-router-dom";
import { useBoardData } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function BoardPage() {
  const navigate = useNavigate();
  const { cards, lines, isLoading, error } = useBoardData();

  const handleCardDoubleClick = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card?.href) navigate(card.href);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load board data. Please check that cards.json and
            lines.json exist in the public directory.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ✅ 临时渲染：不用 <Board />，直接把卡片渲染成网格，确认数据到了
  return (
    <div className="w-full min-h-screen p-6">
      <div className="mb-4 text-sm opacity-70">
        cards: {cards.length} · lines: {lines.length}
      </div>

      {cards.length === 0 ? (
        <div className="text-center opacity-70">No cards loaded.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => (
            <button
              key={c.id}
              onDoubleClick={() => handleCardDoubleClick(c.id)}
              className="text-left rounded-lg border p-4 hover:shadow transition"
              title={c.id}
            >
              <div className="text-xs opacity-60 mb-1">{c.kind}</div>
              <div className="font-semibold">{c.title}</div>
              {c.subtitle && (
                <div className="text-sm opacity-80">{c.subtitle}</div>
              )}
              {Array.isArray(c.tags) && c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full bg-black/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
