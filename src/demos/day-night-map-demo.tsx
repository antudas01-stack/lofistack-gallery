"use client";

import { useState } from "react";
import { DayNightMap, type MapLocation } from "@/components/gallery/day-night-map";
import { ColorSwatches, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const LOCATIONS: MapLocation[] = [
  {
    id: "dhaka",
    name: "Dhaka",
    country: "Bangladesh",
    lat: 23.81,
    lng: 90.41,
    timeZone: "Asia/Dhaka",
    note: "HQ · 42 people",
  },
  {
    id: "london",
    name: "London",
    country: "UK",
    lat: 51.51,
    lng: -0.13,
    timeZone: "Europe/London",
    note: "Design studio · 8 people",
  },
  {
    id: "nyc",
    name: "New York",
    country: "USA",
    lat: 40.71,
    lng: -74.01,
    timeZone: "America/New_York",
    note: "Sales · 12 people",
  },
  {
    id: "sf",
    name: "San Francisco",
    country: "USA",
    lat: 37.77,
    lng: -122.42,
    timeZone: "America/Los_Angeles",
    note: "Partners · 5 people",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    lat: 35.68,
    lng: 139.69,
    timeZone: "Asia/Tokyo",
    note: "Support · 6 people",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    lat: -33.87,
    lng: 151.21,
    timeZone: "Australia/Sydney",
    note: "Contractors · 3 people",
  },
  {
    id: "sao",
    name: "São Paulo",
    country: "Brazil",
    lat: -23.55,
    lng: -46.63,
    timeZone: "America/Sao_Paulo",
    note: "Community · 4 people",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    lat: 25.2,
    lng: 55.27,
    timeZone: "Asia/Dubai",
    note: "Clients · 9 accounts",
  },
];

const PALETTES = [
  { name: "Amber sun", value: "#fcd34d" },
  { name: "Peach", value: "#fdba74" },
  { name: "Mint", value: "#6ee7b7" },
  { name: "Sky", value: "#7dd3fc" },
] as const;

export function DayNightMapPlayground() {
  const [dayColor, setDayColor] = useState<string>(PALETTES[0].value);
  const [showControls, setShowControls] = useState(true);
  const [showList, setShowList] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-4xl flex-col gap-3">
          <DayNightMap
            locations={LOCATIONS}
            defaultSelectedId="dhaka"
            dayColor={dayColor}
            showControls={showControls}
            showList={showList}
            onSelect={(loc) => setPicked(loc.name)}
          />
          <p className="font-mono text-[11px] text-fg-muted">
            {picked ? `onSelect → ${picked}` : "Hover or click a city. Press play to watch a full day pass."}
          </p>
        </div>
      }
      controls={
        <>
          <ColorSwatches label="Daylight color" options={PALETTES} value={dayColor} onChange={setDayColor} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Time controls" checked={showControls} onChange={setShowControls} />
            <Toggle label="Location list" checked={showList} onChange={setShowList} />
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            The night line comes from the real position of the sun, so it matches the actual time of day and the season.
          </p>
        </>
      }
    />
  );
}

export function DayNightMapStates() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Map only (no controls or list)">
        <DayNightMap
          locations={LOCATIONS.slice(0, 4)}
          showControls={false}
          showList={false}
          title="Our studios"
          description="Where the team is right now."
        />
      </StateTile>
      <StateTile label="Mint daylight · Tokyo selected">
        <DayNightMap
          locations={LOCATIONS}
          dayColor="#6ee7b7"
          defaultSelectedId="tokyo"
          showList={false}
          title="Support coverage"
          description="Which desks are awake."
        />
      </StateTile>
    </div>
  );
}

export function DayNightMapCard() {
  return (
    <div className="w-72">
      <DayNightMap
        locations={LOCATIONS.slice(0, 5)}
        showControls={false}
        showList={false}
        title="Around the world"
        description=""
        className="!rounded-2xl !p-3 [&_header]:hidden [&>div.relative]:!mt-0"
      />
    </div>
  );
}
