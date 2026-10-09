"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

export type Answers = Record<string, string>;

export interface ConversationalStep {
  id: string;
  /** Short name used in the review summary. Defaults to id. */
  label?: string;
  /** The question. A function can personalise it with earlier answers. */
  question: string | ((answers: Answers) => string);
  type?: "text" | "email" | "number" | "textarea" | "choice";
  /** Options for type="choice". */
  options?: string[];
  placeholder?: string;
  /** Defaults to true. Optional steps show a Skip button. */
  required?: boolean;
  /** Return an error message to block the answer, or null to accept it. */
  validate?: (value: string, answers: Answers) => string | null;
}

export interface ConversationalFormProps {
  steps: ConversationalStep[];
  /** Called with every answer. Return a promise to show a sending state. */
  onComplete: (answers: Answers) => void | Promise<unknown>;
  title?: string;
  /** Bot avatar, e.g. a logo or emoji. */
  avatar?: ReactNode;
  /** Message after a successful submit. */
  doneMessage?: string | ((answers: Answers) => string);
  /** "Typing…" pause before each question, in ms. */
  typingDelay?: number;
  /** Pre-filled answers; the conversation resumes at the first unanswered step. */
  initialAnswers?: Answers;
  /** Max height of the message log in px. */
  maxHeight?: number;
  className?: string;
}

type Status = "asking" | "review" | "sending" | "done";

const KEYFRAMES = `
@keyframes ls-chat-in { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes ls-chat-dot { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.ls-chat-msg { animation: ls-chat-in 260ms cubic-bezier(.2,.8,.2,1) both; }
.ls-chat-dot { animation: ls-chat-dot 1.1s infinite ease-in-out; }
@media (prefers-reduced-motion: reduce) { .ls-chat-msg, .ls-chat-dot { animation: none; } }`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const ask = (step: ConversationalStep, answers: Answers) =>
  typeof step.question === "function" ? step.question(answers) : step.question;

function firstOpen(steps: ConversationalStep[], answers: Answers, from = 0) {
  const i = steps.findIndex((s, idx) => idx >= from && answers[s.id] === undefined);
  return i === -1 ? steps.length : i;
}

function check(step: ConversationalStep, value: string, answers: Answers) {
  const v = value.trim();
  if (!v) return step.required === false ? null : "Please answer to continue.";
  if (step.type === "email" && !EMAIL.test(v)) return "That doesn't look like an email address.";
  if (step.type === "number" && Number.isNaN(Number(v))) return "Please enter a number.";
  return step.validate?.(v, answers) ?? null;
}

function Bubble({ from, children, avatar }: { from: "bot" | "user"; children: ReactNode; avatar?: ReactNode }) {
  if (from === "user") {
    return (
      <div className="ls-chat-msg flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-600 px-3.5 py-2 text-sm break-words whitespace-pre-wrap text-white">
          {children}
        </p>
      </div>
    );
  }
  return (
    <div className="ls-chat-msg flex items-end gap-2">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200 [&_svg]:size-4"
      >
        {avatar ?? "✦"}
      </span>
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
        {children}
      </div>
    </div>
  );
}

