import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export interface FilterState {
  location: string;
  date: string;
  skillLevels: string[];
  upcomingOnly: boolean;
  registeredOnly: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const SKILL_LEVELS = ['3.0', '3.5', '4.0', '4.5', '5.0+'];

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
  const { isAuthenticated } = useAuth();
  const [localLocation, setLocalLocation] = useState(filters.location);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localLocation !== filters.location) {
        onFiltersChange({ ...filters, location: localLocation });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localLocation]);

  useEffect(() => {
    setLocalLocation(filters.location);
  }, [filters.location]);

  const handleSkillLevelToggle = useCallback(
    (level: string) => {
      const newLevels = filters.skillLevels.includes(level)
        ? filters.skillLevels.filter((l) => l !== level)
        : [...filters.skillLevels, level];
      onFiltersChange({ ...filters, skillLevels: newLevels });
    },
    [filters, onFiltersChange]
  );

  const hasActiveFilters =
    filters.location || filters.date || filters.skillLevels.length > 0 || !filters.upcomingOnly || filters.registeredOnly;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Location */}
      <Input
        type="text"
        placeholder="City or state..."
        value={localLocation}
        onChange={(e) => setLocalLocation(e.target.value)}
        className="w-44"
      />

      {/* Date */}
      <Input
        type="date"
        value={filters.date}
        onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
        className="w-38"
      />

      {/* Divider */}
      <div className="h-5 w-px bg-border hidden sm:block" />

      {/* Skill levels */}
      <div className="flex items-center gap-1.5">
        {SKILL_LEVELS.map((level) => {
          const selected = filters.skillLevels.includes(level);
          return (
            <span
              key={level}
              onClick={() => handleSkillLevelToggle(level)}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-all hover:scale-105"
              style={selected ? getSkillBadgeStyle(level) : { color: 'var(--muted-foreground)', background: 'transparent', borderColor: 'var(--border)' }}
            >
              {level}
            </span>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border hidden sm:block" />

      {/* Upcoming only toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="upcoming-only"
          checked={filters.upcomingOnly}
          onCheckedChange={() => onFiltersChange({ ...filters, upcomingOnly: !filters.upcomingOnly })}
        />
        <label htmlFor="upcoming-only" className="text-sm cursor-pointer whitespace-nowrap">
          Upcoming only
        </label>
      </div>

      {/* Registered only toggle — auth-gated */}
      {isAuthenticated && (
        <>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Switch
              id="registered-only"
              checked={filters.registeredOnly}
              onCheckedChange={() => onFiltersChange({ ...filters, registeredOnly: !filters.registeredOnly })}
            />
            <label htmlFor="registered-only" className="text-sm cursor-pointer whitespace-nowrap">
              My registrations
            </label>
          </div>
        </>
      )}

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

function getSkillBadgeStyle(level: string): React.CSSProperties {
  const num = parseFloat(level.replace('+', ''));
  if (num <= 3.0) return { color: '#94a3b8', background: 'rgba(100,116,139,0.18)', borderColor: 'rgba(100,116,139,0.35)' };
  if (num <= 3.5) return { color: '#60a5fa', background: 'rgba(96,165,250,0.18)', borderColor: 'rgba(96,165,250,0.35)' };
  if (num <= 4.0) return { color: '#22d3ee', background: 'rgba(34,211,238,0.18)', borderColor: 'rgba(34,211,238,0.35)' };
  if (num <= 4.5) return { color: '#34d399', background: 'rgba(52,211,153,0.18)', borderColor: 'rgba(52,211,153,0.35)' };
  return { color: '#22c55e', background: 'rgba(34,197,94,0.20)', borderColor: 'rgba(34,197,94,0.40)' };
}

export { SKILL_LEVELS };
