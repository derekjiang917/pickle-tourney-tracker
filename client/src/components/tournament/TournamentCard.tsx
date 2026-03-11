import { Tournament } from '@/types/tournament';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (tournament: Tournament) => void;
}

interface TournamentCardSkeletonProps {
  variant?: 'default' | 'horizontal';
}

function getSkillLevelColor(level: string): string {
  const numLevel = parseFloat(level.replace('5.0+', '5.0'));
  if (numLevel <= 2.5) return 'bg-green-600 hover:bg-green-700 border-green-600';
  if (numLevel <= 3.5) return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600';
  if (numLevel <= 4.5) return 'bg-orange-600 hover:bg-orange-700 border-orange-600';
  return 'bg-red-600 hover:bg-red-700 border-red-600';
}

export function TournamentCard({ tournament, onSelect }: TournamentCardProps) {
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
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

  const handleCardClick = () => {
    onSelect(tournament);
  };

  const handleSignUpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2 text-lg leading-tight">{tournament.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{tournament.city}, {tournament.state}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{formatDateRange()}</span>
          </div>
          {tournament.skillLevels.length > 0 && (
            <div className="flex flex-wrap gap-1">
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
          {tournament.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tournament.description}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" onClick={handleSignUpClick}>
          <a href={tournament.sourceUrl} target="_blank" rel="noopener noreferrer">
            Sign Up
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TournamentCardSkeleton({ variant = 'default' }: TournamentCardSkeletonProps) {
  if (variant === 'horizontal') {
    return (
      <Card className="flex flex-row h-auto">
        <div className="w-32 sm:w-48 bg-muted" />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