export function ConversationalForm({
  steps,
  onComplete,
  title = "Let's get started",
  avatar,
  doneMessage = "Thanks! We'll be in touch soon.",
  typingDelay = 650,
  initialAnswers = {},
  maxHeight = 360,
  className,
}: ConversationalFormProps) {
  const uid = useId();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [index, setIndex] = useState(() => firstOpen(steps, initialAnswers));
  const [status, setStatus] = useState<Status>(() =>
    firstOpen(steps, initialAnswers) >= steps.length ? "review" : "asking",
  );
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState(() => {
    const step = steps[firstOpen(steps, initialAnswers)];
    return step ? (initialAnswers[step.id] ?? "") : "";
  });
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLElement | null>(null);
  const interacted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[index];
  const answeredCount = steps.filter((s) => answers[s.id] !== undefined).length;
  const progress = status === "done" ? 1 : answeredCount / Math.max(1, steps.length);
  const questionId = `${uid}-q`;

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [index, typing, status, answers]);

  useEffect(() => {
    if (interacted.current && !typing && status === "asking") inputRef.current?.focus();
  }, [index, typing, status]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const goTo = (next: number, nextAnswers: Answers) => {
    const target = steps[next];
    setDraft(target ? (nextAnswers[target.id] ?? "") : "");
    setError(null);
    const finish = () => {
      setTyping(false);
      setIndex(next);
      setStatus(next >= steps.length ? "review" : "asking");
    };
    if (typingDelay > 0) {
      setTyping(true);
      timer.current = setTimeout(finish, typingDelay);
    } else finish();
  };

  const answer = (value: string) => {
    if (!step || typing) return;
    interacted.current = true;
    const problem = check(step, value, answers);
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    const nextAnswers = { ...answers, [step.id]: value.trim() };
    setAnswers(nextAnswers);
    // Next unanswered step after this one, else any earlier gap, else the review.
    const after = firstOpen(steps, nextAnswers, index + 1);
    goTo(after < steps.length ? after : firstOpen(steps, nextAnswers), nextAnswers);
  };

  const back = () => {
    if (index === 0 || typing) return;
    interacted.current = true;
    const prev = Math.min(index, steps.length) - 1;
    const nextAnswers = { ...answers };
    delete nextAnswers[steps[prev].id];
    setDraft(answers[steps[prev].id] ?? "");
    setAnswers(nextAnswers);
    setError(null);
    setIndex(prev);
    setStatus("asking");
  };

  const edit = (i: number) => {
    interacted.current = true;
    const nextAnswers = { ...answers };
    delete nextAnswers[steps[i].id];
    setDraft(answers[steps[i].id] ?? "");
    setAnswers(nextAnswers);
    setIndex(i);
    setStatus("asking");
  };

  const submit = async () => {
    const result = onComplete(answers);
    if (result instanceof Promise) {
      setStatus("sending");
      try {
        await result;
      } catch {
        setStatus("review");
        setError("Something went wrong. Please try again.");
        return;
      }
    }
    setStatus("done");
  };

  const restart = () => {
    interacted.current = true;
    setAnswers({});
    setDraft("");
    setError(null);
    setIndex(0);
    setStatus("asking");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    answer(draft);
  };

  const onTextareaKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      answer(draft);
    }
  };

  const fieldClass =
    "w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <section
      aria-label={title}
      className={cn(
        "flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <style href="ls-conversational-form" precedence="default">
        {KEYFRAMES}
      </style>

      <header className="border-b border-zinc-200 px-5 pt-4 pb-3 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            {status === "done"
              ? "Done"
              : `${Math.min(answeredCount + (status === "asking" ? 1 : 0), steps.length)} of ${steps.length}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Form progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex flex-col gap-2.5 overflow-y-auto px-4 py-4"
        style={{ maxHeight }}
      >
        {steps.slice(0, Math.min(index, steps.length)).map((s) =>
          answers[s.id] === undefined ? null : (
            <div key={s.id} className="flex flex-col gap-2.5">
              <Bubble from="bot" avatar={avatar}>
                {ask(s, answers)}
              </Bubble>
              <Bubble from="user">{answers[s.id] || <span className="italic opacity-80">Skipped</span>}</Bubble>
            </div>
          ),
        )}

        {typing && (
          <div className="ls-chat-msg flex items-end gap-2">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200 [&_svg]:size-4"
            >
              {avatar ?? "✦"}
            </span>
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-3 dark:bg-zinc-800">
              <span className="sr-only">Typing…</span>
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  aria-hidden="true"
                  className="ls-chat-dot size-1.5 rounded-full bg-zinc-500"
                  style={{ animationDelay: `${d * 150}ms` }}
                />
              ))}
            </span>
          </div>
        )}

        {!typing && status === "asking" && step && (
          <Bubble from="bot" avatar={avatar}>
            <span id={questionId}>{ask(step, answers)}</span>
          </Bubble>
        )}

        {!typing && (status === "review" || status === "sending") && (
          <Bubble from="bot" avatar={avatar}>
            <p className="mb-2">Here&apos;s what I&apos;ve got. Anything to change?</p>
            <dl className="divide-y divide-zinc-200 rounded-xl bg-white text-xs dark:divide-zinc-700 dark:bg-zinc-900">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                  <dt className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{s.label ?? s.id}</dt>
                  <dd className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {answers[s.id] || "—"}
                  </dd>
                  <button
                    type="button"
                    onClick={() => edit(i)}
                    disabled={status === "sending"}
                    aria-label={`Edit ${s.label ?? s.id}`}
                    className="rounded-md px-1.5 py-0.5 text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </dl>
          </Bubble>
        )}

        {status === "done" && (
          <Bubble from="bot" avatar={avatar}>
            {typeof doneMessage === "function" ? doneMessage(answers) : doneMessage}
          </Bubble>
        )}
      </div>

      <footer className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        {status === "asking" && step && step.type === "choice" && (
          <div role="group" aria-labelledby={questionId} className="flex flex-wrap gap-2">
            {(step.options ?? []).map((option) => (
              <button
                key={option}
                type="button"
                disabled={typing}
                onClick={() => answer(option)}
                ref={(node) => {
                  if (option === step.options?.[0]) inputRef.current = node;
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 disabled:opacity-50",
                  answers[step.id] === option || draft === option
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-zinc-300 text-zinc-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {status === "asking" && step && step.type !== "choice" && (
          <form onSubmit={onSubmit} noValidate>
            <div
              className={cn(
                "flex items-end gap-2 rounded-2xl border bg-zinc-50 py-1.5 pr-1.5 pl-3.5 transition focus-within:ring-4 dark:bg-zinc-950/40",
                error
                  ? "border-rose-500 focus-within:ring-rose-500/15"
                  : "border-zinc-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/15 dark:border-zinc-700",
              )}
            >
              {step.type === "textarea" ? (
                <textarea
                  ref={(node) => {
                    inputRef.current = node;
                  }}
                  rows={2}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={onTextareaKey}
                  placeholder={step.placeholder ?? "Type your answer…"}
                  aria-labelledby={questionId}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? `${uid}-err` : undefined}
                  disabled={typing}
                  className={cn(fieldClass, "resize-none py-1.5")}
                />
              ) : (
                <input
                  ref={(node) => {
                    inputRef.current = node;
                  }}
                  type={step.type === "email" ? "email" : "text"}
                  inputMode={step.type === "number" ? "decimal" : step.type === "email" ? "email" : undefined}
                  autoComplete={step.type === "email" ? "email" : "off"}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                  }}
                  placeholder={step.placeholder ?? "Type your answer…"}
                  aria-labelledby={questionId}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? `${uid}-err` : undefined}
                  disabled={typing}
                  className={cn(fieldClass, "h-9")}
                />
              )}
              <button
                type="submit"
                disabled={typing}
                aria-label="Send answer"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
        )}

        {status === "asking" && (
          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-xs">
            <p id={`${uid}-err`} role="alert" className="text-rose-600 dark:text-rose-400">
              {error}
            </p>
            <div className="flex shrink-0 gap-3 text-zinc-500 dark:text-zinc-400">
              {step && step.required === false && (
                <button
                  type="button"
                  onClick={() => answer("")}
                  disabled={typing}
                  className="rounded hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:text-zinc-100"
                >
                  Skip
                </button>
              )}
              {index > 0 && (
                <button
                  type="button"
                  onClick={back}
                  disabled={typing}
                  className="rounded hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:text-zinc-100"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        )}

        {(status === "review" || status === "sending") && (
          <>
            <button
              type="button"
              onClick={submit}
              disabled={status === "sending" || typing}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-70 dark:focus-visible:ring-offset-zinc-900"
            >
              {status === "sending" && (
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {status === "sending" ? "Sending…" : "Looks good, send it"}
            </button>
            {error && (
              <p role="alert" className="mt-2 px-1 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </>
        )}

        {status === "done" && (
          <button
            type="button"
            onClick={restart}
            className="h-11 w-full rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Start over
          </button>
        )}
      </footer>
    </section>
  );
}
