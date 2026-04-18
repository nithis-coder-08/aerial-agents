// ============================================================
// API Route: /api/drone
// Simulates launching a follow-up drone mission to a coordinate
// ============================================================

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const { zone, coord } = await request.json() as { zone: string; coord: [number, number] };

  // Simulate a short processing delay then stream back status updates
  // We return a series of status events as JSON
  const missionStart = new Date().toLocaleTimeString('en-US', { hour12: true });

  const updates = [
    { status: 'LAUNCHING', message: `Drone V-09 powering up. Mission target: ${zone}`, time: missionStart, coord: null },
    { status: 'AIRBORNE', message: 'V-09 airborne. Navigation lock acquired.', time: missionStart, coord: null },
    { status: 'EN_ROUTE', message: `En route to ${zone}. ETA ~90 seconds.`, time: missionStart, coord: coord },
    { status: 'ON_STATION', message: `Arrived at ${zone}. Initiating thermal sweep.`, time: missionStart, coord: coord },
    {
      status: 'FINDINGS',
      message: coord[0] > 12.969 && coord[0] < 12.972
        ? 'Thermal scan complete. No active heat signatures detected. Vehicle previously observed is GONE. Gate B-east door now CLOSED. Area appears clear.'
        : 'Thermal scan complete. No anomalies detected in current sweep area. Perimeter appears secure.',
      time: missionStart,
      coord: coord,
    },
    { status: 'RETURNING', message: 'V-09 returning to Drone Bay Alpha.', time: missionStart, coord: null },
    { status: 'LANDED', message: 'V-09 landed. Mission complete. Log archived.', time: missionStart, coord: null },
  ];

  return Response.json({ updates });
}
