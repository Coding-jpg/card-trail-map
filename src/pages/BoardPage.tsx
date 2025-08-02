import { useNavigate } from "react-router-dom";
import { Board } from "@/components/Board";
import { useBoardData } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function BoardPage() {
  const navigate = useNavigate();
  const { cards, lines, isLoading, error } = useBoardData();

  // 关键：把没有/异常的坐标归一化为一个网格，确保初次渲染可见
  const normalizedCards = cards.map((c, i) => ({
    ...c,
    pos: c.pos ?? { x: (i % 5) * 180, y: Math.floor(i / 5) * 140 },
  }));

  const handleCardSelect = (cardId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("selected", cardId);
    window.history.replaceState(null, "", url.toString());
  };

  const handleCardDoubleClick = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card?.href) {
      navigate(card.href);
    }
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

  return (
    <div className="w-full h-screen relative">
      <Board
        cards={normalizedCards}
        lines={lines}
        onCardSelect={handleCardSelect}
        onCardDoubleClick={handleCardDoubleClick}
      />
    </div>
  );
}
