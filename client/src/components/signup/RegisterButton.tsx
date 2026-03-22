import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSignups, ConflictInfo } from '@/hooks/useSignups';

interface Props {
  tournamentId: string;
  sourceUrl: string;
  className?: string;
}

export function RegisterButton({ tournamentId, sourceUrl, className }: Props) {
  const { isAuthenticated, login } = useAuth();
  const { getStatusForTournament, recordClick, checkConflicts } = useSignups();
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isActing, setIsActing] = useState(false);

  const status = isAuthenticated ? getStatusForTournament(tournamentId) : null;

  useEffect(() => {
    if (!isAuthenticated) return;
    void checkConflicts(tournamentId).then(setConflicts);
  }, [isAuthenticated, tournamentId, checkConflicts]);

  const handleRegisterClick = async () => {
    if (isActing) return;
    setIsActing(true);
    try {
      if (isAuthenticated) {
        await recordClick(tournamentId);
      }
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsActing(false);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Button
        className={className}
        onClick={() => {
          login();
        }}
        variant="default"
      >
        Register →
      </Button>
    );
  }

  // Confirmed
  if (status === 'CONFIRMED') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Button
          disabled
          className={`w-full bg-green-600 text-white font-semibold cursor-default opacity-90 ${className ?? ''}`}
        >
          ✓ Registered
        </Button>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Visit site →
        </a>
      </div>
    );
  }

  // Pending
  if (status === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Button
          disabled
          title="We'll ask you to confirm next time you visit"
          className={`w-full bg-muted text-muted-foreground font-medium cursor-default ${className ?? ''}`}
        >
          <span className="mr-1.5">⏳</span> Registered (pending)
        </Button>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Visit site →
        </a>
      </div>
    );
  }

  // Has conflict
  if (conflicts.length > 0) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          onClick={() => void handleRegisterClick()}
          disabled={isActing}
          className={`w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold ${className ?? ''}`}
        >
          <span className="mr-1.5">⚠</span> Register (Conflict)
        </Button>
        <p className="text-[11px] text-amber-400/80">
          Overlaps with {conflicts[0]!.name}
        </p>
      </div>
    );
  }

  // Default: authenticated, no status, no conflict
  return (
    <Button
      onClick={() => void handleRegisterClick()}
      disabled={isActing}
      className={`w-full bg-primary hover:bg-primary/90 text-white font-semibold ${className ?? ''}`}
    >
      Register →
    </Button>
  );
}
