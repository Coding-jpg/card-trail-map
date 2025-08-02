import { useEffect, useState } from "react";

type Card = {
  id: string;
  title: string;
  subtitle?: string;
  kind: string;
  pos?: { x: number; y: number };
};
type Line = { id: string; source: string; target: string; kind: string };

export default function BoardPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cardsUrl =
          "https://coding-jpg.github.io/card-trail-map/cards.json";
        const linesUrl =
          "https://coding-jpg.github.io/card-trail-map/lines.json";
        console.log("[probe] fetching", cardsUrl, linesUrl);

        const [cr, lr] = await Promise.all([fetch(cardsUrl), fetch(linesUrl)]);
        console.log("[probe] status", cr.status, lr.status);

        if (!cr.ok) throw new Error("cards " + cr.status);
        if (!lr.ok) throw new Error("lines " + lr.status);

        const [c, l] = await Promise.all([cr.json(), lr.json()]);
        console.log("[probe] lengths", c?.length, l?.length);
        setCards(Array.isArray(c) ? c : []);
        setLines(Array.isArray(l) ? l : []);
      } catch (e: any) {
        console.error("[probe] error", e);
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return <div style={{ padding: 24, color: "red" }}>Error: {err}</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        cards: {cards.length} · lines: {lines.length}
      </div>
      {cards.length === 0 ? (
        <div>No cards.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          }}
        >
          {cards.map((c) => (
            <div
              key={c.id}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
            >
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
                {c.kind}
              </div>
              <div style={{ fontWeight: 600 }}>{c.title}</div>
              {c.subtitle && (
                <div style={{ fontSize: 13, opacity: 0.85 }}>{c.subtitle}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
