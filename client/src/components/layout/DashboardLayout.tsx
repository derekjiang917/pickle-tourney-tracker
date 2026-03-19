import React, { useState } from 'react';
import { FilterPanel, FilterState } from '@/components/filters/FilterPanel';
import { Button } from '@/components/ui/button';
import { Filter, ChevronUp, ChevronDown, LogIn, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  lastUpdated?: string | null;
}

export function DashboardLayout({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
  lastUpdated,
}: DashboardLayoutProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const hasActiveFilters =
    filters.location || filters.date || filters.skillLevels.length > 0 || !filters.upcomingOnly;

  const formatLastUpdated = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f0f0f', color: '#e8e8e8' }}>
      {/* Fixed gradient background — sits behind everything */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 65% 55% at 10% -5%, rgba(34,197,94,0.18) 0%, transparent 60%)',
            'radial-gradient(ellipse 50% 45% at 90% 105%, rgba(34,197,94,0.12) 0%, transparent 60%)',
          ].join(', '),
        }}
      />
      <header
        className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl backdrop-saturate-150"
        style={{ background: 'rgba(15, 15, 15, 0.78)', position: 'relative', zIndex: 40 }}
      >
        {/* Title row */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-base leading-none select-none shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_12px_hsl(var(--primary)/0.2)]">
              🥒
            </div>
            <h1 className="text-base font-medium text-foreground/90 tracking-tight">
              Pickle <span className="text-primary font-semibold">Tourney</span> Tracker
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                'border-border/60 bg-background/50 text-muted-foreground hover:text-foreground',
                hasActiveFilters && !isFilterOpen && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
              )}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filters
              {isFilterOpen ? (
                <ChevronUp className="w-3 h-3 ml-1.5 opacity-60" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1.5 opacity-60" />
              )}
            </Button>

            {/* Login — placeholder for future auth */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          </div>
        </div>

        {/* Collapsible filter bar */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            isFilterOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border/40" style={{ background: 'rgba(15, 15, 15, 0.5)' }}>
              <div className="container mx-auto px-4 py-3">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  onClearFilters={onClearFilters}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between text-xs text-muted-foreground/60">
          <span>Pickle Tourney Tracker</span>
          {lastUpdated && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
