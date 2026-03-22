import React, { useState } from 'react';
import { FilterPanel, FilterState } from '@/components/filters/FilterPanel';
import { Button } from '@/components/ui/button';
import { Filter, ChevronUp, ChevronDown, Clock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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
  const [pickleSpinning, setPickleSpinning] = useState(false);
  const { user, isLoading: authLoading, login, logout } = useAuth();

  const handlePickleClick = () => {
    if (pickleSpinning) return;
    setPickleSpinning(true);
  };

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
            <div
              className={`w-8 h-8 rounded-full bg-primary flex items-center justify-center text-base leading-none select-none shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_12px_hsl(var(--primary)/0.2)] cursor-pointer${pickleSpinning ? ' pickle-spin' : ''}`}
              onClick={handlePickleClick}
              onAnimationEnd={() => setPickleSpinning(false)}
            >
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

            {/* Auth area */}
            {!authLoading && !user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={login}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" className="flex-shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
            {!authLoading && user && (
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-border/60"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-semibold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[120px]">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void logout()}
                  className="text-muted-foreground hover:text-foreground gap-1.5 px-2"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
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
