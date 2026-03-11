import { Tournament } from '@/types/tournament';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';

interface TournamentModalProps {
  tournament: Tournament | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSkillLevelColor(level: string): string {
  const numLevel = parseFloat(level.replace('5.0+', '5.0'));
  if (numLevel <= 2.5) return 'bg-green-600 hover:bg-green-700 border-green-600';
  if (numLevel <= 3.5) return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600';
  if (numLevel <= 4.5) return 'bg-orange-600 hover:bg-orange-700 border-orange-600';
  return 'bg-red-600 hover:bg-red-700 border-red-600';
}

export function TournamentModal({ tournament, open, onOpenChange }: TournamentModalProps) {
  if (!tournament) return null;

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    if (tournament.startDate === tournament.endDate) {
      return formatDate(tournament.startDate);
    }
    return `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{tournament.name}</DialogTitle>
          <DialogDescription className="sr-only">Tournament Details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 order-2 md:order-1">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDateRange()}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {tournament.location}
                </a>
              </div>
            </div>

            {tournament.skillLevels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mr-1">Levels:</span>
                {tournament.skillLevels.map((level) => (
                  <Badge
                    key={level}
                    className={`text-xs text-white ${getSkillLevelColor(level)}`}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button asChild className="w-full">
                <a
                  href={tournament.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Sign Up
                </a>
              </Button>
            </div>

            {tournament.description && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {tournament.description}
                </p>
              </div>
            )}
          </div>

          {tournament.imageUrl && (
            <div className="order-1 md:order-2">
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
