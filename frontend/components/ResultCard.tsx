// components/ResultCard.tsx
// Parses markdown-like output from agents and renders it cleanly

import React from "react";

type Props = {
  step: number;
  title: string;
  icon: string;
  iconTheme: "green" | "indigo" | "amber";
  content: string;
};

// ─── Markdown Parser ──────────────────────────────────────────────────────────
// Converts agent output (plain text with **bold** and * bullets) into
// structured React elements. No external library needed.

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function parseContent(raw: string) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let keyCounter = 0;
  const k = () => keyCounter++;

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={k()} className="parsed-list">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="parsed-li">
            <span className="bullet-dot" />
            <span>{parseBold(item)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  for (const line of lines) {
    // Section heading: e.g. "STRENGTHS:" or "**GAPS:**"
    const isHeading =
      /^[A-Z][A-Z\s\/]+:$/.test(line) ||
      /^\*\*[A-Z][A-Z\s\/]+:\*\*$/.test(line);

    // Bullet line: starts with * or -
    const isBullet = /^[*\-]\s+/.test(line);

    if (isHeading) {
      flushBullets();
      const label = line.replace(/\*\*/g, "").replace(/:$/, "");
      elements.push(<p key={k()} className="parsed-heading">{label}</p>);
    } else if (isBullet) {
      // Strip bullet marker, then strip **Label:** prefix → "Label: ..."
      const text = line
        .replace(/^[*\-]\s+/, "")
        .replace(/^\*\*(.*?)\*\*:\s*/, (_, label) => `${label}: `);
      bulletBuffer.push(text);
    } else {
      flushBullets();
      elements.push(<p key={k()} className="parsed-body">{parseBold(line)}</p>);
    }
  }

  flushBullets();
  return elements;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultCard({ step, title, icon, iconTheme, content }: Props) {
  return (
    <div className="result-card">
      <div className="card-header">
        <div className={`card-icon ${iconTheme}`}>{icon}</div>
        <span className="card-title">{title}</span>
        <span className="card-step">Agent {step}</span>
      </div>
      <div className="card-body parsed">
        {parseContent(content)}
      </div>
    </div>
  );
}