"use client";

import { useState } from "react";
import ResultCard from "@/components/ResultCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  requirements: string;
  gap_analysis: string;
  tailored_output: string;
}

type Step = "idle" | "analyzing_jd" | "matching_resume" | "writing" | "done";

// ─── Step Progress Bar ────────────────────────────────────────────────────────

const STEPS = [
  { key: "analyzing_jd",     label: "Analyzing JD" },
  { key: "matching_resume",  label: "Matching Resume" },
  { key: "writing",          label: "Writing Output" },
  { key: "done",             label: "Complete" },
];

function StepBar({ current }: { current: Step }) {
  const order: Step[] = ["idle", "analyzing_jd", "matching_resume", "writing", "done"];
  const currentIdx = order.indexOf(current);

  return (
    <div className="steps">
      {STEPS.map((s, i) => {
        const stepIdx = i + 1; // 1-indexed vs order array
        const isActive = current === s.key;
        const isDone   = currentIdx > stepIdx;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="step-item">
              <div className={`step-dot ${isActive ? "active" : isDone ? "done" : ""}`} />
              <span className={`step-label ${isActive ? "active" : isDone ? "done" : ""}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="step-sep" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="results">
      {[80, 55, 70].map((pct, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line" style={{ width: "30%", marginBottom: 16 }} />
          <div className="skeleton-line" style={{ width: `${pct}%` }} />
          <div className="skeleton-line" style={{ width: "90%" }} />
          <div className="skeleton-line" style={{ width: `${pct - 10}%` }} />
          <div className="skeleton-line" style={{ width: "75%" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [jd,      setJd]      = useState("");
  const [resume,  setResume]  = useState("");
  const [result,  setResult]  = useState<AnalysisResult | null>(null);
  const [step,    setStep]    = useState<Step>("idle");
  const [error,   setError]   = useState("");

  const isLoading = step !== "idle" && step !== "done";

  async function handleAnalyze() {
    if (!jd.trim() || !resume.trim()) {
      setError("Please paste both a job description and your resume.");
      return;
    }

    setError("");
    setResult(null);
    setStep("analyzing_jd");

    try {
      // Simulate step progression so the UI feels responsive
      // The real steps happen server-side, but we can estimate timing
      const stepTimer = setTimeout(() => setStep("matching_resume"), 3500);
      const stepTimer2 = setTimeout(() => setStep("writing"), 7000);

      const res = await fetch("https://smart-job-application-agent.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, resume }),
      });

      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      setStep("done");
      setResult(data);
    } catch (e: unknown) {
      setStep("idle");
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Make sure the backend is running on port 8000."
      );
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <p className="header-eyebrow">Google ADK · 3-Agent Pipeline</p>
        <h1>Smart Job<br />Application Agent</h1>
        <p>Paste a job description and your resume — three AI agents analyze, match, and rewrite your application.</p>
      </header>

      {/* Inputs */}
      <div className="inputs-grid">
        <div className="field">
          <label><span />Job Description</label>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here..."
            disabled={isLoading}
          />
        </div>
        <div className="field">
          <label><span style={{ background: "var(--accent2)" }} />Your Resume</label>
          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            placeholder="Paste your current resume text here..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Button */}
      <div className="btn-row">
        <button className="btn" onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
                  strokeDasharray="20" strokeDashoffset="8" strokeLinecap="round"/>
              </svg>
              Analyzing...
            </>
          ) : "Analyze My Application →"}
        </button>
      </div>

      {/* Step progress */}
      {(isLoading || step === "done") && <StepBar current={step} />}

      {/* Error */}
      {error && <div className="error-box">⚠ {error}</div>}

      {/* Loading skeleton */}
      {isLoading && <SkeletonCards />}

      {/* Results */}
      {result && (
        <div className="results">
          <ResultCard
            step={1}
            title="JD Requirements"
            icon="📋"
            iconTheme="green"
            content={result.requirements}
          />
          <ResultCard
            step={2}
            title="Resume Gap Analysis"
            icon="🔍"
            iconTheme="indigo"
            content={result.gap_analysis}
          />
          <ResultCard
            step={3}
            title="Tailored Bullets & Cover Letter"
            icon="✍️"
            iconTheme="amber"
            content={result.tailored_output}
          />
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
