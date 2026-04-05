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

### UI

<img width="1212" height="817" alt="image" src="https://github.com/user-attachments/assets/e5802087-d632-4923-a0be-89daeba60336" />

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
