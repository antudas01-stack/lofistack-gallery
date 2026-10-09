"use client";

import { useState } from "react";
import { ConversationalForm, type ConversationalStep } from "@/components/gallery/conversational-form";
import { Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const STEPS: ConversationalStep[] = [
  { id: "name", label: "Name", question: "Hi! I'm Lofi. What should I call you?", placeholder: "Your name" },
  {
    id: "email",
    label: "Email",
    type: "email",
    question: (a) => `Nice to meet you, ${a.name}. What's the best email to reach you?`,
    placeholder: "you@studio.com",
  },
  {
    id: "role",
    label: "Role",
    type: "choice",
    question: "Which of these sounds most like you?",
    options: ["Designer", "Developer", "Founder", "Something else"],
  },
  {
    id: "budget",
    label: "Budget",
    type: "number",
    question: (a) =>
      a.role === "Founder" ? "What budget are you working with? (USD)" : "Roughly how many hours a week do you have?",
    placeholder: "e.g. 5000",
    validate: (v) => (Number(v) <= 0 ? "Please enter a number above 0." : null),
  },
  {
    id: "message",
    label: "Message",
    type: "textarea",
    required: false,
    question: "Anything else we should know? (optional)",
    placeholder: "Shift + Enter for a new line",
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ConversationalFormPlayground() {
  const [delay, setDelay] = useState(650);
  const [asyncSubmit, setAsyncSubmit] = useState(true);
  const [withAvatar, setWithAvatar] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <ConversationalForm
            key={runKey}
            title="Start a project"
            steps={STEPS}
            typingDelay={delay}
            avatar={withAvatar ? "L" : undefined}
            onComplete={(answers) => {
              setResult(JSON.stringify(answers));
              return asyncSubmit ? wait(1200) : undefined;
            }}
            doneMessage={(a) => `Thanks ${a.name}! A human will reply to ${a.email} within a day.`}
          />
          <p className="w-full truncate font-mono text-[11px] text-fg-muted" title={result ?? undefined}>
            {result ? `onComplete → ${result}` : "Answers are passed to onComplete when you send."}
          </p>
        </div>
      }
      controls={
        <>
          <Slider
            label="Typing delay"
            value={delay}
            min={0}
            max={1500}
            step={50}
            format={(v) => `${v}ms`}
            onChange={setDelay}
          />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Async submit (sending state)" checked={asyncSubmit} onChange={setAsyncSubmit} />
            <Toggle label="Bot avatar" checked={withAvatar} onChange={setWithAvatar} />
          </div>
          <button
            type="button"
            onClick={() => {
              setRunKey((k) => k + 1);
              setResult(null);
            }}
            className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm font-medium transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Reset conversation
          </button>
          <p className="text-xs leading-relaxed text-fg-muted">
            Try an invalid email, pick <span className="font-medium text-fg">Founder</span> to change the next question,
            or use <span className="font-medium text-fg">← Back</span>.
          </p>
        </>
      }
    />
  );
}

export function ConversationalFormStates() {
  const noop = () => {};
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <StateTile label="First question">
        <ConversationalForm title="Start a project" steps={STEPS} onComplete={noop} maxHeight={220} typingDelay={0} />
      </StateTile>
      <StateTile label="Choice step (mid-way)">
        <ConversationalForm
          title="Start a project"
          steps={STEPS}
          onComplete={noop}
          maxHeight={220}
          typingDelay={0}
          initialAnswers={{ name: "Antu", email: "antu@studio.co" }}
        />
      </StateTile>
      <StateTile label="Review before sending">
        <ConversationalForm
          title="Start a project"
          steps={STEPS}
          onComplete={noop}
          maxHeight={220}
          typingDelay={0}
          initialAnswers={{ name: "Antu", email: "antu@studio.co", role: "Founder", budget: "5000", message: "" }}
        />
      </StateTile>
    </div>
  );
}

export function ConversationalFormCard() {
  return (
    <div className="w-64 origin-center scale-[0.72]">
      <ConversationalForm
        title="Start a project"
        steps={STEPS}
        onComplete={() => {}}
        maxHeight={150}
        typingDelay={0}
        initialAnswers={{ name: "Antu" }}
      />
    </div>
  );
}
