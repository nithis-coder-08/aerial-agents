// ============================================================
// API Route: /api/investigate
// Real AI Agent with MCP-style tool-calling loop
// Uses NVIDIA NIM (OpenAI-compatible) — meta/llama-3.3-70b-instruct
// ============================================================

import OpenAI from 'openai';
import { overnightSignals, agentTools, executeToolCall, ToolCallRecord, IncidentAnalysis, Investigation } from '@/data/mockSignals';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const SYSTEM_PROMPT = `You are the 6:10 Assistant — an AI investigation agent for Ridgeway Site, a large industrial facility.

It is 6:10 AM. Maya, the operations lead, needs to understand what happened overnight before the 8:00 AM leadership review with site head Nisha. 
Night supervisor Raghav left a note: "Please check Block C before leadership asks."

Your job is to investigate the overnight security signals by using your available tools to gather real context. 
Do not guess — use tools to check badge logs, drone footage, maintenance schedules, and vehicle records.

For each signal, form an analysis with:
- A clear verdict (harmless / suspicious / critical / unknown)
- A confidence percentage (0-100)
- Your reasoning (what evidence led to this conclusion)
- Honest uncertainty (what you still don't know or couldn't verify)
- A recommended action for Maya

Also identify correlations between signals — what connects them spatially or temporally.

After analyzing all signals, provide a structured JSON response with this exact shape:
{
  "incidentAnalyses": [
    {
      "signalId": "SIG-001",
      "agentVerdict": "suspicious",
      "confidencePercent": 72,
      "reasoning": "...",
      "uncertainty": "...",
      "recommendedAction": "..."
    }
  ],
  "correlations": [
    "SIG-001 (fence alert at 01:47 AM near Gate 3) and SIG-002 (vehicle in Block C at 02:12 AM) may be related — 25-minute gap suggests the vehicle entered through or near Gate 3."
  ],
  "overallSummary": "..."
}`;

function buildSignalContext(): string {
  return overnightSignals.map(s =>
    `[${s.id}] ${s.timestamp} | ${s.zone} | ${s.type.toUpperCase()}
Description: ${s.description}
Severity: ${s.severity}`
  ).join('\n\n');
}

export async function POST(): Promise<Response> {
  const toolCallLog: ToolCallRecord[] = [];
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Here are the overnight signals from Ridgeway Site that need investigation:\n\n${buildSignalContext()}\n\nPlease investigate using your tools, then provide your structured analysis.`,
    },
  ];

  // ── Agentic Loop ─────────────────────────────────────────
  let finalContent = '';
  const MAX_ITERATIONS = 8;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await client.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages,
      tools: agentTools,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 4096,
    });

    const choice = response.choices[0];
    const msg = choice.message;

    // Append assistant message to conversation
    messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls });

    if (choice.finish_reason === 'stop' || !msg.tool_calls || msg.tool_calls.length === 0) {
      finalContent = msg.content ?? '';
      break;
    }

    // ── Execute each tool call ────────────────────────────
    for (const tc of msg.tool_calls) {
      const startMs = Date.now();
      // Cast to standard tool call type (NVIDIA NIM is OpenAI-compatible)
      const stdTc = tc as { id: string; function: { name: string; arguments: string } };
      const args = JSON.parse(stdTc.function.arguments) as Record<string, string>;
      const toolResult = executeToolCall(stdTc.function.name, args);

      toolCallLog.push({
        toolName: stdTc.function.name,
        input: args,
        output: toolResult,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
        durationMs: Date.now() - startMs,
      });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolResult,
      });
    }
  }

  // ── Parse structured JSON from agent response ─────────
  let parsed: { incidentAnalyses: IncidentAnalysis[]; correlations: string[]; overallSummary: string } | null = null;

  try {
    // Extract JSON block if wrapped in markdown
    const jsonMatch = finalContent.match(/```json\s*([\s\S]*?)```/) || finalContent.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    }
  } catch {
    // If parse fails, build a fallback
    parsed = {
      incidentAnalyses: overnightSignals.map(s => ({
        signalId: s.id,
        agentVerdict: s.severity === 'critical' ? 'critical' : s.severity === 'high' ? 'suspicious' : 'unknown',
        confidencePercent: 50,
        reasoning: 'Agent response parsing failed. Raw investigation data collected.',
        uncertainty: 'Full analysis unavailable due to response formatting issue.',
        recommendedAction: 'Manual review required.',
      })),
      correlations: [],
      overallSummary: finalContent.slice(0, 500) || 'Investigation completed. See raw tool logs.',
    };
  }

  const investigation: Investigation = {
    id: `INV-${Date.now()}`,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    toolCallLog,
    incidentAnalyses: parsed?.incidentAnalyses ?? [],
    correlations: parsed?.correlations ?? [],
    overallSummary: parsed?.overallSummary ?? '',
  };

  return Response.json(investigation);
}
