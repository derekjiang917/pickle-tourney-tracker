import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Tournament } from '@/types/tournament';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, MapPin } from 'lucide-react';
import { RegisterButton } from '@/components/signup/RegisterButton';

interface TournamentModalProps {
  tournament: Tournament | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSkillBadgeStyle(level: string): React.CSSProperties {
  const num = parseFloat(level.replace('+', ''));
  if (num <= 3.0) return { color: '#94a3b8', background: 'rgba(100,116,139,0.11)', borderColor: 'rgba(100,116,139,0.26)' };
  if (num <= 3.5) return { color: '#60a5fa', background: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.26)' };
  if (num <= 4.0) return { color: '#22d3ee', background: 'rgba(34,211,238,0.10)', borderColor: 'rgba(34,211,238,0.26)' };
  if (num <= 4.5) return { color: '#34d399', background: 'rgba(52,211,153,0.11)', borderColor: 'rgba(52,211,153,0.26)' };
  return { color: '#22c55e', background: 'rgba(34,197,94,0.13)', borderColor: 'rgba(34,197,94,0.30)' };
}

export function TournamentModal({ tournament, open, onOpenChange }: TournamentModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const justClosedLightbox = useRef(false);

  useEffect(() => { if (!open) setLightboxOpen(false); }, [open]);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.cursor = 'zoom-out';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    const onUp = () => { justClosedLightbox.current = true; setLightboxOpen(false); setTimeout(() => { justClosedLightbox.current = false; }, 100); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerup', onUp);
    };
  }, [lightboxOpen]);

  if (!tournament) return null;

  const parse = (s: string) => {
    const [y, m, d] = s.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const formatDate = (s: string) =>
    parse(s).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

  const formatDateRange = () => {
    if (tournament.startDate === tournament.endDate) return formatDate(tournament.startDate);
    return `${formatDate(tournament.startDate)} – ${formatDate(tournament.endDate)}`;
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.location)}`;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[900px] p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => { if (lightboxOpen) e.preventDefault(); }}
        onInteractOutside={(e) => { if (lightboxOpen) e.preventDefault(); }}
      >
        <DialogTitle className="sr-only">{tournament.name}</DialogTitle>
        <DialogDescription className="sr-only">Tournament details</DialogDescription>

        <div className="flex min-h-[420px]">
          {/* Left: image column */}
          {tournament.imageUrl && (
            <div
              className="hidden sm:flex w-[360px] flex-shrink-0 border-r border-white/[0.06] overflow-hidden relative group cursor-zoom-in"
              onClick={() => { if (justClosedLightbox.current) return; setLightboxOpen(true); }}
            >
              <img
                src={tournament.imageUrl}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover scale-110"
                style={{ filter: 'blur(24px) saturate(0.4) brightness(0.35)', pointerEvents: 'none' }}
              />
              <img
                src={tournament.imageUrl}
                alt=""
                className="relative w-full h-full object-contain"
                style={{ filter: 'saturate(0.8)', pointerEvents: 'none' }}
              />
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200"
                style={{ pointerEvents: 'none' }}
              />
            </div>
          )}

          {/* Right: details */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="px-5 pt-5 pb-4 pr-12">
              <h2 className="text-[17px] font-semibold tracking-tight leading-snug">
                {tournament.name}
              </h2>
            </div>

            <div className="flex-1 flex flex-col gap-4 px-5 pb-4 overflow-y-auto">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground bg-white/[0.025] border border-white/[0.05] rounded-lg px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                  <span>{formatDateRange()}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground bg-white/[0.025] border border-white/[0.05] rounded-lg px-3 py-2">
                  <MapPin className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {tournament.location}
                  </a>
                </div>
              </div>

              {tournament.skillLevels.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2 font-mono">Skill Levels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tournament.skillLevels.map((level) => (
                      <span
                        key={level}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        style={getSkillBadgeStyle(level)}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tournament.description && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2 font-mono">About</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {tournament.description}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06]">
              <RegisterButton
                tournamentId={tournament.id}
                sourceUrl={tournament.sourceUrl}
                className="w-full"
              />
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>

    {lightboxOpen && tournament.imageUrl && createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.92)',
          cursor: 'zoom-out',
        }}
      >
        <img
          src={tournament.imageUrl}
          alt={tournament.name}
          className="animate-in fade-in-0 zoom-in-90 duration-200"
          style={{
            maxHeight: '92vh',
            maxWidth: '88vw',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
          }}
        />
      </div>,
      document.body
    )}
    </>
  );
}
