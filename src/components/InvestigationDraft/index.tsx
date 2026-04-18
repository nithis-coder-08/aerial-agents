'use client';

import { IncidentAnalysis, RidgewaySignal, IncidentStatus } from '@/data/mockSignals';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VERDICT_CONFIG = {
  harmless: { color: '#00ff66', icon: CheckCircle2, label: 'HARMLESS' },
  suspicious: { color: '#ffdd00', icon: AlertTriangle, label: 'SUSPICIOUS' },
  critical: { color: '#ff3333', icon: XCircle, label: 'CRITICAL' },
  unknown: { color: '#7da885', icon: HelpCircle, label: 'UNKNOWN' },
};

interface ReviewCardProps {
  signal: RidgewaySignal;
  analysis: IncidentAnalysis;
  onVerdict: (signalId: string, verdict: IncidentStatus, note?: string) => void;
  isHighlighted: boolean;
}

export function ReviewCard({ signal, analysis, onVerdict, isHighlighted }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNote, setShowNote] = useState(false);

  const config = VERDICT_CONFIG[analysis.agentVerdict] || VERDICT_CONFIG.unknown;
  const Icon = config.icon;
  const humanSet = analysis.humanVerdict;

  const HUMAN_ACTIONS: { label: string; verdict: IncidentStatus; style: string }[] = [
    { label: 'HARMLESS', verdict: 'harmless', style: 'border-tactical-emerald text-tactical-emerald hover:bg-tactical-emerald/10' },
    { label: 'ESCALATE', verdict: 'escalated', style: 'border-tactical-danger text-tactical-danger hover:bg-tactical-danger/10' },
    { label: 'FOLLOW UP', verdict: 'pending_followup', style: 'border-tactical-alert text-tactical-alert hover:bg-tactical-alert/10' },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden transition-all duration-200 ${
        isHighlighted ? 'border-tactical-cyan shadow-[0_0_12px_rgba(0,255,255,0.2)]' : 'border-tactical-border'
      } ${humanSet ? 'opacity-90' : ''}`}
    >
      {/* Signal header */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/[0.02] select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon size={16} style={{ color: config.color }} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[10px] text-tactical-dim">{signal.id}</span>
            <span className="font-mono text-[10px]" style={{ color: config.color }}>{config.label}</span>
            <span className="font-mono text-[10px] text-tactical-dim ml-auto">{analysis.confidencePercent}%</span>
          </div>
          <div className="text-sm font-semibold text-white truncate">{signal.zone}</div>
          <div className="text-[11px] text-tactical-dim mt-0.5">{signal.timestamp} · {signal.type.replace('_', ' ')}</div>
        </div>
        {/* Confidence bar mini */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="w-14 h-1 bg-black rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${analysis.confidencePercent}%`, background: config.color }}
            />
          </div>
          {humanSet && (
            <span className="font-mono text-[9px] text-tactical-emerald tracking-widest">REVIEWED ✓</span>
          )}
          {expanded ? <ChevronUp size={12} className="text-tactical-dim" /> : <ChevronDown size={12} className="text-tactical-dim" />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-tactical-border/50 px-3 py-3 space-y-3 bg-black/20">
              {/* Reasoning */}
              <div>
                <div className="font-mono text-[10px] text-tactical-dim tracking-widest mb-1">AI REASONING</div>
                <p className="text-xs text-tactical-foreground/90 leading-relaxed">{analysis.reasoning}</p>
              </div>

              {/* Uncertainty */}
              <div className="bg-tactical-alert/5 border border-tactical-alert/20 rounded-lg p-2">
                <div className="font-mono text-[10px] text-tactical-alert tracking-widest mb-1">UNCERTAINTY</div>
                <p className="text-xs text-tactical-foreground/80 leading-relaxed">{analysis.uncertainty}</p>
              </div>

              {/* Recommended action */}
              <div>
                <div className="font-mono text-[10px] text-tactical-dim tracking-widest mb-1">RECOMMENDED ACTION</div>
                <p className="text-xs text-tactical-cyan leading-relaxed">{analysis.recommendedAction}</p>
              </div>

              {/* Human review controls */}
              {!humanSet ? (
                <div className="space-y-2">
                  <div className="font-mono text-[10px] text-tactical-dim tracking-widest">MAYA'S DECISION</div>
                  <div className="flex gap-2 flex-wrap">
                    {HUMAN_ACTIONS.map(a => (
                      <button
                        key={a.verdict}
                        onClick={() => onVerdict(signal.id, a.verdict, noteText || undefined)}
                        className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-all tracking-widest ${a.style}`}
                      >
                        {a.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowNote(n => !n)}
                      className="font-mono text-[10px] px-3 py-1.5 rounded border border-tactical-border text-tactical-dim hover:border-tactical-dim transition-all tracking-widest flex items-center gap-1"
                    >
                      <MessageSquare size={10} /> NOTE
                    </button>
                  </div>
                  {showNote && (
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add context or override note..."
                      className="w-full bg-black/40 border border-tactical-border rounded p-2 text-xs text-tactical-foreground font-mono resize-none h-16 focus:outline-none focus:border-tactical-cyan"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-tactical-emerald/10 border border-tactical-emerald/30 rounded-lg p-2">
                  <CheckCircle2 size={12} className="text-tactical-emerald shrink-0" />
                  <div>
                    <span className="font-mono text-[10px] text-tactical-emerald tracking-widest">MARKED: {humanSet.toUpperCase().replace('_', ' ')}</span>
                    {analysis.humanNote && <p className="text-[10px] text-tactical-dim mt-0.5">{analysis.humanNote}</p>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
