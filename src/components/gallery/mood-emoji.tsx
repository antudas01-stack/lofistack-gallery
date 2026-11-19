"use client";

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";

export type MoodId =
  | "happy"
  | "excited"
  | "calm"
  | "loved"
  | "proud"
  | "grateful"
  | "okay"
  | "silly"
  | "sad"
  | "crying"
  | "lonely"
  | "tired"
  | "bored"
  | "stressed"
  | "anxious"
  | "angry"
  | "annoyed"
  | "scared"
  | "surprised"
  | "sick"
  | "confused"
  | "hungry"
  | "shy";

/** Every number that shapes the drawn face. */
export interface MoodFace {
  /** -1 frown … 1 smile */
  smile: number;
  /** 0 closed mouth … 1 wide open */
  open: number;
  /** 0 closed eyes … 1 wide eyes */
  eyes: number;
  /** 0 round eyes … 1 happy curved eyes */
  eyeSmile: number;
  /** -1 angry eyebrows … 1 worried eyebrows */
  brows: number;
  /** Head tilt in degrees */
  tilt: number;
  /** 0 smooth mouth … 1 wavy mouth */
  wobble: number;
  r: number;
  g: number;
  b: number;
  tears: number;
  sweat: number;
  zzz: number;
  hearts: number;
  blush: number;
  stars: number;
  tongue: number;
}

export interface FoundMood {
  id: MoodId;
  label: string;
  /** The word the person typed. */
  word: string;
  /** True when the word was negated ("not happy"), so the opposite mood is used. */
  negated: boolean;
  /** 0.4 (a bit) … 2 (very) */
  weight: number;
}

export interface MoodReading {
  text: string;
  moods: FoundMood[];
  /** Short name for the result, e.g. "Tired but happy". Empty when nothing was found. */
  label: string;
  /** -1 unpleasant … 1 pleasant */
  valence: number;
  /** -1 low energy … 1 high energy */
  energy: number;
  face: MoodFace;
}

export interface MoodEmojiProps {
  title?: string;
  /** The question above the text box. */
  question?: string;
  placeholder?: string;
  defaultText?: string;
  /** One-tap example sentences. Pass [] to hide them. */
  examples?: string[];
  /** Extra vocabulary, e.g. { khushi: "happy" }. Keys must be lower case. */
  extraWords?: Record<string, MoodId>;
  /** Mood and energy bars under the face. */
  showMeters?: boolean;
  /** Download PNG and Copy image buttons. */
  showActions?: boolean;
  onChange?: (reading: MoodReading) => void;
  className?: string;
}

const DEFAULT_EXAMPLES = [
  "tired but happy",
  "so stressed about exams",
  "super excited!!",
  "a bit sick and sleepy",
  "not okay today",
];

const NEUTRAL: MoodFace = {
  smile: 0.05,
  open: 0,
  eyes: 0.65,
  eyeSmile: 0,
  brows: 0,
  tilt: 0,
  wobble: 0,
  r: 255,
  g: 210,
  b: 63,
  tears: 0,
  sweat: 0,
  zzz: 0,
  hearts: 0,
  blush: 0,
  stars: 0,
  tongue: 0,
};
const UNSURE: MoodFace = { ...NEUTRAL, smile: -0.05, eyes: 0.72, brows: 0.35, tilt: 7, wobble: 0.6 };

const CORE = ["smile", "open", "eyes", "eyeSmile", "brows", "tilt", "wobble", "r", "g", "b"] as const;
const SHAPE = ["smile", "open", "eyes", "eyeSmile", "brows", "tilt", "wobble"] as const;
const EXTRAS = ["tears", "sweat", "zzz", "hearts", "blush", "stars", "tongue"] as const;
const FACE_KEYS = [...CORE, ...EXTRAS];
const LIMITS: Record<(typeof SHAPE)[number], [number, number]> = {
  smile: [-1, 1],
  open: [0, 1],
  eyes: [0, 1],
  eyeSmile: [0, 1],
  brows: [-1, 1],
  tilt: [-12, 12],
  wobble: [0, 1],
};

interface MoodDef {
  label: string;
  valence: number;
  energy: number;
  /** Used when the word is negated: "not happy" reads as sad. */
  opposite: MoodId;
  face: Partial<MoodFace>;
  words: string;
}

