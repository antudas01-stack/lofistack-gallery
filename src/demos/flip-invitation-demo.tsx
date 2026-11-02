"use client";

import { useState, type ReactNode } from "react";
import { FlipInvitation, type InvitationTheme, type RsvpResponse } from "@/components/gallery/flip-invitation";
import { Segmented, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const EVENTS = {
  wedding: {
    hosts: "Aria Rahman & Leo Das",
    monogram: "A & L",
    preface: "Together with their families",
    message: "request the pleasure of your company at their wedding",
    eventDate: "2026-12-12T18:00:00+06:00",
    timeZone: "Asia/Dhaka",
    venue: "Rosewood Hall",
    address: "House 12, Road 7, Gulshan, Dhaka",
    dressCode: "Black tie · Ivory & gold",
    rsvpNote: "Kindly reply by Nov 30",
  },
  birthday: {
    hosts: "Maya turns 30",
    monogram: "30",
    preface: "Save the night",
    message: "cake, candles and a very loud playlist",
    eventDate: "2026-11-28T19:30:00+06:00",
    timeZone: "Asia/Dhaka",
    venue: "Rooftop 21",
    address: "Banani, Dhaka",
    dressCode: "Something sparkly",
    rsvpNote: "Reply by Nov 20",
  },
  launch: {
    hosts: "LofiStack Launch Night",
    monogram: "LS",
    preface: "You're invited to",
    message: "an evening of demos, music and good people",
    eventDate: "2026-11-21T19:00:00+06:00",
    timeZone: "Asia/Dhaka",
    venue: "Studio 9",
    address: "Dhanmondi 27, Dhaka",
    dressCode: "Smart casual",
    rsvpNote: "Limited seats",
  },
} as const;
type EventKey = keyof typeof EVENTS;

/** Renders the card at its designed 340px width, scaled down to fit small tiles. */
function Mini({ scale, children }: { scale: number; children: ReactNode }) {
  return (
    <div style={{ width: 340 * scale, height: 476 * scale }}>
      <div className="w-[340px] origin-top-left" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function FlipInvitationPlayground() {
  const [event, setEvent] = useState<EventKey>("wedding");
  const [theme, setTheme] = useState<InvitationTheme>("ivory");
  const [asyncRsvp, setAsyncRsvp] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);
  const [log, setLog] = useState<string | null>(null);
  const e = EVENTS[event];

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full flex-col items-center gap-4">
          <FlipInvitation
            key={`${event}-${theme}`}
            {...e}
            theme={theme}
            mapUrl="https://maps.google.com/?q=Gulshan+Dhaka"
            showCalendar={showCalendar}
            onRsvp={(r: RsvpResponse) => {
              setLog(`onRsvp("${r}")`);
              return asyncRsvp ? wait(900) : undefined;
            }}
          />
          <p className="font-mono text-[11px] text-fg-muted">{log ?? "Tap the card to open it, then RSVP."}</p>
        </div>
      }
      controls={
        <>
          <Segmented
            label="Event"
            options={["wedding", "birthday", "launch"] as const}
            value={event}
            onChange={setEvent}
          />
          <Segmented
            label="Theme"
            options={["ivory", "midnight", "blush", "sage"] as const}
            value={theme}
            onChange={setTheme}
          />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Async RSVP (saving state)" checked={asyncRsvp} onChange={setAsyncRsvp} />
            <Toggle label="Add to calendar" checked={showCalendar} onChange={setShowCalendar} />
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            Hover with a mouse for the 3D tilt. “Add to calendar” downloads a real{" "}
            <span className="font-mono">.ics</span> file.
          </p>
        </>
      }
    />
  );
}

export function FlipInvitationStates() {
  const w = EVENTS.wedding;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StateTile label="Midnight · front">
        <Mini scale={0.7}>
          <FlipInvitation {...EVENTS.launch} theme="midnight" />
        </Mini>
      </StateTile>
      <StateTile label="Blush · back, RSVP open">
        <Mini scale={0.7}>
          <FlipInvitation {...EVENTS.birthday} theme="blush" defaultFlipped />
        </Mini>
      </StateTile>
      <StateTile label="Sage · back, accepted">
        <Mini scale={0.7}>
          <FlipInvitation {...w} theme="sage" defaultFlipped defaultResponse="yes" />
        </Mini>
      </StateTile>
      <StateTile label="Ivory · front">
        <Mini scale={0.7}>
          <FlipInvitation {...w} />
        </Mini>
      </StateTile>
      <StateTile label="Past event (RSVP closed)">
        <Mini scale={0.7}>
          <FlipInvitation {...w} eventDate="2026-09-20T18:00:00+06:00" defaultFlipped />
        </Mini>
      </StateTile>
    </div>
  );
}

export function FlipInvitationCard() {
  return (
    <Mini scale={0.36}>
      <FlipInvitation {...EVENTS.wedding} theme="midnight" />
    </Mini>
  );
}
