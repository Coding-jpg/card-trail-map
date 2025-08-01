import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Board } from '@/components/Board';
import { useBoardController } from '@/hooks/useBoardController';
import { useBoardData, useTrails } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import type { Trail } from '@/types';
import { cn } from '@/lib/utils';

export default function StoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cards, lines, isLoading: boardLoading, error: boardError } = useBoardData();
  const { data: trails, isLoading: trailsLoading, error: trailsError } = useTrails();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver>();
  
  // Get current trail from URL or default to first trail
  const trailId = searchParams.get('trail') || trails?.[0]?.id;
  const currentTrail = trails?.find(t => t.id === trailId) || trails?.[0];
  
  const boardController = useBoardController({
    cards,
    lines,
  });

  // Initialize step from URL
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam && currentTrail) {
      const stepIndex = currentTrail.steps.findIndex(s => s.id === stepParam);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [searchParams, currentTrail]);

  // Update URL when step changes
  const updateStepInUrl = useCallback((stepIndex: number) => {
    if (!currentTrail) return;
    
    const newParams = new URLSearchParams(searchParams);
    if (currentTrail.id !== trails?.[0]?.id) {
      newParams.set('trail', currentTrail.id);
    } else {
      newParams.delete('trail');
    }
    
    if (stepIndex > 0) {
      newParams.set('step', currentTrail.steps[stepIndex].id);
    } else {
      newParams.delete('step');
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, currentTrail, trails]);

  // Intersection Observer for scroll-driven navigation
  useEffect(() => {
    if (!currentTrail || isAutoScrolling) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const stepIndex = parseInt(entry.target.getAttribute('data-step-index') || '0');
            setCurrentStepIndex(stepIndex);
            updateStepInUrl(stepIndex);
          }
        });
      },
      {
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.6,
      }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [currentTrail, isAutoScrolling, updateStepInUrl]);

  // Execute actions when step changes
  useEffect(() => {
    if (!currentTrail || currentStepIndex >= currentTrail.steps.length) return;

    const step = currentTrail.steps[currentStepIndex];
    if (step.actions.length > 0) {
      boardController.run(step.actions);
    }
  }, [currentStepIndex, currentTrail, boardController]);

  // Navigation functions
  const goToStep = useCallback((stepIndex: number) => {
    if (!currentTrail || stepIndex < 0 || stepIndex >= currentTrail.steps.length) return;
    
    setIsAutoScrolling(true);
    setCurrentStepIndex(stepIndex);
    updateStepInUrl(stepIndex);
    
    const stepElement = stepRefs.current[stepIndex];
    if (stepElement) {
      stepElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Reset auto-scroll flag after animation
      setTimeout(() => setIsAutoScrolling(false), 1000);
    }
  }, [currentTrail, updateStepInUrl]);

  const nextStep = () => goToStep(currentStepIndex + 1);
  const prevStep = () => goToStep(currentStepIndex - 1);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevStep();
          break;
        case 'Home':
          e.preventDefault();
          goToStep(0);
          break;
        case 'End':
          e.preventDefault();
          if (currentTrail) goToStep(currentTrail.steps.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep, goToStep, currentTrail]);

  if (boardLoading || trailsLoading) {
    return (
      <div className="w-full h-screen flex">
        <div className="w-96 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (boardError || trailsError) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load story data. Please check that your JSON files exist and are valid.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentTrail) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No trails found. Create a trail in _trails/ to enable story mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex">
      {/* Story Steps Column */}
      <div className="w-96 bg-card border-r overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{currentTrail.title}</h1>
          <div className="text-sm text-muted-foreground mb-6">
            Step {currentStepIndex + 1} of {currentTrail.steps.length}
          </div>
          
          {/* Trail selector */}
          {trails && trails.length > 1 && (
            <div className="mb-6">
              <select
                value={trailId || ''}
                onChange={(e) => {
                  const newParams = new URLSearchParams();
                  if (e.target.value !== trails[0]?.id) {
                    newParams.set('trail', e.target.value);
                  }
                  setSearchParams(newParams, { replace: true });
                }}
                className="w-full p-2 border rounded-md text-sm"
              >
                {trails.map(trail => (
                  <option key={trail.id} value={trail.id}>
                    {trail.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-4 pb-20">
          {currentTrail.steps.map((step, index) => (
            <div
              key={step.id}
              ref={(el) => stepRefs.current[index] = el}
              data-step-index={index}
              className={cn(
                'min-h-[80vh] p-6 cursor-pointer transition-all duration-200',
                'flex items-center',
                index === currentStepIndex 
                  ? 'bg-muted/50 border-l-4 border-l-primary' 
                  : 'hover:bg-muted/20'
              )}
              onClick={() => goToStep(index)}
            >
              <div className="w-full">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Step {index + 1}
                </div>
                
                {/* Action descriptions */}
                <div className="space-y-2">
                  {step.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="text-sm">
                      {getActionDescription(action)}
                    </div>
                  ))}
                </div>
                
                {/* Visual indicator */}
                <div className="mt-4 h-1 bg-muted rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ 
                      width: index <= currentStepIndex ? '100%' : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Board Column */}
      <div className="flex-1 relative">
        <Board
          cards={cards}
          lines={lines}
          controller={boardController}
        />
        
        {/* Navigation Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={currentStepIndex >= currentTrail.steps.length - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Keyboard shortcuts */}
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground">
          <div className="font-medium mb-2">Navigation</div>
          <div>↑/↓ - Previous/Next step</div>
          <div>Home/End - First/Last step</div>
        </div>
      </div>
    </div>
  );
}

function getActionDescription(action: any): string {
  switch (action.type) {
    case 'overview':
      return `📊 Show overview${action.zoom ? ` (${Math.round(action.zoom * 100)}% zoom)` : ''}`;
    case 'focus':
      return `🔍 Focus on "${action.card}"${action.zoom ? ` (${Math.round(action.zoom * 100)}% zoom)` : ''}`;
    case 'linkHighlight':
      return `🔗 Highlight connection: ${action.from} → ${action.to}`;
    case 'revealMeta':
      return `📋 Show details: ${action.fields.join(', ')}`;
    case 'pin':
      return `📌 Pin "${action.card}"`;
    case 'unpin':
      return `📌 Unpin "${action.card}"`;
    case 'pulse':
      return `✨ Highlight "${action.card}"`;
    default:
      return '• Unknown action';
  }
}