import React, { useState, useEffect } from 'react';
import { FilterPanel, FilterState } from '@/components/filters/FilterPanel';
import { Button } from '@/components/ui/button';
import { Filter, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSheetOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hasActiveFilters = filters.location || filters.startDate || filters.endDate || filters.skillLevels.length > 0;

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Pickle Tourney Tracker</h1>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="hidden sm:flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            {isMobile && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsMobileSheetOpen(true)}
                className={hasActiveFilters ? 'ring-2 ring-primary' : ''}
              >
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {lastUpdated && isMobile && (
          <div className="container mx-auto px-4 pb-2 flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            <span>Updated {formatLastUpdated(lastUpdated)}</span>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside 
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out",
                isSidebarOpen ? "w-72" : "w-0 overflow-hidden"
              )}
            >
              <div className="sticky top-24">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  onClearFilters={onClearFilters}
                />
              </div>
            </aside>
          )}

          {/* Toggle Sidebar Button (Desktop) */}
          {!isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background border rounded-r-md p-1 hover:bg-secondary transition-colors"
              style={{ left: isSidebarOpen ? '288px' : '0' }}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Sheet */}
      {isMobile && (
        <>
          <div 
            className={cn(
              "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
              isMobileSheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsMobileSheetOpen(false)}
          />
          <div 
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-background shadow-xl transition-transform duration-300 ease-in-out",
              isMobileSheetOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileSheetOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
              <FilterPanel
                filters={filters}
                onFiltersChange={onFiltersChange}
                onClearFilters={onClearFilters}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
