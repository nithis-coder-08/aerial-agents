// ============================================================
// Ridgeway Site — Simulated Data Layer
// All coordinates are centered on a fictitious industrial site
// ============================================================

export type SignalType = 'fence_alert' | 'vehicle_path' | 'badge_failure' | 'drone_patrol';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'unreviewed' | 'harmless' | 'escalated' | 'pending_followup';

// Ridgeway Site — center approx. 12.9716° N, 77.5946° E (Bangalore industrial cluster)
export const SITE_CENTER: [number, number] = [12.9716, 77.5946];

export interface RidgewaySignal {
  id: string;
  type: SignalType;
  timestamp: string;       // "03:14 AM"
  location: [number, number];
  zone: string;            // "Gate 3", "Block C", "Yard B"
  description: string;
  severity: Severity;
  status: IncidentStatus;
  relatedSignals?: string[]; // IDs of correlated signals
}

export interface DroneWaypoint {
  coord: [number, number];
  time: string;
  note: string;
}

export interface DronePatrolRoute {
  droneId: string;
  startTime: string;
  endTime: string;
  waypoints: DroneWaypoint[];
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, string>;
  output: string;
  timestamp: string;
  durationMs: number;
}

export interface IncidentAnalysis {
  signalId: string;
  agentVerdict: 'harmless' | 'suspicious' | 'critical' | 'unknown';
  confidencePercent: number;
  reasoning: string;
  uncertainty: string;         // What the agent doesn't know
  recommendedAction: string;
  humanVerdict?: IncidentStatus;  // Set when Maya approves/overrides
  humanNote?: string;
}

export interface Investigation {
  id: string;
  startedAt: string;
  completedAt?: string;
  toolCallLog: ToolCallRecord[];
  incidentAnalyses: IncidentAnalysis[];
  correlations: string[];         // Narrative correlation strings found by agent
  overallSummary: string;
  morningBriefing?: MorningBriefing;
}

export interface MorningBriefing {
  generatedAt: string;
  headline: string;
  whatHappened: string;
  whatIsHarmless: string[];
  whatNeedsEscalation: string[];
  droneFindings: string;
  pendingFollowUps: string[];
  handoffNote: string;           // For Nisha
}

// ─── SEEDED OVERNIGHT SIGNALS ───────────────────────────────
export const overnightSignals: RidgewaySignal[] = [
  {
    id: 'SIG-001',
    type: 'fence_alert',
    timestamp: '01:47 AM',
    location: [12.9728, 77.5931],
    zone: 'Gate 3 — North Perimeter',
    description: 'Vibration anomaly on perimeter fence sensor F-03. Duration: 8 seconds. Pattern: intermittent.',
    severity: 'high',
    status: 'unreviewed',
    relatedSignals: ['SIG-003'],
  },
  {
    id: 'SIG-002',
    type: 'vehicle_path',
    timestamp: '02:12 AM',
    location: [12.9702, 77.5958],
    zone: 'Block C — Restricted Storage Yard',
    description: 'Unregistered vehicle (no transponder) tracked moving slowly along the east boundary of Block C storage yard. Loitered for ~14 minutes.',
    severity: 'critical',
    status: 'unreviewed',
    relatedSignals: ['SIG-001', 'SIG-003', 'SIG-004'],
  },
  {
    id: 'SIG-003',
    type: 'badge_failure',
    timestamp: '02:31 AM',
    location: [12.9711, 77.5963],
    zone: 'Access Point Delta — Block C Entry',
    description: '3 failed badge swipes in 4 minutes. Badge IDs: #7741, #7741 (retry), #0029. Both IDs are registered to day-shift maintenance.',
    severity: 'critical',
    status: 'unreviewed',
    relatedSignals: ['SIG-002'],
  },
  {
    id: 'SIG-004',
    type: 'drone_patrol',
    timestamp: '03:05 AM',
    location: [12.9708, 77.5951],
    zone: 'Block C — Overfly (Scheduled Patrol)',
    description: 'Drone V-12 completed scheduled patrol sweep over Block C. Thermal imaging active. Patrol log available.',
    severity: 'low',
    status: 'unreviewed',
    relatedSignals: ['SIG-002'],
  },
  {
    id: 'SIG-005',
    type: 'fence_alert',
    timestamp: '04:18 AM',
    location: [12.9735, 77.5975],
    zone: 'Zone F — East Boundary',
    description: 'Single vibration spike on fence sensor F-09. Duration: 1.2 seconds. No follow-up motion detected.',
    severity: 'low',
    status: 'unreviewed',
  },
];

// ─── DRONE PATROL ROUTE ─────────────────────────────────────
export const dronePatrolRoute: DronePatrolRoute = {
  droneId: 'V-12',
  startTime: '02:55 AM',
  endTime: '03:22 AM',
  waypoints: [
    { coord: [12.9720, 77.5946], time: '02:55 AM', note: 'Patrol initiated — Drone Bay Alpha' },
    { coord: [12.9725, 77.5938], time: '02:58 AM', note: 'North sweep — Gate 3 vicinity' },
    { coord: [12.9715, 77.5945], time: '03:01 AM', note: 'Descending over Block C north end' },
    { coord: [12.9708, 77.5951], time: '03:05 AM', note: 'Thermal pass — Block C storage yard' },
    { coord: [12.9703, 77.5958], time: '03:09 AM', note: 'Vehicle last-known position' },
    { coord: [12.9711, 77.5963], time: '03:13 AM', note: 'Access Point Delta overfly' },
    { coord: [12.9720, 77.5946], time: '03:22 AM', note: 'Returning to base' },
  ],
};

