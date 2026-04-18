'use client';

import { ToolCallRecord } from '@/data/mockSignals';
import { Cpu, Terminal, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentPanelProps {
  toolCalls: ToolCallRecord[];
  isRunning: boolean;
  phase: string;
}

const TOOL_COLORS: Record<string, string> = {
  query_badge_logs: '#00ffff',
  check_drone_footage_metadata: '#00ff66',
  check_maintenance_schedule: '#ffdd00',
  query_vehicle_registry: '#ff8800',
};

export default function AgentPanel({ toolCalls, isRunning, phase }: AgentPanelProps) {
  return (
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tactical-border bg-black/30 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-tactical-cyan" />
          <span className="font-mono text-xs font-semibold tracking-widest text-tactical-foreground">AGENT · TOOL LOG</span>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <Loader2 size={12} className="text-tactical-emerald animate-spin" />
              <span className="font-mono text-[10px] text-tactical-emerald tracking-widest animate-pulse">{phase}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-tactical-dim" />
              <span className="font-mono text-[10px] text-tactical-dim tracking-widest">
                {toolCalls.length > 0 ? `${toolCalls.length} CALLS COMPLETE` : 'IDLE'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tool Call Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {toolCalls.length === 0 && !isRunning && (
          <div className="h-full flex items-center justify-center text-tactical-dim opacity-40 flex-col gap-2">
            <Terminal size={20} />
            <span className="tracking-widest text-[10px]">NO TOOL CALLS YET</span>
          </div>
        )}

        <AnimatePresence>
          {toolCalls.map((tc, i) => {
            const color = TOOL_COLORS[tc.toolName] || '#7da885';
            let outputPreview = tc.output;
            try {
              const parsed = JSON.parse(tc.output);
              // Pull out the most readable top-level field
              const noteField = parsed.note || parsed.finding || parsed.thermal_summary || parsed.finding || Object.values(parsed)[1];
              outputPreview = typeof noteField === 'string' ? noteField : JSON.stringify(parsed).slice(0, 120) + '...';
            } catch { /* keep raw */ }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="border border-tactical-border/40 rounded-lg overflow-hidden"
              >
                {/* Tool call header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-black/30">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight size={10} style={{ color }} />
                    <span style={{ color }} className="font-bold text-[11px]">{tc.toolName}()</span>
                  </div>
                  <div className="flex items-center gap-2 text-tactical-dim text-[10px]">
                    <span>{tc.durationMs}ms</span>
                    <span>{tc.timestamp}</span>
                  </div>
                </div>

                {/* Input args */}
                <div className="px-3 py-1.5 border-t border-tactical-border/20 text-[10px] text-tactical-dim">
                  {Object.entries(tc.input).map(([k, v]) => (
                    <span key={k} className="mr-3 opacity-70"><span className="text-tactical-dim/60">{k}:</span> <span className="text-tactical-foreground/80">{v}</span></span>
                  ))}
                </div>

                {/* Output */}
                <div className="px-3 py-2 border-t border-tactical-border/20 bg-black/20 text-[10px] text-tactical-foreground/80 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck size={10} className="text-tactical-emerald shrink-0 mt-0.5" />
                    <span className="break-words">{outputPreview}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-tactical-cyan/20 rounded-lg px-3 py-2 bg-tactical-cyan/5 flex items-center gap-2 text-tactical-cyan text-[10px]"
          >
            <Loader2 size={10} className="animate-spin shrink-0" />
            <span className="animate-pulse">{phase}...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
