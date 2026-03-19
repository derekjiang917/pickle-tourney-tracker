import React, { useState } from 'react';
import { FilterPanel, FilterState } from '@/components/filters/FilterPanel';
import { Button } from '@/components/ui/button';
import { Filter, Clock, ChevronUp, ChevronDown } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 bg-background z-40">
        {/* Title row */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Pickle Tourney Tracker</h1>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="hidden sm:flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(hasActiveFilters && !isFilterOpen && 'ring-2 ring-primary')}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
              {isFilterOpen ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
              )}
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
            <div className="border-t border-border">
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

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