const MOODS: Record<MoodId, MoodDef> = {
  happy: {
    label: "happy",
    valence: 0.8,
    energy: 0.4,
    opposite: "sad",
    face: { smile: 0.8, open: 0.2, eyes: 0.75, eyeSmile: 0.7, blush: 0.35 },
    words:
      "happy glad joy joyful cheerful good great amazing awesome wonderful fantastic delighted pleased smiling nice fun better hopeful optimistic",
  },
  excited: {
    label: "excited",
    valence: 0.9,
    energy: 0.9,
    opposite: "bored",
    face: { smile: 1, open: 0.85, eyes: 1, stars: 1, r: 255, g: 196, b: 40 },
    words: "excited thrilled pumped hyped ecstatic energetic eager stoked buzzing",
  },
  calm: {
    label: "calm",
    valence: 0.5,
    energy: -0.6,
    opposite: "stressed",
    face: { smile: 0.4, eyes: 0.5, eyeSmile: 1, r: 176, g: 228, b: 204 },
    words: "calm relaxed peaceful chill content serene comfortable cozy cosy rested relieved",
  },
  loved: {
    label: "in love",
    valence: 0.9,
    energy: 0.5,
    opposite: "lonely",
    face: { smile: 0.75, open: 0.15, hearts: 1, blush: 0.8, r: 255, g: 196, b: 150 },
    words: "love loved loving crush romantic adore smitten",
  },
  proud: {
    label: "proud",
    valence: 0.7,
    energy: 0.5,
    opposite: "shy",
    face: { smile: 0.6, eyes: 0.45, brows: -0.25 },
    words: "proud confident accomplished motivated unstoppable cool",
  },
  grateful: {
    label: "grateful",
    valence: 0.8,
    energy: 0.1,
    opposite: "sad",
    face: { smile: 0.6, eyeSmile: 1, blush: 0.7 },
    words: "grateful thankful blessed appreciated touched",
  },
  okay: {
    label: "okay",
    valence: 0.2,
    energy: 0,
    opposite: "sad",
    face: { smile: 0.25, eyes: 0.65 },
    words: "okay ok fine alright normal decent well",
  },
  silly: {
    label: "silly",
    valence: 0.7,
    energy: 0.7,
    opposite: "bored",
    face: { smile: 0.9, open: 0.7, tongue: 1, eyes: 0.9, tilt: -6 },
    words: "silly playful goofy funny laughing lol haha crazy",
  },
  sad: {
    label: "sad",
    valence: -0.7,
    energy: -0.4,
    opposite: "okay",
    face: { smile: -0.75, eyes: 0.55, brows: 0.9, tears: 0.45, r: 141, g: 185, b: 242 },
    words: "sad unhappy down blue low upset bad awful terrible miserable depressed gloomy hurt disappointed hopeless",
  },
  crying: {
    label: "heartbroken",
    valence: -1,
    energy: -0.2,
    opposite: "okay",
    face: { smile: -1, open: 0.35, eyes: 0.3, brows: 1, tears: 1, r: 120, g: 170, b: 240 },
    words: "crying cry heartbroken devastated sobbing tears grief grieving",
  },
  lonely: {
    label: "lonely",
    valence: -0.6,
    energy: -0.5,
    opposite: "loved",
    face: { smile: -0.5, eyes: 0.5, brows: 0.7, r: 170, g: 190, b: 230 },
    words: "lonely alone homesick ignored isolated empty",
  },
  tired: {
    label: "tired",
    valence: -0.3,
    energy: -0.9,
    opposite: "okay",
    face: { smile: -0.1, eyes: 0.1, brows: 0.3, zzz: 1, r: 226, g: 214, b: 160 },
    words: "tired sleepy exhausted drained sleepless fatigued drowsy lazy",
  },
  bored: {
    label: "bored",
    valence: -0.3,
    energy: -0.7,
    opposite: "excited",
    face: { smile: -0.2, eyes: 0.3, r: 220, g: 216, b: 190 },
    words: "bored boring meh dull unmotivated numb",
  },
  stressed: {
    label: "stressed",
    valence: -0.7,
    energy: 0.7,
    opposite: "calm",
    face: { smile: -0.5, open: 0.15, eyes: 0.95, brows: 0.8, sweat: 1, wobble: 0.6, r: 255, g: 184, b: 107 },
    words: "stressed stress stressful overwhelmed pressure pressured busy tense overworked",
  },
  anxious: {
    label: "anxious",
    valence: -0.6,
    energy: 0.6,
    opposite: "calm",
    face: { smile: -0.4, eyes: 0.95, brows: 1, sweat: 0.7, wobble: 0.8, r: 201, g: 184, b: 240 },
    words: "anxious nervous worried worry uneasy restless panicking panic insecure overthinking",
  },
  angry: {
    label: "angry",
    valence: -0.8,
    energy: 0.8,
    opposite: "calm",
    face: { smile: -0.7, eyes: 0.55, brows: -1, r: 242, g: 100, b: 78 },
    words: "angry mad furious rage pissed hate outraged livid",
  },
  annoyed: {
    label: "annoyed",
    valence: -0.5,
    energy: 0.3,
    opposite: "calm",
    face: { smile: -0.4, eyes: 0.35, brows: -0.6, r: 245, g: 165, b: 110 },
    words: "annoyed irritated frustrated grumpy cranky bothered moody jealous",
  },
  scared: {
    label: "scared",
    valence: -0.7,
    energy: 0.8,
    opposite: "calm",
    face: { smile: -0.3, open: 0.8, eyes: 1, brows: 1, sweat: 0.5, r: 191, g: 216, b: 245 },
    words: "scared afraid terrified frightened fear horrified spooked",
  },
  surprised: {
    label: "surprised",
    valence: 0.1,
    energy: 0.8,
    opposite: "calm",
    face: { smile: 0, open: 1, eyes: 1, brows: 0.3 },
    words: "surprised shocked amazed stunned wow speechless astonished",
  },
  sick: {
    label: "sick",
    valence: -0.6,
    energy: -0.6,
    opposite: "okay",
    face: { smile: -0.45, eyes: 0.35, brows: 0.6, wobble: 1, sweat: 0.4, r: 168, g: 214, b: 114 },
    words: "sick ill unwell nauseous feverish fever dizzy headache hungover",
  },
  confused: {
    label: "confused",
    valence: -0.2,
    energy: 0.1,
    opposite: "okay",
    face: { smile: -0.1, eyes: 0.7, brows: 0.4, tilt: 9, wobble: 0.7 },
    words: "confused lost unsure puzzled uncertain clueless weird",
  },
  hungry: {
    label: "hungry",
    valence: -0.1,
    energy: 0.2,
    opposite: "okay",
    face: { smile: 0.15, open: 0.55, tongue: 1, eyes: 0.85 },
    words: "hungry starving starved craving peckish",
  },
  shy: {
    label: "shy",
    valence: 0.1,
    energy: -0.2,
    opposite: "proud",
    face: { smile: 0.2, eyes: 0.45, brows: 0.5, blush: 1 },
    words: "shy embarrassed awkward ashamed blushing guilty",
  },
};

