// ============================================================
// API Route: /api/briefing
// Generates a morning briefing from Maya's reviewed investigation
// ============================================================

import OpenAI from 'openai';
import { Investigation, MorningBriefing } from '@/data/mockSignals';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(request: Request): Promise<Response> {
  const investigation: Investigation = await request.json();

  const reviewedAnalyses = investigation.incidentAnalyses
    .map(a => {
      const verdictToUse = a.humanVerdict || a.agentVerdict;
      return `Signal ${a.signalId}: AI verdict=${a.agentVerdict} (${a.confidencePercent}%), Human override=${a.humanVerdict || 'none'}, Note="${a.humanNote || ''}"
Reasoning: ${a.reasoning}
Action: ${a.recommendedAction}`;
    })
    .join('\n\n');

  const prompt = `You are writing a morning briefing for Nisha, the Ridgeway Site head, who walks in at 8:00 AM.
Maya (operations lead) has reviewed the overnight investigation. Here are the reviewed findings:

${reviewedAnalyses}

Correlations found: ${investigation.correlations.join('; ')}

Write a concise, professional morning briefing in this exact JSON format:
{
  "headline": "One-sentence summary of the night",
  "whatHappened": "2-3 sentence narrative of the night",
  "whatIsHarmless": ["item1", "item2"],
  "whatNeedsEscalation": ["item1"],
  "droneFindings": "What the drone patrol found",
  "pendingFollowUps": ["item1", "item2"],
  "handoffNote": "Direct message to Nisha in one paragraph"
}

Be direct, specific, and honest about uncertainty. Do not pad with generic text.`;

  const response = await client.chat.completions.create({
    model: 'meta/llama-3.3-70b-instruct',
    messages: [
      { role: 'system', content: 'You produce structured JSON briefings for industrial site operations managers. Be concise and factual.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const content = response.choices[0].message.content ?? '';
  let briefing: MorningBriefing;

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
    const parsed = JSON.parse(jsonMatch?.[1] ?? content);
    briefing = {
      generatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      ...parsed,
    };
  } catch {
    briefing = {
      generatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      headline: 'Overnight investigation complete — multiple anomalies in Block C.',
      whatHappened: content.slice(0, 300),
      whatIsHarmless: [],
      whatNeedsEscalation: ['Block C vehicle and badge incidents'],
      droneFindings: 'See tool logs for drone V-12 metadata.',
      pendingFollowUps: ['Review camera C-04 failure log', 'Follow up with badge holders #7741 and #0029'],
      handoffNote: 'Please review the full investigation report before the morning meeting.',
    };
  }

  return Response.json(briefing);
}
