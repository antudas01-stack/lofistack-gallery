"use client";

import { useState, type ReactNode } from "react";
import { SunCompass, type SunInfo, type SunLocation } from "@/components/gallery/sun-compass";
import { Segmented, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const TROMSO: SunLocation[] = [
  { id: "tromso", name: "Tromsø", latitude: 69.65, longitude: 18.96, timeZone: "Europe/Oslo" },
];

// Fixed moments so the state tiles always look the same.
const DHAKA_MIDDAY = Date.UTC(2026, 10, 14, 6, 0); // 12:00 in Dhaka
const DHAKA_SUNSET = Date.UTC(2026, 10, 14, 11, 20); // 5:20 pm in Dhaka
const DHAKA_NIGHT = Date.UTC(2026, 10, 14, 17, 0); // 11:00 pm in Dhaka
const SYDNEY_MIDDAY = Date.UTC(2026, 10, 14, 1, 30); // 12:30 pm in Sydney
const TROMSO_SUMMER = Date.UTC(2026, 5, 21, 21, 30); // 11:30 pm, midnight sun
const TROMSO_WINTER = Date.UTC(2026, 11, 21, 11, 0); // noon, polar night

const CLOCKS = ["Live", "Longest day", "Shortest day"] as const;
const CLOCK_DATES: Record<(typeof CLOCKS)[number], number | undefined> = {
  Live: undefined,
  "Longest day": Date.UTC(2026, 5, 21, 6, 0),
  "Shortest day": Date.UTC(2026, 11, 21, 6, 0),
};

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function SunCompassPlayground() {
  const [clock, setClock] = useState<(typeof CLOCKS)[number]>("Live");
  const [controls, setControls] = useState(true);
  const [geolocation, setGeolocation] = useState(true);
  const [info, setInfo] = useState<SunInfo | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-4xl min-w-0 flex-col gap-3">
          <SunCompass
            key={clock}
            date={CLOCK_DATES[clock]}
            showControls={controls}
            allowGeolocation={geolocation}
            onChange={setInfo}
          />
          <p className="truncate font-mono text-[11px] text-fg-muted">
            {info
              ? `onChange → azimuth ${info.azimuth.toFixed(1)}° (${POINTS[Math.round(info.azimuth / 45) % 8]}) · altitude ${info.altitude.toFixed(1)}°`
              : "Pick a city or drag the time slider."}
          </p>
        </div>
      }
      controls={
        <>
          <Segmented label="Date" options={CLOCKS} value={clock} onChange={setClock} />
          <Toggle label="Time slider" checked={controls} onChange={setControls} />
          <Toggle label="My location button" checked={geolocation} onChange={setGeolocation} />
          <p className="text-xs leading-relaxed text-fg-muted">
            The centre of the dial is <span className="font-medium text-fg">straight overhead</span> and the ring is the{" "}
            <span className="font-medium text-fg">horizon</span>. The dotted line is the sun&apos;s path today, and the
            dark line is the shadow of a stick standing at the centre.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            On a phone, <span className="font-medium text-fg">Use phone compass</span> turns the dial with the real
            compass so the sun marker points at the actual sun.
          </p>
        </>
      }
    />
  );
}

/** Renders the compass at a fixed design width, scaled down to fit small tiles. */
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

const TILE = { width: 720, height: 526, scale: 0.62 };

export function SunCompassStates() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Midday: sun high in the south">
        <Mini {...TILE}>
          <SunCompass date={DHAKA_MIDDAY} allowGeolocation={false} />
        </Mini>
      </StateTile>
      <StateTile label="Twilight: the sun has just set">
        <Mini {...TILE}>
          <SunCompass date={DHAKA_SUNSET} allowGeolocation={false} />
        </Mini>
      </StateTile>
      <StateTile label="Night: sun below the horizon">
        <Mini {...TILE}>
          <SunCompass date={DHAKA_NIGHT} allowGeolocation={false} />
        </Mini>
      </StateTile>
      <StateTile label="Southern hemisphere: sun in the north">
        <Mini {...TILE}>
          <SunCompass date={SYDNEY_MIDDAY} defaultLocationId="sydney" allowGeolocation={false} />
        </Mini>
      </StateTile>
      <StateTile label="Midnight sun: it never sets">
        <Mini {...TILE}>
          <SunCompass date={TROMSO_SUMMER} locations={TROMSO} allowGeolocation={false} />
        </Mini>
      </StateTile>
      <StateTile label="Polar night: it never rises">
        <Mini {...TILE}>
          <SunCompass date={TROMSO_WINTER} locations={TROMSO} allowGeolocation={false} />
        </Mini>
      </StateTile>
    </div>
  );
}

export function SunCompassCard() {
  return (
    <Mini width={720} height={440} scale={0.36}>
      <SunCompass date={DHAKA_MIDDAY} showControls={false} allowGeolocation={false} />
    </Mini>
  );
}
