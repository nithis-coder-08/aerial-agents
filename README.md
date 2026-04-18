# 6:10 Assistant — Ridgeway Site Intelligence Platform

> **"Most mornings begin with one uncomfortable truth: the site knows something happened, but nobody knows the full story yet."**

The **6:10 Assistant** is an AI-first intelligence platform built for industrial site operations. Operations Leads (like our persona, Maya) use this tool to synthesize overnight security signals, review AI-generated investigations, make human-in-the-loop decisions, and auto-generate comprehensive morning briefings for site leadership.

## 🌟 Key Features

1. **AI-Native Investigation Engine**
   - Powered by **NVIDIA NIM** (Meta Llama 3.3 70B Instruct).
   - Real Agentic Loop: The AI doesn't just guess; it actively uses an MCP-style tool registry to fetch real context (badge logs, drone metadata, etc.).
   - Explicit Uncertainty: The AI is designed to be honest about what it *doesn't* know, rather than making confident guesses.

2. **Human-in-the-Loop Review Flow**
   - The AI drafts an investigation, but **the human operator is always in control**.
   - Review cards show the AI's reasoning alongside its confidence percentages.
   - Operators can flag incidents as `HARMLESS`, `ESCALATE`, or flag for `FOLLOW UP` and attach their own notes.

3. **Interactive Tactical Map**
   - A fully functional 2D spatial grid (built with `react-leaflet`) customized with a deep dark tactical green aesthetic.
   - Live rendering of signals, drone patrol lines, and simulated mission dispatch capabilities.

4. **Automated Briefing Generation**
   - Once the operator has reviewed the incidents, the system condenses the final verdicts into a concise, non-fluff Morning Briefing ready for leadership at 8:00 AM.

---

## ⚙️ Technical Architecture & Flow

### 1. Data Layer (`mockSignals.ts`)
The application is pre-seeded with a comprehensive overnight narrative surrounding **Block C** at the fictitious **Ridgeway Site**, including:
- A fence alert at Gate 3.
- An unregistered vehicle path anomaly.
- 3 unexpected badge failures.
- Scheduled drone thermal patrol metadata.

### 2. The Investigation Phase
When the user clicks "Begin Investigation", the app hits `POST /api/investigate`.
1. **Context Window:** The agent is given Ridgeway Site's context and the list of signals.
2. **Tool Iterations:** The Llama model loops (up to 8 times), querying tools iteratively:
   - `query_badge_logs`
   - `check_drone_footage_metadata`
   - `check_maintenance_schedule`
   - `query_vehicle_registry`
3. **Synthesis:** The agent synthesizes the tool outputs into structured JSON (verdicts, reasoning, uncertainty, and cross-incident correlations).

### 3. The Live UI (Operations Room)
- **Agent Panel:** Streams the tool calls as they happen, showing inputs, outputs, and execution duration.
- **Review Panel:** Allows the operator (Maya) to read the synthesized report and click through the map to investigate spatially.
- **Drone Dispatch:** Users can dispatch a simulated follow-up drone mission (V-09) to any coordinates. This triggers a sequential streaming status update on the map.

### 4. Briefing Phase
Clicking "Briefing" calls `POST /api/briefing`.
- The AI takes the **human-reviewed verdicts** (not just its own initials guesses) and formats them into a tight, actionable summary: Headings, Escalations, Cleared items, and a hand-off note.

---

## 🛠️ Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS (v4) with custom tactical themes
- **AI Integration:** `openai` SDK pointing to NVIDIA NIM
- **Mapping:** `leaflet` & `react-leaflet`
- **Animations & Icons:** `framer-motion` & `lucide-react`

---

## 🚀 Getting Started

### 1. Requirements
- Node.js >= 18.x
- An NVIDIA API Key for NIM Inference

### 2. Installation
```bash
git clone https://github.com/nithis-coder-08/aerial-agents.git
cd aerial-agents
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
NVIDIA_API_KEY="your_nvidia_api_key_here"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience the Operations Room.

---

## 📸 Overview
*Designed for Ridgeway Site, where nothing is ever truly quiet, but by 8:00 AM, everything must be understood.*
