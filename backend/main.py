import os
import uuid
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

load_dotenv()

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="Smart Job Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://smart-job-application-agent.vercel.app","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

APP_NAME = "smart_job_agent"
session_service = InMemorySessionService()

# ─── Agent 1: JD Analyzer ─────────────────────────────────────────────────────
# Takes raw job description → outputs clean structured requirements list

jd_analyzer = LlmAgent(
    name="jd_analyzer",
    model="gemini-2.5-flash",
    instruction="""You are a job description analyst.
Given a job description, extract and return:
1. REQUIRED SKILLS: List the must-have technical skills
2. PREFERRED SKILLS: Nice-to-have skills
3. KEY RESPONSIBILITIES: Top 4-5 bullet points
4. EXPERIENCE: Years and type of experience required

Be concise. Use plain text with clear section headers. No markdown formatting.""",
)

# ─── Agent 2: Resume Matcher ──────────────────────────────────────────────────
# Takes requirements + resume → outputs honest gap analysis with match score

resume_matcher = LlmAgent(
    name="resume_matcher",
    model="gemini-2.5-flash",
    instruction="""You are a resume analyst.
Given job requirements and a candidate's resume, produce:
1. STRENGTHS: Skills and experience the candidate clearly has (with evidence from resume)
2. GAPS: Requirements the resume doesn't address or is weak on
3. MATCH SCORE: X/10 with one-line justification

Be specific and honest. Pull real examples from the resume. Plain text output.""",
)

# ─── Agent 3: Resume Writer ───────────────────────────────────────────────────
# Takes gap analysis → outputs tailored resume bullets + cover letter opener

writer = LlmAgent(
    name="writer",
    model="gemini-2.5-flash",
    instruction="""You are a professional resume writer.
Given a gap analysis between a job and a resume, produce:

TAILORED BULLET POINTS:
Write 4 improved resume bullet points that highlight relevant strengths and
address gaps where possible. Use action verbs + quantifiable results format.
Example: "Built X using Y, resulting in Z"

COVER LETTER OPENER:
Write a 3-sentence opening paragraph for a cover letter.
It should: hook the reader, mention the role, and highlight the strongest fit.

Plain text output. Label both sections clearly.""",
)


# ─── Helper: Run a single agent ───────────────────────────────────────────────

async def run_agent(agent: LlmAgent, message: str) -> str:
    """Creates a fresh session, runs the agent, returns the text response."""
    session_id = str(uuid.uuid4())

    await session_service.create_session(
        app_name=APP_NAME,
        user_id="user",
        session_id=session_id,
    )

    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    content = types.Content(role="user", parts=[types.Part(text=message)])
    result = ""

    async for event in runner.run_async(
        user_id="user",
        session_id=session_id,
        new_message=content,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    result += part.text

    return result.strip()


# ─── Request / Response Models ────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    job_description: str
    resume: str


class AnalyzeResponse(BaseModel):
    requirements: str    # Agent 1 output
    gap_analysis: str    # Agent 2 output
    tailored_output: str # Agent 3 output


# ─── Main Endpoint ────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest):
    if not body.job_description.strip() or not body.resume.strip():
        raise HTTPException(status_code=400, detail="Both job description and resume are required.")

    # Step 1 — Analyze the JD
    requirements = await run_agent(
        jd_analyzer,
        f"Analyze this job description:\n\n{body.job_description}",
    )

    # Step 2 — Match resume against requirements only (not full JD again → saves tokens)
    gap_analysis = await run_agent(
        resume_matcher,
        f"Job requirements:\n{requirements}\n\nCandidate resume:\n{body.resume}",
    )

    # Step 3 — Write tailored output based on gaps only (not the full resume again → saves tokens)
    tailored_output = await run_agent(
        writer,
        f"Gap analysis result:\n{gap_analysis}\n\nWrite tailored resume bullets and cover letter opener.",
    )
                         
    return AnalyzeResponse(
        requirements=requirements,
        gap_analysis=gap_analysis,
        tailored_output=tailored_output,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
