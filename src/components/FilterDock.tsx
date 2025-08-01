import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search } from 'lucide-react';
import type { Card, CardKind, BoardState } from '@/types';
import { cn } from '@/lib/utils';

interface FilterDockProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: BoardState['filters'];
  onFiltersChange: (filters: BoardState['filters']) => void;
  cards: Card[];
}

const CARD_KINDS: { value: CardKind; label: string; color: string }[] = [
  { value: 'profile', label: 'Profile', color: 'bg-gray-500' },
  { value: 'goal', label: 'Goals', color: 'bg-sky-500' },
  { value: 'hobby', label: 'Hobbies', color: 'bg-amber-500' },
  { value: 'skill', label: 'Skills', color: 'bg-emerald-500' },
  { value: 'project', label: 'Projects', color: 'bg-violet-400' },
];

export function FilterDock({ 
  isOpen, 
  onToggle, 
  filters, 
  onFiltersChange, 
  cards 
}: FilterDockProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique tags and years from cards
  const allTags = Array.from(new Set(cards.flatMap(card => card.tags || [])));
  const allYears = Array.from(new Set(
    cards
      .map(card => card.meta?.year)
      .filter(Boolean)
      .sort((a, b) => b - a)
  ));
  const allStackItems = Array.from(new Set(
    cards
      .flatMap(card => card.meta?.stack || [])
      .filter(Boolean)
  ));

  // Filter items based on search
  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKindToggle = (kind: CardKind) => {
    const newKinds = new Set(filters.kinds);
    if (newKinds.has(kind)) {
      newKinds.delete(kind);
    } else {
      newKinds.add(kind);
    }
    onFiltersChange({ ...filters, kinds: newKinds });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(filters.tags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      kinds: new Set(['profile', 'goal', 'hobby', 'skill', 'project']),
      tags: new Set(),
      onlyConnected: false,
    });
    setSearchQuery('');
  };

  const activeFilterCount = 
    (5 - filters.kinds.size) + 
    filters.tags.size + 
    (filters.onlyConnected ? 1 : 0);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn(
          'fixed top-4 left-4 z-50 transition-all duration-200',
          isOpen && 'translate-x-72'
        )}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Filter Panel */}
      <div className={cn(
        'fixed top-0 left-0 h-full bg-card border-r shadow-lg z-40 transition-transform duration-300',
        'w-72 overflow-y-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          )}

          {/* Card Types */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Card Types</Label>
            <div className="space-y-2">
              {CARD_KINDS.map(kind => (
                <div key={kind.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`kind-${kind.value}`}
                    checked={filters.kinds.has(kind.value)}
                    onCheckedChange={() => handleKindToggle(kind.value)}
                  />
                  <div className="flex items-center space-x-2">
                    <div className={cn('w-3 h-3 rounded-full', kind.color)} />
                    <Label htmlFor={`kind-${kind.value}`} className="text-sm">
                      {kind.label}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Connection</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="only-connected"
                checked={filters.onlyConnected}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, onlyConnected: checked })
                }
              />
              <Label htmlFor="only-connected" className="text-sm">
                Only show connected cards
              </Label>
            </div>
          </div>

          {/* Tag Search */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredTags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={filters.tags.has(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <Label htmlFor={`tag-${tag}`} className="text-sm">
                    {tag}
                  </Label>
                </div>
              ))}
              {filteredTags.length === 0 && searchQuery && (
                <div className="text-sm text-muted-foreground">
                  No tags found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Years */}
          {allYears.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Years</Label>
              <div className="flex flex-wrap gap-2">
                {allYears.map(year => (
                  <Badge
                    key={year}
                    variant={filters.tags.has(year.toString()) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(year.toString())}
                  >
                    {year}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {allStackItems.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tech Stack</Label>
              <div className="flex flex-wrap gap-2">
                {allStackItems.slice(0, 20).map(tech => (
                  <Badge
                    key={tech}
                    variant={filters.tags.has(tech) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleTagToggle(tech)}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Filter Statistics */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <div>Showing {cards.filter(card => filters.kinds.has(card.kind)).length} of {cards.length} cards</div>
            {filters.tags.size > 0 && (
              <div>With {filters.tags.size} tag{filters.tags.size !== 1 ? 's' : ''} selected</div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
}