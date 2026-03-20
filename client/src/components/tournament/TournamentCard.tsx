import { Tournament } from '@/types/tournament';
import { Skeleton } from '@/components/ui/skeleton';

interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (tournament: Tournament) => void;
}

interface TournamentCardSkeletonProps {
  variant?: 'default' | 'horizontal';
}

function getSkillBadgeStyle(level: string): React.CSSProperties {
  const num = parseFloat(level.replace('+', ''));
  if (num <= 3.0) return { color: '#94a3b8', background: 'rgba(100,116,139,0.11)', borderColor: 'rgba(100,116,139,0.26)' };
  if (num <= 3.5) return { color: '#60a5fa', background: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.26)' };
  if (num <= 4.0) return { color: '#22d3ee', background: 'rgba(34,211,238,0.10)', borderColor: 'rgba(34,211,238,0.26)' };
  if (num <= 4.5) return { color: '#34d399', background: 'rgba(52,211,153,0.11)', borderColor: 'rgba(52,211,153,0.26)' };
  return { color: '#22c55e', background: 'rgba(34,197,94,0.13)', borderColor: 'rgba(34,197,94,0.30)' };
}

function formatSource(source: string): string {
  if (source === 'maincourt') return 'maincourt.com';
  if (source === 'pickleballtournaments') return 'pickleballtournaments.com';
  return source;
}

export function TournamentCard({ tournament, onSelect }: TournamentCardProps) {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const formatCardDate = () => {
    const start = parse(tournament.startDate);
    const end = parse(tournament.endDate);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (tournament.startDate === tournament.endDate) {
      return start.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
    }
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', opts)}–${end.getDate()}`;
    }
    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
  };

  return (
    <div
      className="flex flex-col bg-card border border-border/60 rounded-[10px] overflow-hidden cursor-pointer transition-all duration-200 hover:bg-[#202020] hover:border-[rgba(34,197,94,0.22)] hover:shadow-[0_0_0_1px_rgba(34,197,94,0.12),0_12px_32px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
      onClick={() => onSelect(tournament)}
    >
      {/* Body: left content col + right image col */}
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col gap-2 p-3.5 min-w-0">
          {/* Title */}
          <p className="font-bold text-[15px] leading-snug line-clamp-2">{tournament.name}</p>

          {/* Divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />

          {/* Date / Location grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5 font-mono">Date</p>
              <p className="text-[13px] text-muted-foreground">{formatCardDate()}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5 font-mono">Location</p>
              <p className="text-[13px] text-muted-foreground truncate">{tournament.city}, {tournament.state}</p>
            </div>
          </div>

          {/* Skill badges */}
          {tournament.skillLevels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {tournament.skillLevels.map((level) => (
                <span
                  key={level}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
                  style={getSkillBadgeStyle(level)}
                >
                  {level}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: full-height rectangular image */}
        {tournament.imageUrl && (
          <div className="w-28 flex-shrink-0 relative overflow-hidden flex items-center justify-center p-2" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 15%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%)' }}>
            {/* Blurred background layer */}
            <img src={tournament.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top scale-110" style={{ filter: 'blur(10px)', opacity: 0.5 }} />
            {/* Dark overlay */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
            {/* Sharp inset image */}
            <img src={tournament.imageUrl} alt="" className="relative z-10 w-full rounded-[5px] object-cover object-top" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.6)' }} />
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/60">
        <span className="text-[10px] text-muted-foreground/40 font-mono truncate mr-2">
          {formatSource(tournament.source)}
        </span>
        <a
          href={tournament.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-1 hover:bg-primary/20 transition-colors whitespace-nowrap"
        >
          Sign Up →
        </a>
      </div>
    </div>
  );
}

export function TournamentCardSkeleton({ variant = 'default' }: TournamentCardSkeletonProps) {
  if (variant === 'horizontal') {
    return (
      <div className="flex bg-card border border-border/60 rounded-[10px] overflow-hidden h-auto">
        <div className="w-32 sm:w-48 bg-muted" />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-card border border-border/60 rounded-[10px] overflow-hidden">
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="w-20 h-20 rounded-[7px] flex-shrink-0" />
        </div>
        <div className="h-px bg-border/60" />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </div>
  );
}
