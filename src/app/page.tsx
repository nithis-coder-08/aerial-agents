'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import {
  overnightSignals, dronePatrolRoute, Investigation, IncidentAnalysis, MorningBriefing,
  RidgewaySignal, IncidentStatus,
} from '@/data/mockSignals';
import AgentPanel from '@/components/AgentInterface';
import { ReviewCard } from '@/components/InvestigationDraft';
import BriefingPanel from '@/components/MorningBriefing';
import {
  Radio, Crosshair, FileText, MapPin, Loader2, Play,
  RefreshCw, RotateCcw, Clock, AlertOctagon, Eye,
} from 'lucide-react';

const TacticalMap = dynamic(() => import('@/components/Map'), { ssr: false });

type AppPhase = 'idle' | 'investigating' | 'review' | 'drone_mission' | 'briefing';

export default function OperationsRoom() {
  const [currentTime, setCurrentTime] = useState('');
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [agentPhaseLabel, setAgentPhaseLabel] = useState('');
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [analyses, setAnalyses] = useState<IncidentAnalysis[]>([]);
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showPatrolRoute, setShowPatrolRoute] = useState(true);
  const [droneCoord, setDroneCoord] = useState<[number, number] | null>(null);
  const [droneActive, setDroneActive] = useState(false);
  const [droneMissionLog, setDroneMissionLog] = useState<string[]>([]);
  const [highlightedSignalId, setHighlightedSignalId] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<RidgewaySignal | null>(null);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const runInvestigation = useCallback(async () => {
    setPhase('investigating');
    setInvestigation(null);
    setAnalyses([]);
    setBriefing(null);
    setDroneMissionLog([]);
    setDroneCoord(null);
    setDroneActive(false);

    setAgentPhaseLabel('INITIALIZING AGENT');

    try {
      const phaseLabels = ['QUERYING BADGE LOGS', 'CHECKING DRONE FOOTAGE', 'CHECKING MAINTENANCE', 'QUERYING VEHICLE REGISTRY', 'SYNTHESIZING FINDINGS'];
      let pi = 0;
      const labelInterval = setInterval(() => {
        setAgentPhaseLabel(phaseLabels[pi % phaseLabels.length]);
        pi++;
      }, 4000);

      const res = await fetch('/api/investigate', { method: 'POST' });
      clearInterval(labelInterval);

      if (!res.ok) throw new Error('Investigation API failed');
      const data: Investigation = await res.json();

      setInvestigation(data);
      setAnalyses(data.incidentAnalyses);
      setPhase('review');
      setAgentPhaseLabel('');
    } catch (e) {
      console.error(e);
      setPhase('idle');
      setAgentPhaseLabel('');
    }
  }, []);

  const handleVerdict = useCallback((signalId: string, verdict: IncidentStatus, note?: string) => {
    setAnalyses(prev => prev.map(a =>
      a.signalId === signalId ? { ...a, humanVerdict: verdict, humanNote: note } : a
    ));
  }, []);

  const reviewedCount = analyses.filter(a => a.humanVerdict).length;
  const canGenerateBriefing = reviewedCount > 0;

  const generateBriefing = useCallback(async () => {
    if (!investigation) return;
    setPhase('briefing');
    const invWithVerdicts = { ...investigation, incidentAnalyses: analyses };
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invWithVerdicts),
      });
      if (!res.ok) throw new Error('Briefing API failed');
      const data: MorningBriefing = await res.json();
      setBriefing(data);
      setShowBriefing(true);
      setPhase('review');
    } catch (e) {
      console.error(e);
      setPhase('review');
    }
  }, [investigation, analyses]);

  const launchDroneMission = useCallback(async (signal: RidgewaySignal) => {
    setPhase('drone_mission');
    setDroneActive(true);
    setDroneMissionLog([]);
    setSelectedSignal(signal);

    try {
      const res = await fetch('/api/drone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: signal.zone, coord: signal.location }),
      });
      const data: { updates: { status: string; message: string; time: string; coord: [number, number] | null }[] } = await res.json();

      for (const update of data.updates) {
        await new Promise(r => setTimeout(r, 1200));
        setDroneMissionLog(prev => [...prev, update.message]);
        if (update.coord) setDroneCoord(update.coord);
      }
      setDroneActive(false);
      setPhase('review');
    } catch (e) {
      console.error(e);
      setDroneActive(false);
      setPhase('review');
    }
  }, []);

  const severityCounts = {
    critical: overnightSignals.filter(s => s.severity === 'critical').length,
    high: overnightSignals.filter(s => s.severity === 'high').length,
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-tactical-bg text-tactical-foreground overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-tactical-border bg-black/50 z-20">
        <div className="flex items-center gap-3">
          <Radio size={18} className="text-tactical-emerald animate-pulse" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">6:10 ASSISTANT</h1>
            <p className="text-[9px] font-mono text-tactical-dim tracking-widest">RIDGEWAY SITE INTELLIGENCE PLATFORM</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-4 text-[10px] font-mono text-tactical-dim border-l border-tactical-border pl-4">
            <MapPin size={10} />
            <span>BLOCK C PRIORITY</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status chips */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-tactical-danger">
              <span className="w-2 h-2 rounded-full bg-tactical-danger animate-pulse" />
              {severityCounts.critical} CRITICAL
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-tactical-alert">
              <span className="w-2 h-2 rounded-full bg-tactical-alert" />
              {severityCounts.high} HIGH
            </div>
          </div>

          {/* Time */}
          <div className="text-right">
            <div className="font-mono text-xs text-tactical-cyan glow-text">{currentTime}</div>
            <div className="font-mono text-[9px] text-tactical-dim">REVIEW BY 08:00</div>
          </div>

          {/* Patrol toggle */}
          <button
            onClick={() => setShowPatrolRoute(v => !v)}
            className={`hidden sm:flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1.5 rounded border transition-all ${showPatrolRoute ? 'border-tactical-emerald text-tactical-emerald bg-tactical-emerald/10' : 'border-tactical-border text-tactical-dim'}`}
          >
            <Eye size={11} /> PATROL ROUTE
          </button>
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden gap-0">

        {/* LEFT PANEL */}
        <aside className="w-[340px] shrink-0 flex flex-col border-r border-tactical-border bg-black/20 overflow-hidden">

          {/* Raghav's Note */}
          <div className="shrink-0 mx-3 mt-3 bg-tactical-alert/10 border border-tactical-alert/30 rounded-lg px-3 py-2">
            <div className="font-mono text-[9px] text-tactical-alert tracking-widest mb-1">NIGHT SUPERVISOR NOTE — RAGHAV</div>
            <p className="text-xs text-tactical-foreground/90 italic">"Please check Block C before leadership asks."</p>
          </div>

          {/* CTA: Start investigation */}
          {phase === 'idle' && (
            <div className="shrink-0 p-3">
              <button
                onClick={runInvestigation}
                className="w-full py-3 px-4 font-mono text-sm font-bold tracking-widest border border-tactical-emerald text-tactical-emerald rounded-xl hover:bg-tactical-emerald hover:text-black transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.15)]"
              >
                <Play size={16} /> BEGIN INVESTIGATION
              </button>
              <p className="text-center font-mono text-[10px] text-tactical-dim mt-2">AI will query all tools automatically</p>
            </div>
          )}

          {/* Running state */}
          {phase === 'investigating' && (
            <div className="shrink-0 p-3">
              <div className="w-full py-3 px-4 font-mono text-sm font-bold tracking-widest border border-tactical-cyan text-tactical-cyan rounded-xl flex items-center justify-center gap-2 animate-pulse">
                <Loader2 size={16} className="animate-spin" /> AGENT RUNNING
              </div>
            </div>
          )}

          {/* Review phase controls */}
          {(phase === 'review' || phase === 'drone_mission' || phase === 'briefing') && (
            <div className="shrink-0 p-3 flex gap-2">
              <button
                onClick={runInvestigation}
                className="flex-1 py-2 px-3 font-mono text-[10px] tracking-widest border border-tactical-border text-tactical-dim rounded-lg hover:border-tactical-dim transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={11} /> RE-INVESTIGATE
              </button>
              <button
                onClick={generateBriefing}
                disabled={!canGenerateBriefing || phase === 'briefing'}
                className={`flex-1 py-2 px-3 font-mono text-[10px] tracking-widest rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                  canGenerateBriefing && phase !== 'briefing'
                    ? 'border-tactical-green text-tactical-green hover:bg-tactical-green hover:text-black'
                    : 'border-tactical-border text-tactical-dim cursor-not-allowed'
                }`}
              >
                {phase === 'briefing' ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                {phase === 'briefing' ? 'GENERATING...' : 'BRIEFING'}
              </button>
            </div>
          )}

          {/* Review progress */}
          {analyses.length > 0 && (
            <div className="shrink-0 px-3 pb-2">
              <div className="flex justify-between font-mono text-[10px] text-tactical-dim mb-1">
                <span>MAYA'S REVIEW</span>
                <span>{reviewedCount}/{analyses.length} DONE</span>
              </div>
              <div className="h-1 bg-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-tactical-emerald transition-all"
                  style={{ width: `${(reviewedCount / analyses.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Correlation findings */}
          {investigation?.correlations && investigation.correlations.length > 0 && (
            <div className="shrink-0 mx-3 mb-2 bg-tactical-cyan/5 border border-tactical-cyan/20 rounded-lg p-2.5">
              <div className="font-mono text-[10px] text-tactical-cyan tracking-widest mb-2">AI CORRELATIONS</div>
              {investigation.correlations.map((c, i) => (
                <p key={i} className="text-[10px] text-tactical-foreground/80 leading-relaxed mb-1 last:mb-0">{c}</p>
              ))}
            </div>
          )}

          {/* Agent tool log */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 pb-3">
            <AgentPanel
              toolCalls={investigation?.toolCallLog ?? []}
              isRunning={phase === 'investigating'}
              phase={agentPhaseLabel}
            />
          </div>
        </aside>

        {/* CENTER — MAP */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <TacticalMap
            signals={overnightSignals}
            dronePatrol={dronePatrolRoute}
            activeDroneCoord={droneCoord}
            droneActive={droneActive}
            showPatrolRoute={showPatrolRoute}
            onSignalClick={(sig) => setHighlightedSignalId(sig.id)}
          />

          {/* Drone mission log overlay */}
          {droneMissionLog.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] w-[480px] max-w-[90vw] glass-panel rounded-xl border border-tactical-emerald/50 p-3 space-y-1.5 shadow-[0_0_40px_rgba(0,255,102,0.2)]">
              <div className="font-mono text-[10px] text-tactical-emerald tracking-widest mb-2 flex items-center gap-2">
                {droneActive && <span className="w-2 h-2 rounded-full bg-tactical-emerald animate-pulse" />}
                DRONE V-09 · {droneActive ? 'MISSION ACTIVE' : 'MISSION COMPLETE'}
              </div>
              {droneMissionLog.map((log, i) => (
                <div key={i} className={`font-mono text-xs flex gap-2 ${i === droneMissionLog.length - 1 ? 'text-tactical-emerald' : 'text-tactical-dim opacity-60'}`}>
                  <span>›</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Signal Review */}
        <aside className="w-[340px] shrink-0 flex flex-col border-l border-tactical-border bg-black/20 overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-tactical-border flex items-center justify-between">
            <div className="font-mono text-xs font-semibold tracking-widest text-tactical-foreground flex items-center gap-2">
              <AlertOctagon size={14} className="text-tactical-danger" />
              SIGNAL REVIEW
            </div>
            <span className="font-mono text-[10px] text-tactical-dim">{overnightSignals.length} SIGNALS</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {phase === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-tactical-dim gap-3 p-6 text-center">
                <Clock size={32} className="opacity-30" />
                <p className="text-xs font-mono tracking-widest opacity-50">AWAITING INVESTIGATION</p>
                <p className="text-[10px] opacity-40">Start the AI investigation to review overnight signals</p>
              </div>
            )}

            {phase === 'investigating' && (
              <div className="h-full flex flex-col items-center justify-center text-tactical-dim gap-3">
                <Loader2 size={24} className="animate-spin text-tactical-cyan opacity-60" />
                <p className="text-[10px] font-mono tracking-widest opacity-60">{agentPhaseLabel}...</p>
              </div>
            )}

            {analyses.length > 0 && overnightSignals.map(sig => {
              const analysis = analyses.find(a => a.signalId === sig.id);
              if (!analysis) return null;
              return (
                <ReviewCard
                  key={sig.id}
                  signal={sig}
                  analysis={analysis}
                  onVerdict={handleVerdict}
                  isHighlighted={highlightedSignalId === sig.id}
                />
              );
            })}

            {/* Drone dispatch from selected signal */}
            {analyses.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="font-mono text-[10px] text-tactical-dim tracking-widest px-1">DISPATCH DRONE VERIFICATION</div>
                {overnightSignals.filter(s => s.type !== 'drone_patrol').map(sig => (
                  <button
                    key={sig.id}
                    onClick={() => launchDroneMission(sig)}
                    disabled={phase === 'drone_mission' || phase === 'investigating'}
                    className="w-full text-left px-3 py-2 rounded-lg border border-tactical-border text-tactical-dim hover:border-tactical-emerald hover:text-tactical-emerald transition-all font-mono text-[10px] tracking-wider flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Crosshair size={11} />
                    Verify {sig.id} · {sig.zone.split('—')[0].trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Show briefing button if already generated */}
          {briefing && (
            <div className="shrink-0 p-3 border-t border-tactical-border">
              <button
                onClick={() => setShowBriefing(true)}
                className="w-full py-2 font-mono text-[10px] tracking-widest border border-tactical-green text-tactical-green hover:bg-tactical-green hover:text-black transition-all rounded-lg flex items-center justify-center gap-2"
              >
                <FileText size={12} /> VIEW MORNING BRIEFING
              </button>
            </div>
          )}
        </aside>

      </main>

      {/* ── Morning Briefing Modal ─────────────────────────── */}
      <AnimatePresence>
        {showBriefing && briefing && (
          <BriefingPanel briefing={briefing} onClose={() => setShowBriefing(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
