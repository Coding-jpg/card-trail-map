import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Card as CardType, CardKind } from '@/types';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  scale: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  isPinned?: boolean;
  expandedFields?: string[];
  onSelect?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
}

const CARD_COLORS: Record<CardKind, string> = {
  profile: 'border-l-gray-500',
  goal: 'border-l-sky-500',
  hobby: 'border-l-amber-500',
  skill: 'border-l-emerald-500',
  project: 'border-l-violet-400',
};

const CARD_BACKGROUNDS: Record<CardKind, string> = {
  profile: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
  goal: 'bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900 dark:to-sky-800',
  hobby: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800',
  skill: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800',
  project: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800',
};

export const Card = memo<CardProps>(({ 
  card, 
  scale, 
  isSelected, 
  isDimmed, 
  isPinned, 
  expandedFields,
  onSelect,
  onDoubleClick 
}) => {
  const { id, kind, title, subtitle, media, tags, badges, meta } = card;
  
  // Determine zoom density level
  const zoomLevel = scale < 0.6 ? 'far' : scale < 1.0 ? 'mid' : 'near';
  
  const handleClick = () => {
    onSelect?.(id);
  };
  
  const handleDoubleClick = () => {
    onDoubleClick?.(id);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onDoubleClick?.(id);
    } else if (e.key === 'Escape') {
      onSelect?.(id);
    }
  };

  const cardWidth = zoomLevel === 'far' ? 120 : zoomLevel === 'mid' ? 200 : 280;
  const cardHeight = 'auto';

  return (
    <div
      data-card-id={id}
      className={cn(
        'card-trail border-l-4 cursor-pointer focus-visible-ring transition-all duration-200',
        CARD_COLORS[kind],
        CARD_BACKGROUNDS[kind],
        isDimmed && 'dimmed',
        isSelected && 'selected',
        isPinned && 'pinned'
      )}
      style={{
        width: cardWidth,
        minHeight: zoomLevel === 'far' ? 80 : 120,
        transform: card.pos ? `translate(${card.pos.x}px, ${card.pos.y}px)` : undefined,
        position: 'absolute',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Card: ${title}, type: ${kind}`}
    >
      {/* Badges */}
      {badges && badges.length > 0 && zoomLevel !== 'far' && (
        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
          {badges.map((badge) => (
            <Badge
              key={badge}
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0.5 animate-pop-in',
                badge === 'NEW' && 'badge-new',
                badge === 'UPDATED' && 'badge-updated',
                badge === 'DRAFT' && 'badge-draft'
              )}
            >
              {badge}
            </Badge>
          ))}
        </div>
      )}

      <div className="p-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0">
          <h3 className={cn(
            'font-semibold leading-tight',
            zoomLevel === 'far' ? 'text-sm' : zoomLevel === 'mid' ? 'text-base' : 'text-lg'
          )}>
            {title}
          </h3>
          
          {subtitle && zoomLevel !== 'far' && (
            <p className={cn(
              'text-muted-foreground mt-1',
              zoomLevel === 'mid' ? 'text-xs' : 'text-sm'
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Media */}
        {media?.type === 'image' && media.src && zoomLevel === 'near' && (
          <div className="mt-3 flex-shrink-0">
            <img
              src={media.src}
              alt={media.alt || title}
              className="w-full h-32 object-cover rounded-md"
              loading="lazy"
            />
          </div>
        )}

        {/* Key metadata */}
        {zoomLevel !== 'far' && meta && (
          <div className="mt-3 flex-1">
            {renderMetadata(kind, meta, zoomLevel, expandedFields)}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && zoomLevel === 'near' && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 6 && (
              <span className="text-xs text-muted-foreground">
                +{tags.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function renderMetadata(
  kind: CardKind, 
  meta: Record<string, any>, 
  zoomLevel: 'far' | 'mid' | 'near',
  expandedFields?: string[]
) {
  const isExpanded = (field: string) => expandedFields?.includes(field);

  switch (kind) {
    case 'profile':
      return (
        <div className="space-y-2">
          {meta.mbti?.type && (
            <div className="text-sm">
              <span className="font-medium">MBTI:</span> {meta.mbti.type}
            </div>
          )}
          {meta.contacts && zoomLevel === 'near' && (
            <div className="text-xs space-y-1">
              {meta.contacts.email && <div>📧 {meta.contacts.email}</div>}
              {meta.contacts.github && <div>🔗 {meta.contacts.github}</div>}
            </div>
          )}
        </div>
      );

    case 'goal':
      return (
        <div className="space-y-2">
          {meta.items && (
            <div className="space-y-1">
              {meta.items.slice(0, zoomLevel === 'near' ? 3 : 2).map((item: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground truncate">
                      {item.text}
                    </span>
                    <span className="text-xs font-medium ml-2">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full mt-1">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'hobby':
      return (
        <div className="space-y-2 text-sm">
          {meta.doing && (
            <div>
              <span className="font-medium">Currently:</span> {meta.doing}
            </div>
          )}
          {meta.insight && zoomLevel === 'near' && (
            <div className="text-muted-foreground text-xs italic">
              "{meta.insight}"
            </div>
          )}
        </div>
      );

    case 'skill':
      return (
        <div className="space-y-2 text-sm">
          {meta.level && (
            <div>
              <span className="font-medium">Level:</span> {meta.level}
            </div>
          )}
          {meta.last_used && zoomLevel === 'near' && (
            <div className="text-muted-foreground text-xs">
              Last used: {meta.last_used}
            </div>
          )}
        </div>
      );

    case 'project':
      return (
        <div className="space-y-2">
          {meta.year && (
            <div className="text-sm">
              <span className="font-medium">Year:</span> {meta.year}
            </div>
          )}
          {meta.stack && (isExpanded('stack') || zoomLevel === 'near') && (
            <div className="text-xs">
              <div className="font-medium mb-1">Stack:</div>
              <div className="flex flex-wrap gap-1">
                {meta.stack.slice(0, 4).map((tech: string) => (
                  <span key={tech} className="bg-violet-100 dark:bg-violet-900 px-1.5 py-0.5 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
          {meta.metrics && (isExpanded('metrics') || zoomLevel === 'near') && (
            <div className="text-xs space-y-1">
              {meta.metrics.slice(0, 3).map((metric: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium">{metric.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

Card.displayName = 'Card';