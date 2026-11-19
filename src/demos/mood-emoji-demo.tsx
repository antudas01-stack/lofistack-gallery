"use client";

import { useState, type ReactNode } from "react";
import { MoodEmoji, type MoodId, type MoodReading } from "@/components/gallery/mood-emoji";
import { Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

/** Extra vocabulary passed through the extraWords prop: Bangla written in English letters. */
const BANGLISH: Record<string, MoodId> = {
  khushi: "happy",
  bhalo: "happy",
  klanto: "tired",
  ragi: "angry",
  chinta: "anxious",
  kharap: "sad",
};
const BANGLISH_EXAMPLES = ["ami khushi", "khub klanto", "onek chinta"];
const NO_EXAMPLES: string[] = [];

export function MoodEmojiPlayground() {
  const [examples, setExamples] = useState(true);
  const [meters, setMeters] = useState(true);
  const [actions, setActions] = useState(true);
  const [banglish, setBanglish] = useState(false);
  const [reading, setReading] = useState<MoodReading | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-3xl min-w-0 flex-col gap-3">
          <MoodEmoji
            key={String(banglish)}
            examples={!examples ? NO_EXAMPLES : banglish ? BANGLISH_EXAMPLES : undefined}
            extraWords={banglish ? BANGLISH : undefined}
            showMeters={meters}
            showActions={actions}
            onChange={setReading}
          />
          <p className="truncate font-mono text-[11px] text-fg-muted">
            {reading && reading.moods.length > 0
              ? `onChange → "${reading.label}" · moods: ${reading.moods.map((m) => m.id).join(", ")} · valence ${reading.valence} · energy ${reading.energy}`
              : "Type how you feel. Nothing is sent anywhere."}
          </p>
        </div>
      }
      controls={
        <>
          <Toggle label="Example sentences" checked={examples} onChange={setExamples} />
          <Toggle label="Mood and energy bars" checked={meters} onChange={setMeters} />
          <Toggle label="Download and copy" checked={actions} onChange={setActions} />
          <Toggle label="Extra words (Banglish)" checked={banglish} onChange={setBanglish} />
          <p className="text-xs leading-relaxed text-fg-muted">
            It understands <span className="font-medium text-fg">not</span> (&quot;not okay&quot;), strength words like{" "}
            <span className="font-medium text-fg">very</span> and <span className="font-medium text-fg">a bit</span>,
            and mixes several feelings into one face.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            The face is drawn from numbers, not picked from a list, so &quot;tired but happy&quot; and &quot;tired and
            sad&quot; look different.
          </p>
        </>
      }
    />
  );
}

/** Renders the component at a fixed design width, scaled down to fit small tiles. */
function Mini({
  width,
  height,
  scale,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden" style={{ width: width * scale, height: height * scale }}>
      <div className="origin-top-left" style={{ width, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

const TILE = { width: 680, height: 504, scale: 0.64 };

export function MoodEmojiStates() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Empty: waiting for a mood">
        <Mini {...TILE}>
          <MoodEmoji />
        </Mini>
      </StateTile>
      <StateTile label="Two feelings mixed">
        <Mini {...TILE}>
          <MoodEmoji defaultText="tired but happy" />
        </Mini>
      </StateTile>
      <StateTile label={'Strong feeling ("super", "!!")'}>
        <Mini {...TILE}>
          <MoodEmoji defaultText="super excited!!" />
        </Mini>
      </StateTile>
      <StateTile label={'"not" flips the feeling'}>
        <Mini {...TILE}>
          <MoodEmoji defaultText="not okay today" />
        </Mini>
      </StateTile>
      <StateTile label="Stress: sweat and a wavy mouth">
        <Mini {...TILE}>
          <MoodEmoji defaultText="so stressed about exams" />
        </Mini>
      </StateTile>
      <StateTile label="No feeling word found">
        <Mini {...TILE}>
          <MoodEmoji defaultText="the weather is cloudy" />
        </Mini>
      </StateTile>
      <StateTile label="Love: heart eyes">
        <Mini {...TILE}>
          <MoodEmoji defaultText="I think I'm in love" />
        </Mini>
      </StateTile>
      <StateTile label="Angry and hungry">
        <Mini {...TILE}>
          <MoodEmoji defaultText="angry and really hungry" />
        </Mini>
      </StateTile>
    </div>
  );
}

export function MoodEmojiCard() {
  return (
    <Mini width={680} height={400} scale={0.38}>
      <MoodEmoji defaultText="tired but happy" examples={NO_EXAMPLES} showActions={false} />
    </Mini>
  );
}
