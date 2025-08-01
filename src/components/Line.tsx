import { memo } from 'react';
import type { Line as LineType, Card, LineKind } from '@/types';
import { cn } from '@/lib/utils';

interface LineProps {
  line: LineType;
  sourceCard: Card;
  targetCard: Card;
  isHighlighted?: boolean;
  scale: number;
}

const LINE_STYLES: Record<LineKind, string> = {
  uses: 'line-uses',
  inspires: 'line-inspires', 
  supports: 'line-supports',
  relates: 'line-relates',
};

export const Line = memo<LineProps>(({ 
  line, 
  sourceCard, 
  targetCard, 
  isHighlighted,
  scale 
}) => {
  if (!sourceCard.pos || !targetCard.pos) return null;

  const { source, target, kind, weight = 1.0, label } = line;
  
  // Calculate line coordinates
  const x1 = sourceCard.pos.x + 100; // Card center approximation
  const y1 = sourceCard.pos.y + 60;
  const x2 = targetCard.pos.x + 100;
  const y2 = targetCard.pos.y + 60;
  
  // Calculate control points for bezier curve
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Create smooth curve
  const controlPointOffset = Math.min(distance * 0.3, 100);
  const cx1 = x1 + (dx > 0 ? controlPointOffset : -controlPointOffset);
  const cy1 = y1;
  const cx2 = x2 - (dx > 0 ? controlPointOffset : -controlPointOffset);
  const cy2 = y2;
  
  const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  
  // Adjust stroke width based on weight and scale
  const strokeWidth = (weight * (kind === 'supports' ? 1 : 2)) * Math.max(0.5, scale);

  return (
    <g
      className={cn(
        'transition-all duration-200 cursor-pointer',
        isHighlighted && 'opacity-100',
        !isHighlighted && 'opacity-70 hover:opacity-90'
      )}
      role="button"
      aria-label={`Relation: ${source} ${kind} ${target}`}
      tabIndex={0}
    >
      {/* Main path */}
      <path
        d={pathD}
        className={cn(LINE_STYLES[kind], isHighlighted && 'drop-shadow-lg')}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Label */}
      {label && scale > 0.8 && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          textAnchor="middle"
          className="fill-current text-xs font-medium pointer-events-none"
          style={{ userSelect: 'none' }}
        >
          {label}
        </text>
      )}
      
      {/* Interactive hit area */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth + 8, 16)}
        fill="none"
        strokeLinecap="round"
        className="pointer-events-auto"
      />
    </g>
  );
});

// SVG marker definitions for arrows
export const LineMarkers = memo(() => (
  <defs>
    <marker
      id="arrow-uses"
      viewBox="0 0 10 10"
      refX="9"
      refY="3"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" className="fill-emerald-500" />
    </marker>
    
    <marker
      id="arrow-inspires"
      viewBox="0 0 10 10"
      refX="9"
      refY="3"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" className="fill-amber-500" />
    </marker>
    
    <marker
      id="arrow-supports"
      viewBox="0 0 10 10"
      refX="9"
      refY="3"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" className="fill-sky-500" />
    </marker>
  </defs>
));

Line.displayName = 'Line';
LineMarkers.displayName = 'LineMarkers';