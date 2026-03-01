import { Tournament } from '@/types/tournament';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="line-clamp-2">{tournament.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{tournament.city}, {tournament.state}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDateRange()}</span>
          </div>
          {tournament.skillLevels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tournament.skillLevels.map((level) => (
                <Badge key={level} variant="secondary" className="text-xs">
                  {level}
                </Badge>
              ))}
            </div>
          )}
          {tournament.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tournament.description}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a href={tournament.sourceUrl} target="_blank" rel="noopener noreferrer">
            Sign Up
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
