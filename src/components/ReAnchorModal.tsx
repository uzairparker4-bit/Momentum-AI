'use client';

import { useState, useTransition } from 'react';
import { regenerateTasks } from '@/actions';

export default function ReAnchorModal({ phaseId }: { phaseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    startTransition(() => {
      regenerateTasks(phaseId, reason);
      setIsOpen(false);
      setReason('');
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/80 transition-colors text-sm border-b border-white/20 pb-1"
      >
        Re-align Vision
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-xl text-foreground mb-2">What was the original reason you started this?</h3>
        <p className="text-sm text-white/50 mb-6">Let&apos;s reset the path and lower the friction.</p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-foreground placeholder:text-white/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none min-h-[120px] mb-6"
            placeholder="I wanted to..."
          />
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="px-6 py-2 rounded-full bg-accent text-background font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? 'Regenerating...' : 'Regenerate Path'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
