# Smart Job Application Agent

AI-powered resume tailoring using **Google ADK** (3-agent pipeline) + **Next.js + TypeScript** frontend.

## How It Works

```
User Input (JD + Resume)
        │
        ▼
  ┌─────────────────┐
  │  Agent 1        │  Reads job description → extracts structured requirements
  │  JD Analyzer    │
  └────────┬────────┘
           │ requirements (not full JD)
           ▼
  ┌─────────────────┐
  │  Agent 2        │  Compares requirements vs resume → gap analysis + match score
  │  Resume Matcher │
  └────────┬────────┘
           │ gap analysis only (not full resume again)
           ▼
  ┌─────────────────┐
  │  Agent 3        │  Writes tailored bullet points + cover letter opener
  │  Resume Writer  │
  └─────────────────┘
```

Each agent only receives the previous agent's output — not the full original text.
This keeps each Gemini call small and well within the free tier limits.

---

## Setup

### 1. Get a free Gemini API key

Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) and create a key.

---

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Open .env and paste your GOOGLE_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
Health check: `http://localhost:8000/health`

---

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Project Structure

```
smart-job-agent/
├── backend/
│   ├── main.py          ← FastAPI app + all 3 ADK agents (one file, ~100 lines)
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx     ← Main UI with inputs and results
    │   ├── layout.tsx   ← Fonts and metadata
    │   └── globals.css  ← All styles
    ├── components/
    │   └── ResultCard.tsx ← Reusable result display
    └── package.json
```

---

## How to Explain This in an Interview

**"What did you build?"**
> A multi-agent pipeline that takes a job description and resume, then runs three specialized AI agents in sequence — one analyzes the JD requirements, one scores the resume against those requirements, and one rewrites the resume bullets and cover letter to close the gaps.

**"Why three agents instead of one prompt?"**
> Each agent has a single focused job. Agent 1 doesn't know it'll be used for gap analysis — it just extracts requirements cleanly. This separation makes each output more precise and the system easier to debug or improve independently.

**"How did you handle token limits on the free tier?"**
> Each agent only receives the *previous agent's output*, not the original full text. So Agent 2 sees a clean requirements list (~300 tokens), not the full JD (~800 tokens). Total per run is around 4,000 tokens — Gemini Flash free tier allows 1 million tokens per minute.

**"What tech stack?"**
> Python + Google ADK for the agent pipeline, FastAPI to expose it as an API, and Next.js + TypeScript for the frontend.

---

## API Reference

### POST /analyze

Request:
```json
{
  "job_description": "We are looking for a senior engineer...",
  "resume": "John Doe — 3 years experience in..."
}
```

Response:
```json
{
  "requirements": "REQUIRED SKILLS:\n- TypeScript\n...",
  "gap_analysis":  "STRENGTHS:\n- Has React...\nGAPS:\n- Missing Kubernetes...\nMATCH SCORE: 7/10",
  "tailored_output": "TAILORED BULLET POINTS:\n- Built...\n\nCOVER LETTER OPENER:\n..."
}
```

---

## Free Tier Limits (Gemini 1.5 Flash)

| Limit | Value | Your usage per run |
|-------|-------|--------------------|
| Requests / day | 1,500 | 3 requests |
| Tokens / minute | 1,000,000 | ~4,000 tokens |
| Requests / minute | 15 | 3 requests |

You can do ~500 full runs per day on the free tier.
