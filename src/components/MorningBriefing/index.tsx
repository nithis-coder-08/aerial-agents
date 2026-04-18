'use client';

import { MorningBriefing } from '@/data/mockSignals';
import { FileText, AlertTriangle, CheckCircle2, Clock, ArrowRight, Download, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BriefingPanelProps {
  briefing: MorningBriefing;
  onClose: () => void;
}

export default function BriefingPanel({ briefing, onClose }: BriefingPanelProps) {
  const handlePrint = () => window.print();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl border border-tactical-border shadow-[0_0_60px_rgba(0,255,102,0.1)]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-tactical-border bg-tactical-panel/90 backdrop-blur z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tactical-green/10 rounded border border-tactical-green/30">
              <FileText size={18} className="text-tactical-green" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">MORNING BRIEFING</h2>
              <p className="text-[10px] font-mono text-tactical-dim tracking-widest">FOR NISHA · GENERATED {briefing.generatedAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 border border-tactical-border rounded hover:border-tactical-cyan text-tactical-dim hover:text-tactical-cyan transition-all"
              title="Download/Print"
            >
              <Download size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 border border-tactical-border rounded hover:border-tactical-danger text-tactical-dim hover:text-tactical-danger transition-all"
            >
              <XCircle size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 font-sans">
          {/* Headline */}
          <div className="border-l-4 border-tactical-green pl-4">
            <p className="text-[10px] font-mono text-tactical-dim tracking-widest mb-1">HEADLINE</p>
            <p className="text-lg font-bold text-white leading-tight">{briefing.headline}</p>
          </div>

          {/* What Happened */}
          <div>
            <p className="text-[10px] font-mono text-tactical-dim tracking-widest mb-2 flex items-center gap-1.5">
              <Clock size={10} /> WHAT HAPPENED LAST NIGHT
            </p>
            <p className="text-sm text-tactical-foreground/90 leading-relaxed">{briefing.whatHappened}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Harmless */}
            {briefing.whatIsHarmless.length > 0 && (
              <div className="bg-tactical-emerald/5 border border-tactical-emerald/20 rounded-xl p-4">
                <p className="text-[10px] font-mono text-tactical-emerald tracking-widest mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={10} /> CLEARED / HARMLESS
                </p>
                <ul className="space-y-1.5">
                  {briefing.whatIsHarmless.map((item, i) => (
                    <li key={i} className="text-xs text-tactical-foreground/80 flex gap-2">
                      <ArrowRight size={10} className="shrink-0 mt-0.5 text-tactical-emerald" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Escalation */}
            {briefing.whatNeedsEscalation.length > 0 && (
              <div className="bg-tactical-danger/5 border border-tactical-danger/20 rounded-xl p-4">
                <p className="text-[10px] font-mono text-tactical-danger tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={10} /> NEEDS ESCALATION
                </p>
                <ul className="space-y-1.5">
                  {briefing.whatNeedsEscalation.map((item, i) => (
                    <li key={i} className="text-xs text-tactical-foreground/80 flex gap-2">
                      <ArrowRight size={10} className="shrink-0 mt-0.5 text-tactical-danger" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Drone Findings */}
          <div className="bg-tactical-cyan/5 border border-tactical-cyan/20 rounded-xl p-4">
            <p className="text-[10px] font-mono text-tactical-cyan tracking-widest mb-2">DRONE PATROL FINDINGS</p>
            <p className="text-xs text-tactical-foreground/90 leading-relaxed">{briefing.droneFindings}</p>
          </div>

          {/* Follow-ups */}
          {briefing.pendingFollowUps.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-tactical-alert tracking-widest mb-2">PENDING FOLLOW-UPS</p>
              <ul className="space-y-1.5">
                {briefing.pendingFollowUps.map((item, i) => (
                  <li key={i} className="text-xs text-tactical-foreground/80 flex gap-2 border border-tactical-alert/20 rounded p-2 bg-tactical-alert/5">
                    <ArrowRight size={10} className="shrink-0 mt-0.5 text-tactical-alert" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Handoff note to Nisha */}
          <div className="border-2 border-tactical-green/30 rounded-xl p-4 bg-tactical-green/5">
            <p className="text-[10px] font-mono text-tactical-green tracking-widest mb-2">HANDOFF TO NISHA</p>
            <p className="text-sm text-white leading-relaxed italic">"{briefing.handoffNote}"</p>
            <div className="mt-3 text-right">
              <span className="text-[10px] font-mono text-tactical-dim">— Maya, Ops Lead · {briefing.generatedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