const WORD_TO_MOOD = new Map<string, MoodId>();
for (const id of Object.keys(MOODS) as MoodId[])
  for (const word of MOODS[id].words.split(" ")) WORD_TO_MOOD.set(word, id);

const NEGATORS = new Set(["not", "no", "cannot", "cant", "dont", "isnt", "without", "hardly", "barely"]);
const BOOSTERS = new Set(["very", "so", "really", "extremely", "super", "too", "totally", "incredibly", "absolutely"]);
const SOFTENERS = new Set(["bit", "little", "slightly", "kinda", "somewhat", "mildly", "kind", "sort", "sorta"]);
const FILLERS = new Set(["a", "of", "at", "all", "that", "quite", "feel", "feeling", "be", "been", "being", "in"]);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** The word itself, then the same word with common endings removed (stressed → stress, happily → happy). */
function forms(word: string) {
  const out = [word];
  if (word.endsWith("iest")) out.push(word.slice(0, -4) + "y");
  if (word.endsWith("ier") || word.endsWith("ily")) out.push(word.slice(0, -3) + "y");
  if (word.endsWith("ness")) out.push(word.slice(0, -4));
  if (word.endsWith("ing")) out.push(word.slice(0, -3), word.slice(0, -3) + "e");
  if (word.endsWith("ed")) out.push(word.slice(0, -2), word.slice(0, -1));
  if (word.endsWith("ly")) out.push(word.slice(0, -2));
  if (word.endsWith("s")) out.push(word.slice(0, -1));
  return out;
}

