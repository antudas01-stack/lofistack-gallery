"use client";

import { useState, type ReactNode } from "react";
import {
  StudyRoutine,
  type StudyDay,
  type StudyRoutineResult,
  type StudySubject,
} from "@/components/gallery/study-routine";
import { Segmented, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const CLASSES = ["School", "HSC Science"] as const;
const CLASS_SUBJECTS: Record<(typeof CLASSES)[number], StudySubject[] | undefined> = {
  School: undefined,
  "HSC Science": [
    { name: "Physics", level: "hard" },
    { name: "Chemistry", level: "hard" },
    { name: "Higher Math", level: "hard" },
    { name: "Biology" },
    { name: "Bangla", level: "easy" },
    { name: "English" },
    { name: "ICT", level: "easy" },
  ],
};
const WEEK_STARTS = ["Sat", "Sun", "Mon"] as const;
const NO_SUBJECTS: StudySubject[] = [];
const TWO_SUBJECTS: StudySubject[] = [{ name: "Math", level: "hard" }, { name: "English" }];
const MANY_SUBJECTS = ["Bangla", "English", "Math", "Physics", "Chemistry", "Biology", "ICT", "Religion"];
const WEEKEND: StudyDay[] = ["fri", "sat"];
const ALL_DAYS: StudyDay[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export function StudyRoutinePlayground() {
  const [group, setGroup] = useState<(typeof CLASSES)[number]>("School");
  const [weekStart, setWeekStart] = useState<(typeof WEEK_STARTS)[number]>("Sat");
  const [hardFirst, setHardFirst] = useState(true);
  const [routine, setRoutine] = useState<StudyRoutineResult | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-4xl min-w-0 flex-col gap-3">
          <StudyRoutine
            key={group}
            defaultSubjects={CLASS_SUBJECTS[group]}
            weekStart={weekStart.toLowerCase() as StudyDay}
            hardFirst={hardFirst}
            onChange={setRoutine}
          />
          <p className="truncate font-mono text-[11px] text-fg-muted">
            {routine && !routine.problem
              ? `onChange → ${routine.sessionsPerWeek} sessions · ${routine.slots.length} a day · ${routine.totals.map((t) => `${t.name} ${t.sessions}`).join(", ")}`
              : "onChange → no routine yet"}
          </p>
        </div>
      }
      controls={
        <>
          <Segmented label="Starting subjects" options={CLASSES} value={group} onChange={setGroup} />
          <Segmented label="Week starts on" options={WEEK_STARTS} value={weekStart} onChange={setWeekStart} />
          <Toggle label="Hardest subjects first" checked={hardFirst} onChange={setHardFirst} />
          <p className="text-xs leading-relaxed text-fg-muted">
            Every subject gets at least one session. The rest are shared by difficulty, so a{" "}
            <span className="font-medium text-fg">Hard</span> subject gets about three times as many as an{" "}
            <span className="font-medium text-fg">Easy</span> one.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            A subject is spread over different days instead of being stacked on one, and{" "}
            <span className="font-medium text-fg">Shuffle</span> gives another arrangement.
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

const TILE = { width: 860, scale: 0.5 };

export function StudyRoutineStates() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="6 subjects · 6 PM to 10 PM · Friday free">
        <Mini {...TILE} height={1004}>
          <StudyRoutine />
        </Mini>
      </StateTile>
      <StateTile label="Two subjects: the hard one gets more">
        <Mini {...TILE} height={830}>
          <StudyRoutine defaultSubjects={TWO_SUBJECTS} />
        </Mini>
      </StateTile>
      <StateTile label="Late night: 10 PM to 1 AM, every day">
        <Mini {...TILE} height={947}>
          <StudyRoutine defaultStart="22:00" defaultEnd="01:00" defaultStudyDays={ALL_DAYS} />
        </Mini>
      </StateTile>
      <StateTile label="Not enough time for every subject">
        <Mini {...TILE} height={1084}>
          <StudyRoutine
            defaultSubjects={MANY_SUBJECTS}
            defaultStart="19:00"
            defaultEnd="21:00"
            defaultSessionMinutes={60}
            defaultBreakMinutes={0}
            defaultStudyDays={WEEKEND}
          />
        </Mini>
      </StateTile>
      <StateTile label="No subjects yet">
        <Mini {...TILE} height={592}>
          <StudyRoutine defaultSubjects={NO_SUBJECTS} />
        </Mini>
      </StateTile>
      <StateTile label="Study time shorter than one session">
        <Mini {...TILE} height={592}>
          <StudyRoutine defaultSubjects={TWO_SUBJECTS} defaultStart="18:00" defaultEnd="18:30" />
        </Mini>
      </StateTile>
    </div>
  );
}

export function StudyRoutineCard() {
  return (
    <div className="overflow-hidden" style={{ width: 860 * 0.36, height: 400 * 0.36 }}>
      <div className="origin-top-left" style={{ width: 860, transform: "scale(0.36) translateY(-490px)" }}>
        <StudyRoutine />
      </div>
    </div>
  );
}
