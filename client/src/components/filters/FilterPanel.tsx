import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

export interface FilterState {
  location: string;
  date: string;
  skillLevels: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const SKILL_LEVELS = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'];

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

  const handleSkillLevelToggle = useCallback((level: string) => {
    const newLevels = filters.skillLevels.includes(level)
      ? filters.skillLevels.filter((l) => l !== level)
      : [...filters.skillLevels, level];
    onFiltersChange({ ...filters, skillLevels: newLevels });
  }, [filters, onFiltersChange]);

  const handleDateChange = (value: string) => {
    onFiltersChange({ ...filters, date: value });
  };

  const hasActiveFilters = filters.location || filters.date || filters.skillLevels.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Filters</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <Input
            id="location"
            type="text"
            placeholder="Search by city or state..."
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">
            Date
          </label>
          <Input
            id="date"
            type="date"
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Skill Levels</label>
          <div className="flex flex-wrap gap-2">
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
        </div>

        {hasActiveFilters && (
          <Button variant="outline" className="w-full" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

function getSkillLevelColor(level: string): string {
  const numLevel = parseFloat(level.replace('5.0+', '5.0'));
  if (numLevel <= 2.5) return 'bg-green-600 hover:bg-green-700';
  if (numLevel <= 3.5) return 'bg-yellow-600 hover:bg-yellow-700';
  if (numLevel <= 4.5) return 'bg-orange-600 hover:bg-orange-700';
  return 'bg-red-600 hover:bg-red-700';
}

export { SKILL_LEVELS };