/** Reads the feeling words in a sentence and turns them into a face. No network, no AI. */
export function readMood(text: string, extraWords?: Record<string, MoodId>): MoodReading {
  const tokens =
    text
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[\p{L}\p{M}]+(?:'[\p{L}\p{M}]+)?/gu) ?? [];
  const lookup = (word: string) => {
    for (const form of forms(word)) {
      const mood = extraWords?.[form] ?? WORD_TO_MOOD.get(form);
      if (mood) return mood;
    }
    return null;
  };

  const shout = (text.match(/!/g)?.length ?? 0) >= 2 ? 1.2 : 1;
  const moods: FoundMood[] = [];
  tokens.forEach((word, index) => {
    const found = lookup(word);
    if (!found) return;
    let negated = false;
    let weight = 1;
    // Walk back over the words that belong to it: "not very happy", "a little bit tired".
    // Any other word ends the walk, so "can't sleep, so tired" does not read as "not tired".
    for (let back = index - 1; back >= Math.max(0, index - 4); back -= 1) {
      const before = tokens[back];
      if (NEGATORS.has(before) || before.endsWith("n't")) {
        negated = true;
        break;
      }
      if (BOOSTERS.has(before)) weight *= 1.5;
      else if (SOFTENERS.has(before)) weight *= 0.55;
      else if (!FILLERS.has(before)) break;
    }
    const id = negated ? MOODS[found].opposite : found;
    weight = negated ? 0.8 : clamp(weight * shout, 0.4, 2);
    const existing = moods.find((m) => m.id === id);
    if (existing) existing.weight = Math.min(2, existing.weight + weight * 0.5);
    else moods.push({ id, label: MOODS[id].label, word, negated, weight: r1(weight) });
  });

  if (moods.length === 0) {
    return { text, moods, label: "", valence: 0, energy: 0, face: text.trim() ? UNSURE : NEUTRAL };
  }

  const total = moods.reduce((sum, m) => sum + m.weight, 0);
  const average = (pick: (mood: FoundMood) => number) => moods.reduce((sum, m) => sum + pick(m) * m.weight, 0) / total;
  const strength = clamp(total / moods.length, 0.6, 1.3);

  const face = { ...NEUTRAL };
  for (const key of CORE) face[key] = average((m) => MOODS[m.id].face[key] ?? NEUTRAL[key]);
  for (const key of SHAPE) {
    face[key] = clamp(NEUTRAL[key] + (face[key] - NEUTRAL[key]) * strength, LIMITS[key][0], LIMITS[key][1]);
  }
  for (const key of EXTRAS) {
    face[key] = Math.max(...moods.map((m) => (MOODS[m.id].face[key] ?? 0) * Math.min(1, m.weight)));
  }

  const names = moods.slice(0, 3).map((m) => m.label);
  let label = names[0];
  if (names.length === 1) {
    if (moods[0].weight >= 1.4) label = `very ${label}`;
    else if (moods[0].weight <= 0.6) label = `a bit ${label}`;
  } else if (names.length === 2) {
    const mixed = MOODS[moods[0].id].valence * MOODS[moods[1].id].valence < 0;
    label = `${names[0]} ${mixed ? "but" : "and"} ${names[1]}`;
  } else {
    label = `${names[0]}, ${names[1]} and ${names[2]}`;
  }

  return {
    text,
    moods,
    label: label[0].toUpperCase() + label.slice(1),
    valence: r1(average((m) => MOODS[m.id].valence)),
    energy: r1(average((m) => MOODS[m.id].energy)),
    face,
  };
}

const sameFace = (a: MoodFace, b: MoodFace) => FACE_KEYS.every((key) => Math.abs(a[key] - b[key]) < 0.004);

const INK = "#3b2a1a";
const DROP = "M0,0 C-5,7 -5,13 0,13 C5,13 5,7 0,0 Z";
const HEART = "M0,6 C-12,-3 -6,-11 0,-4 C6,-11 12,-3 0,6 Z";
const SPARKLE = "M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z";

function EmojiFace({
  face,
  label,
  svgRef,
}: {
  face: MoodFace;
  label: string;
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const uid = useId();
  const tone = (amount: number) => {
    const to = amount > 0 ? 255 : 0;
    const k = Math.abs(amount);
    return `rgb(${[face.r, face.g, face.b].map((c) => Math.round(c + (to - c) * k)).join(" ")})`;
  };

  // Mouth: two curves between the corners. Closed, they overlap into a line.
  const width = 30 - face.open * (1 - Math.abs(face.smile)) * 13;
  const cornerY = 134 - face.smile * 5;
  const curve = face.smile * 20;
  const topY = (134 + curve - face.open * 6 - cornerY) * (2 / 3) + cornerY;
  const bottomY = (134 + curve + face.open * 26 - cornerY) * (2 / 3) + cornerY;
  const wave = face.wobble * 9;
  const x0 = r1(100 - width);
  const x1 = r1(100 + width);
  const c0 = r1(100 - width / 3);
  const c1 = r1(100 + width / 3);
  const mouth =
    `M${x0},${r1(cornerY)} C${c0},${r1(topY - wave)} ${c1},${r1(topY + wave)} ${x1},${r1(cornerY)} ` +
    `C${c1},${r1(bottomY + wave)} ${c0},${r1(bottomY - wave)} ${x0},${r1(cornerY)} Z`;

  const eyeHeight = r1(1.6 + 10.4 * face.eyes);
  const roundEyes = (1 - face.eyeSmile) * (1 - face.hearts);
  const browDrop = face.brows < 0 ? -face.brows * 4 : 0;
  const browInner = r1(66 - face.brows * 7 + browDrop);
  const browOuter = r1(66 + face.brows * 5 + browDrop);

  return (
    <svg ref={svgRef} viewBox="0 0 200 200" role="img" aria-label={label} className="h-auto w-full">
      <defs>
        <radialGradient id={`${uid}-skin`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor={tone(0.45)} />
          <stop offset="55%" stopColor={tone(0)} />
          <stop offset="100%" stopColor={tone(-0.16)} />
        </radialGradient>
        <clipPath id={`${uid}-mouth`}>
          <path d={mouth} />
        </clipPath>
      </defs>

      <g className="mood-emoji-bob">
        <g transform={`rotate(${r1(face.tilt)} 100 100)`}>
          <circle cx="100" cy="100" r="84" fill={`url(#${uid}-skin)`} stroke={tone(-0.3)} strokeWidth="3" />

          <g fill="#ff6b8a" opacity={r1(face.blush * 0.55)}>
            <ellipse cx="56" cy="120" rx="14" ry="8" />
            <ellipse cx="144" cy="120" rx="14" ry="8" />
          </g>

          <g stroke={INK} strokeWidth="5" strokeLinecap="round" opacity={r1(0.35 + 0.65 * Math.abs(face.brows))}>
            <line x1="55" y1={browOuter} x2="83" y2={browInner} />
            <line x1="145" y1={browOuter} x2="117" y2={browInner} />
          </g>

          <g opacity={r1(roundEyes)}>
            <g className="mood-emoji-blink" fill={INK}>
              <ellipse cx="70" cy="90" rx="8.5" ry={eyeHeight} />
              <ellipse cx="130" cy="90" rx="8.5" ry={eyeHeight} />
            </g>
            <g fill="#fff" opacity={face.eyes > 0.45 ? 0.9 : 0}>
              <circle cx="67" cy="86" r="2.6" />
              <circle cx="127" cy="86" r="2.6" />
            </g>
          </g>
          <g
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
            opacity={r1(face.eyeSmile * (1 - face.hearts))}
          >
            <path d="M60,93 Q70,80 80,93" />
            <path d="M120,93 Q130,80 140,93" />
          </g>
          <g fill="#f43f5e" opacity={r1(face.hearts)}>
            <path d={HEART} transform="translate(70 91) scale(1.35)" />
            <path d={HEART} transform="translate(130 91) scale(1.35)" />
          </g>

          <path
            d={mouth}
            fill="#5a2a1e"
            fillOpacity={r1(Math.min(1, face.open * 8))}
            stroke={INK}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <ellipse
            cx="100"
            cy={r1((cornerY + bottomY) / 2 + 9)}
            rx="13"
            ry="9"
            fill="#ff7a90"
            opacity={r1(face.tongue * Math.min(1, face.open * 4))}
            clipPath={`url(#${uid}-mouth)`}
          />

          <g fill="#5cc8ff" stroke="#2f9fe0" strokeWidth="1" opacity={r1(face.tears)}>
            <g className="mood-emoji-drip">
              <path d={DROP} transform={`translate(64 104) scale(${r1(0.9 + face.tears * 0.7)})`} />
              <path d={DROP} transform={`translate(136 104) scale(${r1(0.9 + face.tears * 0.7)})`} />
            </g>
          </g>
          <path
            d={DROP}
            transform="translate(44 44) scale(1.3)"
            fill="#8fdcff"
            stroke="#3fa9e0"
            strokeWidth="1"
            opacity={r1(face.sweat)}
          />
        </g>
      </g>

      <g opacity={r1(face.zzz)}>
        <g className="mood-emoji-float" fill="#6366f1" fontFamily="system-ui, sans-serif" fontWeight="800">
          <text x="146" y="52" fontSize="14">
            z
          </text>
          <text x="160" y="38" fontSize="18">
            z
          </text>
          <text x="176" y="22" fontSize="22">
            Z
          </text>
        </g>
      </g>
      <g opacity={r1(face.stars)}>
        <g className="mood-emoji-float" fill="#f59e0b">
          <path d={SPARKLE} transform="translate(20 42)" />
          <path d={SPARKLE} transform="translate(184 62) scale(0.75)" />
          <path d={SPARKLE} transform="translate(172 164) scale(0.9)" />
        </g>
      </g>
      <g opacity={r1(face.hearts)}>
        <g className="mood-emoji-float" fill="#fb7185">
          <path d={HEART} transform="translate(22 46) scale(1.1)" />
          <path d={HEART} transform="translate(182 156) scale(0.9)" />
        </g>
      </g>
    </svg>
  );
}

function Meter({ label, value, word }: { label: string; value: number; word: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>{label}</span>
        <span className="font-medium text-zinc-800 dark:text-zinc-100">{word}</span>
      </div>
      <div className="relative mt-1.5 h-1.5 rounded-full bg-zinc-900/10 dark:bg-white/15">
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-white transition-[left] duration-300 dark:bg-white dark:ring-zinc-900"
          style={{ left: `${clamp((value + 1) * 50, 4, 96)}%` }}
        />
      </div>
    </div>
  );
}

const scaleWord = (value: number, words: [string, string, string, string, string]) =>
  words[value > 0.5 ? 4 : value > 0.15 ? 3 : value >= -0.15 ? 2 : value >= -0.5 ? 1 : 0];

export function MoodEmoji({
  title = "Mood emoji",
  question = "How are you feeling?",
  placeholder = "e.g. tired but happy today",
  defaultText = "",
  examples = DEFAULT_EXAMPLES,
  extraWords,
  showMeters = true,
  showActions = true,
  onChange,
  className,
}: MoodEmojiProps) {
  const uid = useId();
  const [text, setText] = useState(defaultText);
  const [notice, setNotice] = useState<string | null>(null);
  const reading = useMemo(() => readMood(text, extraWords), [text, extraWords]);
  const target = reading.face;

  // The face on screen glides towards the target face.
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      shownRef.current = target;
      setShown(target);
    };
    const step = () => {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const next = { ...target };
      if (!still)
        for (const key of FACE_KEYS) next[key] = shownRef.current[key] + (target[key] - shownRef.current[key]) * 0.2;
      if (still || sameFace(next, target)) {
        clearTimeout(safety);
        finish();
        return;
      }
      shownRef.current = next;
      setShown(next);
      frame = requestAnimationFrame(step);
    };
    // Background tabs pause animation frames, so a timer makes sure the face still arrives.
    const safety = setTimeout(finish, 700);
    if (!sameFace(shownRef.current, target)) frame = requestAnimationFrame(step);
    else clearTimeout(safety);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(safety);
    };
  }, [target]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current?.(reading);
  }, [reading]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const toPng = () =>
    new Promise<Blob>((resolve, reject) => {
      const svg = svgRef.current;
      if (!svg) return reject(new Error("no face"));
      const copy = svg.cloneNode(true) as SVGSVGElement;
      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      copy.setAttribute("width", "512");
      copy.setAttribute("height", "512");
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        canvas.getContext("2d")?.drawImage(image, 0, 0, 512, 512);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no image"))), "image/png");
      };
      image.onerror = () => reject(new Error("no image"));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    });

  const fileName = `mood-${(reading.label || "emoji").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  const download = async () => {
    try {
      const url = URL.createObjectURL(await toPng());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNotice(`Saved ${fileName}`);
    } catch {
      setNotice("The picture couldn't be made.");
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": toPng() })]);
      setNotice("Copied. Paste it into any chat.");
    } catch {
      setNotice("Copying pictures isn't allowed in this browser. Use Download instead.");
    }
  };

  const empty = text.trim() === "";
  const caption = empty ? "Waiting for your mood" : reading.label || "Not sure yet";
  const button =
    "rounded-full px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-white active:scale-95 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900";

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={cn(
        "@container w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm sm:p-6 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100",
        className,
      )}
    >
      <style href="mood-emoji" precedence="default">{`
        @keyframes mood-emoji-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes mood-emoji-blink { 0%, 93%, 100% { transform: scaleY(1) } 96.5% { transform: scaleY(0.1) } }
        @keyframes mood-emoji-float { 0%, 100% { transform: translateY(3px) } 50% { transform: translateY(-4px) } }
        @keyframes mood-emoji-drip { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(4px) } }
        .mood-emoji-bob { animation: mood-emoji-bob 3.4s ease-in-out infinite }
        .mood-emoji-blink { transform-box: fill-box; transform-origin: center; animation: mood-emoji-blink 4.6s infinite }
        .mood-emoji-float { animation: mood-emoji-float 2.6s ease-in-out infinite }
        .mood-emoji-drip { animation: mood-emoji-drip 1.8s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .mood-emoji-bob, .mood-emoji-blink, .mood-emoji-float, .mood-emoji-drip { animation: none }
        }
      `}</style>

      <h2
        id={`${uid}-title`}
        className="text-xs font-semibold tracking-[0.22em] text-zinc-500 uppercase dark:text-zinc-400"
      >
        {title}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-6 @xl:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <label htmlFor={`${uid}-text`} className="text-2xl font-semibold tracking-tight">
              {question}
            </label>
            <textarea
              id={`${uid}-text`}
              rows={2}
              maxLength={160}
              value={text}
              placeholder={placeholder}
              aria-describedby={`${uid}-found`}
              onChange={(event) => {
                setText(event.target.value);
                setNotice(null);
              }}
              className="mt-3 w-full resize-none rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white/20"
            />
          </div>

          <div id={`${uid}-found`} className="min-h-12 text-sm">
            {reading.moods.length > 0 ? (
              <>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Feeling words I found</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {reading.moods.map((mood) => (
                    <li
                      key={mood.id}
                      className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
                    >
                      {mood.negated
                        ? `not ${mood.word} → ${mood.label}`
                        : mood.word === mood.label
                          ? mood.word
                          : `${mood.word} → ${mood.label}`}
                      {!mood.negated && mood.weight >= 1.4 ? " (strong)" : ""}
                      {!mood.negated && mood.weight <= 0.6 ? " (a bit)" : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">
                {empty
                  ? "Write a few words and your emoji is drawn as you type."
                  : "I couldn't find a feeling word yet. Try words like happy, tired, stressed, excited or sad."}
              </p>
            )}
          </div>

          {examples.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Or try one</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    aria-pressed={text === example}
                    onClick={() => {
                      setText(example);
                      setNotice(null);
                    }}
                    className={cn(
                      button,
                      "px-3 py-1.5 font-medium ring-1",
                      text === example
                        ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white"
                        : "text-zinc-700 ring-zinc-300 hover:bg-zinc-100 dark:text-zinc-200 dark:ring-white/20 dark:hover:bg-white/10",
                    )}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex flex-col gap-4 rounded-2xl p-4"
          style={{
            backgroundColor: `rgb(${Math.round(shown.r)} ${Math.round(shown.g)} ${Math.round(shown.b)} / 0.16)`,
          }}
        >
          <div className="mx-auto w-full max-w-44">
            <EmojiFace face={shown} label={`Emoji: ${caption}`} svgRef={svgRef} />
          </div>
          <p role="status" className="text-center text-lg leading-tight font-semibold tracking-tight">
            {caption}
          </p>

          {showMeters && (
            <div className="flex flex-col gap-3">
              <Meter
                label="Mood"
                value={reading.valence}
                word={scaleWord(reading.valence, ["Very low", "Low", "Neutral", "Good", "Very good"])}
              />
              <Meter
                label="Energy"
                value={reading.energy}
                word={scaleWord(reading.energy, ["Very low", "Low", "Steady", "Lively", "High"])}
              />
            </div>
          )}

          {showActions && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={download}
                className={cn(
                  button,
                  "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
                )}
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={copy}
                className={cn(
                  button,
                  "text-zinc-800 ring-1 ring-zinc-900/25 hover:bg-zinc-900/5 dark:text-zinc-100 dark:ring-white/30 dark:hover:bg-white/10",
                )}
              >
                Copy image
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className="text-center text-xs text-zinc-600 dark:text-zinc-300">
              {notice}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
