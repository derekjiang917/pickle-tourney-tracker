import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Registration } from '@/hooks/useSignups';

interface Props {
  pending: Registration[];
  onConfirm: (tournamentId: string) => Promise<void>;
  onDecline: (tournamentId: string) => Promise<void>;
}

function formatDateRange(startDate: string, endDate: string): string {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const start = parse(startDate);
  const end = parse(endDate);
  if (startDate === endDate) return start.toLocaleDateString('en-US', opts);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', opts)}`;
}

export function RegistrationConfirmPopup({ pending, onConfirm, onDecline }: Props) {
  const [index, setIndex] = useState(0);
  const [isActing, setIsActing] = useState(false);

  // Reset index when pending list changes
  useEffect(() => {
    setIndex(0);
  }, [pending.length]);

  const current = pending[index];
  const isOpen = pending.length > 0 && index < pending.length;

  const handleConfirm = async () => {
    if (!current || isActing) return;
    setIsActing(true);
    try {
      await onConfirm(current.tournamentId);
      setIndex((i) => i + 1);
    } finally {
      setIsActing(false);
    }
  };

  const handleDecline = async () => {
    if (!current || isActing) return;
    setIsActing(true);
    try {
      await onDecline(current.tournamentId);
      setIndex((i) => i + 1);
    } finally {
      setIsActing(false);
    }
  };

  if (!current) return null;

  const total = pending.length;

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-sm p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // Hide the default close button
        style={{ ['--dialog-close-display' as string]: 'none' }}
      >
        <DialogTitle className="sr-only">Confirm Registration</DialogTitle>
        <DialogDescription className="sr-only">
          Did you register for {current.tournament.name}?
        </DialogDescription>

        <div className="px-5 pt-5 pb-1">
          {total > 1 && (
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">
              {index + 1} of {total} pending
            </p>
          )}
          <p className="text-base font-semibold leading-snug mb-1">
            Did you register for this tournament?
          </p>
          <p className="text-[11px] text-muted-foreground/50 font-mono uppercase tracking-widest mb-4">
            We noticed you clicked through
          </p>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-3">
          <div className="rounded-lg border border-border/60 bg-card p-3.5">
            <p className="font-semibold text-[14px] leading-snug mb-1.5">{current.tournament.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(current.tournament.startDate, current.tournament.endDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {current.tournament.city}, {current.tournament.state}
            </p>
          </div>

          <Button
            onClick={() => void handleConfirm()}
            disabled={isActing}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold"
          >
            Yes, I registered!
          </Button>
          <Button
            variant="ghost"
            onClick={() => void handleDecline()}
            disabled={isActing}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            No, remove it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
