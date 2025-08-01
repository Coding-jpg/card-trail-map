import { useCallback, useMemo } from 'react';
import type { Card, BoardState } from '@/types';
import { cn } from '@/lib/utils';

interface MiniMapProps {
  cards: Card[];
  transform: BoardState['transform'];
  onTransformChange: (transform: BoardState['transform']) => void;
  className?: string;
}

export function MiniMap({ 
  cards, 
  transform, 
  onTransformChange, 
  className 
}: MiniMapProps) {
  // Calculate bounds of all cards
  const bounds = useMemo(() => {
    if (cards.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 };
    
    const result = cards.reduce((acc, card) => {
      if (!card.pos) return acc;
      return {
        minX: Math.min(acc.minX, card.pos.x),
        maxX: Math.max(acc.maxX, card.pos.x),
        minY: Math.min(acc.minY, card.pos.y),
        maxY: Math.max(acc.maxY, card.pos.y),
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    if (result.minX === Infinity) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 };
    }

    // Add padding
    const padding = 50;
    return {
      minX: result.minX - padding,
      maxX: result.maxX + padding,
      minY: result.minY - padding,
      maxY: result.maxY + padding,
      width: result.maxX - result.minX + padding * 2,
      height: result.maxY - result.minY + padding * 2,
    };
  }, [cards]);

  // MiniMap dimensions
  const miniMapSize = 200;
  const aspectRatio = bounds.width / bounds.height;
  const miniMapWidth = aspectRatio > 1 ? miniMapSize : miniMapSize * aspectRatio;
  const miniMapHeight = aspectRatio > 1 ? miniMapSize / aspectRatio : miniMapSize;

  // Scale factors
  const scaleX = miniMapWidth / bounds.width;
  const scaleY = miniMapHeight / bounds.height;

  // Current viewport in minimap coordinates
  const viewportWidth = (typeof window !== 'undefined' ? window.innerWidth : 1000) / transform.scale;
  const viewportHeight = (typeof window !== 'undefined' ? window.innerHeight : 600) / transform.scale;
  const viewportX = (-transform.x / transform.scale - bounds.minX) * scaleX;
  const viewportY = (-transform.y / transform.scale - bounds.minY) * scaleY;
  const viewportW = viewportWidth * scaleX;
  const viewportH = viewportHeight * scaleY;

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click to world coordinates
    const worldX = (x / scaleX) + bounds.minX;
    const worldY = (y / scaleY) + bounds.minY;
    
    // Center viewport on clicked position
    const newTransform = {
      ...transform,
      x: -(worldX * transform.scale) + (typeof window !== 'undefined' ? window.innerWidth : 1000) / 2,
      y: -(worldY * transform.scale) + (typeof window !== 'undefined' ? window.innerHeight : 600) / 2,
    };
    
    onTransformChange(newTransform);
  }, [scaleX, scaleY, bounds.minX, bounds.minY, transform, onTransformChange]);

  const handleViewportDrag = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1) return; // Only primary button
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to world coordinates
    const worldX = (x / scaleX) + bounds.minX;
    const worldY = (y / scaleY) + bounds.minY;
    
    // Update transform to center on this position
    const newTransform = {
      ...transform,
      x: -(worldX * transform.scale) + (typeof window !== 'undefined' ? window.innerWidth : 1000) / 2,
      y: -(worldY * transform.scale) + (typeof window !== 'undefined' ? window.innerHeight : 600) / 2,
    };
    
    onTransformChange(newTransform);
  }, [scaleX, scaleY, bounds.minX, bounds.minY, transform, onTransformChange]);

  return (
    <div className={cn(
      'bg-card/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg',
      className
    )}>
      <div className="text-xs font-medium mb-2 text-muted-foreground">Overview</div>
      
      <div className="relative bg-muted rounded overflow-hidden">
        <svg
          width={miniMapWidth}
          height={miniMapHeight}
          className="cursor-crosshair"
          onClick={handleClick}
          onMouseMove={handleViewportDrag}
        >
          {/* Cards */}
          {cards.map(card => {
            if (!card.pos) return null;
            
            const x = (card.pos.x - bounds.minX) * scaleX;
            const y = (card.pos.y - bounds.minY) * scaleY;
            
            // Card colors by type
            const colors = {
              profile: '#6b7280',
              goal: '#0ea5e9', 
              hobby: '#f59e0b',
              skill: '#22c55e',
              project: '#a78bfa',
            };
            
            return (
              <circle
                key={card.id}
                cx={x}
                cy={y}
                r={2}
                fill={colors[card.kind]}
                opacity={0.8}
              />
            );
          })}
          
          {/* Viewport rectangle */}
          <rect
            x={Math.max(0, viewportX)}
            y={Math.max(0, viewportY)}
            width={Math.min(viewportW, miniMapWidth - Math.max(0, viewportX))}
            height={Math.min(viewportH, miniMapHeight - Math.max(0, viewportY))}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            rx={2}
          />
        </svg>
      </div>
      
      {/* Stats */}
      <div className="mt-2 text-xs text-muted-foreground">
        {cards.length} cards • {Math.round(transform.scale * 100)}% zoom
      </div>
    </div>
  );
}