// ─── MCP-STYLE TOOL DEFINITIONS ─────────────────────────────
// These are the tool schemas exposed to the LLM agent
export const agentTools = [
  {
    type: 'function' as const,
    function: {
      name: 'query_badge_logs',
      description: 'Query the site access control system for badge swipe logs. Returns recent activity for specified badge IDs or access points.',
      parameters: {
        type: 'object',
        properties: {
          badge_ids: {
            type: 'string',
            description: 'Comma-separated badge IDs to query, e.g. "7741,0029"',
          },
          access_point: {
            type: 'string',
            description: 'Access point name, e.g. "Access Point Delta"',
          },
          time_window: {
            type: 'string',
            description: 'Time window to search, e.g. "02:00-03:00 AM"',
          },
        },
        required: ['access_point'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_drone_footage_metadata',
      description: 'Retrieve metadata and findings from a drone patrol pass over a zone. Returns thermal imaging summary, anomalies detected, and coverage timestamps.',
      parameters: {
        type: 'object',
        properties: {
          drone_id: {
            type: 'string',
            description: 'Drone identifier, e.g. "V-12"',
          },
          zone: {
            type: 'string',
            description: 'Zone the drone patrolled, e.g. "Block C"',
          },
          time_range: {
            type: 'string',
            description: 'Time range to check, e.g. "03:00-03:30 AM"',
          },
        },
        required: ['zone'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_maintenance_schedule',
      description: 'Check the site maintenance schedule for a zone or time period to determine if any work orders or contractors were authorized.',
      parameters: {
        type: 'object',
        properties: {
          zone: {
            type: 'string',
            description: 'Zone to check, e.g. "Block C"',
          },
          shift: {
            type: 'string',
            description: 'Shift identifier, e.g. "Night Shift (00:00-06:00)"',
          },
        },
        required: ['zone'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_vehicle_registry',
      description: 'Query the site vehicle registry and transponder database. Returns if a vehicle was authorized, its owner, and any scheduled access.',
      parameters: {
        type: 'object',
        properties: {
          zone: {
            type: 'string',
            description: 'Zone where vehicle was spotted, e.g. "Block C"',
          },
          time_window: {
            type: 'string',
            description: 'Time window of the sighting, e.g. "02:00-02:30 AM"',
          },
        },
        required: ['zone', 'time_window'],
      },
    },
  },
];

// ─── SIMULATED TOOL RESPONSES ────────────────────────────────
// The server uses these to simulate real tool execution
export function executeToolCall(name: string, args: Record<string, string>): string {
  switch (name) {
    case 'query_badge_logs':
      return JSON.stringify({
        access_point: args.access_point || 'Access Point Delta',
        events: [
          { time: '02:31 AM', badge: '#7741', result: 'DENIED', reason: 'Badge deactivated — holder transferred to Day Gate 1 on 2026-04-14' },
          { time: '02:32 AM', badge: '#7741', result: 'DENIED', reason: 'Same card, second attempt' },
          { time: '02:33 AM', badge: '#0029', result: 'DENIED', reason: 'Badge valid but zone access not provisioned for night shift' },
        ],
        note: 'Badge #7741 belongs to Rajan M. (Maintenance Tech). Badge #0029 belongs to Priya K. (Electrician). Neither had night access authorization.',
        last_authorized_entry: '08:44 PM prior evening — different personnel',
      });

    case 'check_drone_footage_metadata':
      return JSON.stringify({
        drone_id: 'V-12',
        zone: args.zone || 'Block C',
        patrol_time: '03:05–03:13 AM',
        thermal_summary: 'One stationary heat signature detected near eastern Block C boundary at 03:07 AM. Signature consistent with parked vehicle (engine warm). No human heat signatures detected at time of pass.',
        anomalies: ['Warm vehicle signature at gate B-east junction', 'Gate B-east access door appears ajar — not flagged in maintenance logs'],
        coverage: 'Full Block C perimeter covered. Gap at 03:09–03:11 AM due to wind drift requiring course correction.',
        confidence: 'Medium — 8-minute window gap near access point limits certainty.',
      });

    case 'check_maintenance_schedule':
      return JSON.stringify({
        zone: args.zone || 'Block C',
        shift: 'Night Shift (00:00–06:00)',
        active_work_orders: [],
        authorized_contractors: 'None',
        next_scheduled_maintenance: '2026-04-17 07:00 AM — Routine electrical inspection',
        note: 'No maintenance, contractor, or internal work orders were active in Block C during night shift. Any vehicle or personnel access would be unauthorized.',
      });

    case 'query_vehicle_registry':
      return JSON.stringify({
        zone: args.zone || 'Block C',
        time_window: args.time_window || '02:00–02:30 AM',
        registered_vehicles_authorized: 0,
        transponder_matches: 'None',
        cctv_note: 'Camera C-04 (Block C east) was offline from 01:52–02:45 AM. Cause: scheduled firmware update that ran 43 minutes over window.',
        known_vehicles_on_site: ['EV-Patrol-01 (Security)', 'DR-Van-07 (Pantry, parked since 10 PM)'],
        finding: 'Vehicle with no transponder matches no authorized entry. Camera gap coincides with vehicle loiter window — no visual record available.',
      });

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
