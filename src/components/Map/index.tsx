'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { RidgewaySignal, DronePatrolRoute, SITE_CENTER } from '@/data/mockSignals';

function createSignalIcon(severity: string) {
  const colors: Record<string, string> = {
    critical: '#ff3333',
    high: '#ffdd00',
    medium: '#ff8800',
    low: '#00ffff',
  };
  const color = colors[severity] || '#7da885';
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(0,0,0,0.5);box-shadow:0 0 10px ${color};animation:pulse 2s ease-in-out infinite;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createDroneIcon(active: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${active ? '#00ff66' : '#39ff14'};border:3px solid #040d06;box-shadow:0 0 16px ${active ? '#00ff66' : '#39ff14'};${active ? 'animation:pulse 1s ease-in-out infinite;' : ''}">
      <div style="width:4px;height:4px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const MapFlyTo = ({ coord }: { coord: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coord) map.flyTo(coord, 17, { duration: 2 });
  }, [coord, map]);
  return null;
};

interface TacticalMapProps {
  signals: RidgewaySignal[];
  dronePatrol: DronePatrolRoute;
  activeDroneCoord: [number, number] | null;
  droneActive: boolean;
  showPatrolRoute: boolean;
  onSignalClick: (signal: RidgewaySignal) => void;
}

export default function TacticalMap({
  signals, dronePatrol, activeDroneCoord, droneActive, showPatrolRoute, onSignalClick
}: TacticalMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Suppress default icon URL loading
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-tactical-bg border border-tactical-border rounded-xl font-mono text-tactical-dim text-xs tracking-widest animate-pulse">
        INITIALIZING SPATIAL GRID...
      </div>
    );
  }

  const patrolCoords = dronePatrol.waypoints.map(w => w.coord);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-tactical-border shadow-[0_0_20px_rgba(0,255,102,0.08)]">
      {/* HUD corner labels */}
      <div className="absolute top-2 left-2 z-[400] pointer-events-none font-mono text-[10px] text-tactical-cyan opacity-60 tracking-widest">
        RIDGEWAY SITE — SPATIAL GRID
      </div>
      <div className="absolute top-2 right-2 z-[400] pointer-events-none font-mono text-[10px] text-tactical-dim opacity-60 tracking-widest">
        {signals.length} SIGNALS ACTIVE
      </div>

      <MapContainer
        center={SITE_CENTER}
        zoom={16}
        zoomControl={false}
        className="w-full h-full"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <MapFlyTo coord={activeDroneCoord} />

        {/* Drone patrol route polyline */}
        {showPatrolRoute && (
          <>
            <Polyline
              positions={patrolCoords}
              pathOptions={{ color: '#00ff66', weight: 1.5, opacity: 0.5, dashArray: '4 6' }}
            />
            {dronePatrol.waypoints.map((wp, i) => (
              <Marker key={i} position={wp.coord} icon={L.divIcon({
                className: '',
                html: `<div style="width:6px;height:6px;border-radius:50%;background:#00ff66;opacity:0.7;"></div>`,
                iconSize: [6, 6], iconAnchor: [3, 3],
              })}>
                <Popup>
                  <div style={{ background: '#0a1a0f', color: '#e0f2e5', border: '1px solid #1a3a22', padding: '8px', fontFamily: 'monospace', fontSize: '11px', minWidth: '180px' }}>
                    <div style={{ color: '#00ff66', marginBottom: '4px' }}>V-12 WAYPOINT {i + 1}</div>
                    <div><b>{wp.time}</b></div>
                    <div style={{ opacity: 0.8, marginTop: '4px' }}>{wp.note}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* Signal markers */}
        {signals.map(signal => (
          <Marker
            key={signal.id}
            position={signal.location}
            icon={createSignalIcon(signal.severity)}
            eventHandlers={{ click: () => onSignalClick(signal) }}
          >
            <Popup>
              <div style={{ background: '#0a1a0f', color: '#e0f2e5', border: '1px solid #1a3a22', padding: '8px', fontFamily: 'monospace', fontSize: '11px', minWidth: '220px' }}>
                <div style={{ color: signal.severity === 'critical' ? '#ff3333' : signal.severity === 'high' ? '#ffdd00' : '#00ffff', marginBottom: '4px', fontWeight: 'bold' }}>
                  {signal.id} — {signal.type.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{signal.zone}</div>
                <div style={{ opacity: 0.8, fontSize: '10px' }}>{signal.timestamp}</div>
                <div style={{ marginTop: '6px', fontSize: '10px', lineHeight: '1.4', opacity: 0.9 }}>{signal.description.slice(0, 100)}...</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active drone position */}
        {activeDroneCoord && (
          <Marker position={activeDroneCoord} icon={createDroneIcon(droneActive)}>
            <Popup>
              <div style={{ background: '#0a1a0f', color: '#00ff66', border: '1px solid #1a3a22', padding: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold' }}>DRONE V-09</div>
                <div style={{ opacity: 0.8, marginTop: '4px' }}>{droneActive ? 'MISSION ACTIVE' : 'MISSION COMPLETE'}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[400] glass-panel px-3 py-2 rounded-lg space-y-1 pointer-events-none">
        {[
          { color: '#ff3333', label: 'Critical' },
          { color: '#ffdd00', label: 'High' },
          { color: '#ff8800', label: 'Medium' },
          { color: '#00ffff', label: 'Low' },
          { color: '#00ff66', label: 'Drone' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 font-mono text-[10px]">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-tactical-dim">{label}</span>
          </div>
        ))}
      </div>

      {/* Inject pulse keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        .leaflet-popup-content-wrapper { background:#0a1a0f!important;color:#e0f2e5!important;border:1px solid #1a3a22!important;border-radius:4px!important;padding:0!important;box-shadow:0 4px 20px rgba(0,0,0,0.8)!important; }
        .leaflet-popup-tip { background:#0a1a0f!important; }
        .leaflet-popup-content { margin:0!important; }
        .leaflet-popup-close-button { color:#7da885!important; }
      ` }} />
    </div>
  );
}
