import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

export interface FilterState {
  location: string;
  date: string;
  skillLevels: string[];
  upcomingOnly: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const SKILL_LEVELS = ['3.0', '3.5', '4.0', '4.5', '5.0+'];

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
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
    filters.location || filters.date || filters.skillLevels.length > 0 || !filters.upcomingOnly;

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
        {SKILL_LEVELS.map((level) => (
          <Badge
            key={level}
            variant={filters.skillLevels.includes(level) ? 'default' : 'outline'}
            className={`cursor-pointer transition-all hover:scale-105 ${
              filters.skillLevels.includes(level) ? getSkillLevelColor(level) : ''
            }`}
            onClick={() => handleSkillLevelToggle(level)}
          >
            {level}
          </Badge>
        ))}
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

function getSkillLevelColor(level: string): string {
  const numLevel = parseFloat(level.replace('5.0+', '5.0'));
  if (numLevel <= 3.5) return 'bg-yellow-600 hover:bg-yellow-700';
  if (numLevel <= 4.5) return 'bg-orange-600 hover:bg-orange-700';
  return 'bg-red-600 hover:bg-red-700';
}

export { SKILL_LEVELS };
