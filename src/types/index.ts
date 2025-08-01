// Core data types for Card Trail Mapping

export type CardKind = "profile" | "goal" | "hobby" | "skill" | "project";
export type LineKind = "uses" | "inspires" | "supports" | "relates";

export type Card = {
  id: string;
  kind: CardKind;
  title: string;
  subtitle?: string;
  media?: { type: "image" | "none"; src?: string; alt?: string };
  tags?: string[];
  badges?: ("NEW" | "UPDATED" | "DRAFT")[];
  meta?: Record<string, any>; // kind-specific fields
  href?: string; // detail route
  pos?: { x: number; y: number }; // optional initial board position
  body?: string; // markdown body for detail
};

export type Line = {
  id: string;
  source: string; // Card.id
  target: string; // Card.id
  kind: LineKind;
  weight?: number; // 0.2–1 → stroke width
  label?: string;
};

export type Trail = {
  id: string;
  title: string;
  steps: Array<{ id: string; actions: Action[] }>;
};

export type Action =
  | { type: "overview"; zoom?: number }
  | { type: "focus"; card: string; zoom?: number; duration?: number }
  | { type: "linkHighlight"; from: string; to: string; kind: LineKind }
  | { type: "revealMeta"; card: string; fields: string[] }
  | { type: "pin"; card: string }
  | { type: "unpin"; card: string }
  | { type: "pulse"; card: string };

// UI State types
export type BoardState = {
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  selectedCard?: string;
  pinnedCards: Set<string>;
  highlightedLines: Set<string>;
  expandedMeta: Map<string, string[]>;
  dimmedCards: Set<string>;
  filters: {
    kinds: Set<CardKind>;
    tags: Set<string>;
    onlyConnected: boolean;
  };
};

export type BoardController = {
  run(actions: Action[]): Promise<void>;
  overview(zoom?: number): Promise<void>;
  focus(cardId: string, opts?: { zoom?: number; duration?: number; ease?: string }): Promise<void>;
  highlightLink(opts: { from: string; to: string; kind: LineKind }): void;
  revealMeta(cardId: string, fields: string[]): void;
  pin(cardId: string): void;
  unpin(cardId: string): void;
  pulse(cardId: string): void;
  getState(): BoardState;
  setState(state: Partial<BoardState>): void;
};

// Card type-specific metadata
export type ProfileMeta = {
  mbti?: { type: string; notes: string[] };
  contacts?: { email?: string; github?: string; linkedin?: string };
};

export type GoalMeta = {
  items?: Array<{ text: string; progress: number }>;
  kpis?: string[];
};

export type HobbyMeta = {
  doing?: string;
  insight?: string;
  recent?: string[];
};

export type SkillMeta = {
  level?: string;
  last_used?: string;
  tags?: string[];
};

export type ProjectMeta = {
  year?: number;
  role?: string[];
  stack?: string[];
  metrics?: Array<{ label: string; value: string }>;
  links?: { demo?: string; repo?: string };
};

// Build-time types
export type MarkdownFile = {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  body: string;
};

export type BuildError = {
  type: 'validation' | 'reference' | 'duplicate';
  message: string;
  file?: string;
  line?: number;
};