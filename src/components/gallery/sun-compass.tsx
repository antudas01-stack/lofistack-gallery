"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

export interface SunLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** IANA time zone used to show local times, e.g. "Asia/Dhaka". */
  timeZone: string;
}

export interface SunInfo {
  time: number;
  /** Compass direction of the sun, degrees clockwise from north. */
  azimuth: number;
  /** Height of the sun above the horizon in degrees (negative = below). */
  altitude: number;
  sunrise: number | null;
  sunset: number | null;
}

export interface SunCompassProps {
  title?: string;
  /** Places the user can switch between. */
  locations?: SunLocation[];
  defaultLocationId?: string;
  /** A fixed moment to show (ms or Date). Leave out for a live clock. */
  date?: number | Date;
  /** Time-of-day slider and Now button. */
  showControls?: boolean;
  /** "Use my location" button (browser geolocation). */
  allowGeolocation?: boolean;
  /** On phones, offer to rotate the dial with the device's real compass. */
  allowDeviceCompass?: boolean;
  onChange?: (info: SunInfo) => void;
  className?: string;
}

const DEFAULT_LOCATIONS: SunLocation[] = [
  { id: "dhaka", name: "Dhaka", latitude: 23.81, longitude: 90.41, timeZone: "Asia/Dhaka" },
  { id: "london", name: "London", latitude: 51.51, longitude: -0.13, timeZone: "Europe/London" },
  { id: "new-york", name: "New York", latitude: 40.71, longitude: -74.01, timeZone: "America/New_York" },
  { id: "tokyo", name: "Tokyo", latitude: 35.68, longitude: 139.69, timeZone: "Asia/Tokyo" },
  { id: "sydney", name: "Sydney", latitude: -33.87, longitude: 151.21, timeZone: "Australia/Sydney" },
];

const DEG = Math.PI / 180;
const MINUTE = 60_000;
const HORIZON = -0.833; // sun's upper edge on the horizon, allowing for refraction
const C = 180; // dial centre in SVG units
const R = 118; // horizon ring radius
const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const compassPoint = (azimuth: number) => POINTS[Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16];

/** Where the sun is directly overhead (NOAA low-precision formulas, good to about half a degree). */
function subsolarPoint(ms: number) {
  const d = ms / 86_400_000 - 10957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const e = (23.439 - 0.00000036 * d) * DEG;
  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG / 15;
  const declination = Math.asin(Math.sin(e) * Math.sin(L)) / DEG;
  let equationOfTime = q / 15 - rightAscension; // hours
  equationOfTime = ((((equationOfTime + 12) % 24) + 24) % 24) - 12;
  const utcHours = (((ms % 86_400_000) + 86_400_000) % 86_400_000) / 3_600_000;
  let longitude = -15 * (utcHours - 12 + equationOfTime);
  longitude = ((((longitude + 180) % 360) + 360) % 360) - 180;
  return { latitude: declination, longitude };
}

/** Direction (azimuth, clockwise from north) and height (altitude) of the sun for an observer. */
export function sunPosition(ms: number, latitude: number, longitude: number) {
  const sun = subsolarPoint(ms);
  const hourAngle = (longitude - sun.longitude) * DEG; // positive in the afternoon
  const lat = latitude * DEG;
  const dec = sun.latitude * DEG;
  const east = -Math.cos(dec) * Math.sin(hourAngle);
  const north = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.cos(hourAngle) * Math.sin(lat);
  const up = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(hourAngle) * Math.cos(lat);
  return {
    azimuth: (((Math.atan2(east, north) / DEG) % 360) + 360) % 360,
    altitude: Math.asin(clamp(up, -1, 1)) / DEG,
  };
}

/** Sunrise, sunset, solar noon and the sun's path for the 24 hours starting at dayStart. */
export function sunDay(dayStart: number, latitude: number, longitude: number) {
  const STEP = 2 * MINUTE;
  const path: Array<{ time: number; azimuth: number; altitude: number }> = [];
  let sunrise: number | null = null;
  let sunset: number | null = null;
  let noon = { time: dayStart, azimuth: 0, altitude: -90 };
  for (let time = dayStart; time <= dayStart + 24 * 60 * MINUTE; time += STEP) {
    const point = { time, ...sunPosition(time, latitude, longitude) };
    const previous = path[path.length - 1];
    if (previous) {
      const crossing = previous.time + ((HORIZON - previous.altitude) / (point.altitude - previous.altitude)) * STEP;
      if (previous.altitude < HORIZON && point.altitude >= HORIZON && sunrise === null) sunrise = crossing;
      if (previous.altitude >= HORIZON && point.altitude < HORIZON && sunset === null) sunset = crossing;
    }
    if (point.altitude > noon.altitude) noon = point;
    path.push(point);
  }
  return { sunrise, sunset, noon, path };
}

// Shared clock (30 s). null on the server so the first client render matches.
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;
function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) clockTimer = setInterval(() => clockListeners.forEach((l) => l()), 30_000);
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}
const readClock = () => Math.floor(Date.now() / 30_000) * 30_000;

const subscribeNothing = () => () => {};
const hasDeviceCompass = () => "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches;

function durationText(ms: number) {
  const minutes = Math.max(0, Math.round(ms / MINUTE));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

// Rounded so the server and the browser print exactly the same numbers.
const round2 = (n: number) => Math.round(n * 100) / 100;
const onRim = (azimuth: number, radius: number) =>
  [round2(C + radius * Math.sin(azimuth * DEG)), round2(C - radius * Math.cos(azimuth * DEG))] as const;
/** Centre = straight overhead, ring = horizon. */
const onSky = (azimuth: number, altitude: number) => onRim(azimuth, R * (1 - clamp(altitude, 0, 90) / 90));

export function SunCompass({
  title = "Sun compass",
  locations = DEFAULT_LOCATIONS,
  defaultLocationId,
  date,
  showControls = true,
  allowGeolocation = true,
  allowDeviceCompass = true,
  onChange,
  className,
}: SunCompassProps) {
  const uid = useId();
  const fixedTime = date === undefined ? null : typeof date === "number" ? date : date.getTime();
  const liveNow = useSyncExternalStore(subscribeClock, readClock, () => null);
  const baseTime = fixedTime ?? liveNow;

  const [locationId, setLocationId] = useState(defaultLocationId ?? locations[0]?.id);
  const [myLocation, setMyLocation] = useState<SunLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** Minutes after local midnight chosen with the slider. null = follow the clock. */
  const [scrub, setScrub] = useState<number | null>(null);
  const [compassOn, setCompassOn] = useState(false);
  /** Continuous dial rotation in degrees (so it never spins the long way round). */
  const [rotation, setRotation] = useState(0);

  const compassAvailable = useSyncExternalStore(subscribeNothing, hasDeviceCompass, () => false);
  const place = (locationId === "me" ? myLocation : locations.find((l) => l.id === locationId)) ?? locations[0];

  const formats = useMemo(() => {
    const timeZone = place?.timeZone ?? "UTC";
    return {
      clock: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }),
      day: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone }),
      parts: new Intl.DateTimeFormat("en-US", {
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone,
      }),
    };
  }, [place?.timeZone]);

  // Midnight at the place, for the day that contains baseTime.
  const dayStart = useMemo(() => {
    if (baseTime === null) return null;
    const get = (type: string) =>
      Number(formats.parts.formatToParts(baseTime).find((p) => p.type === type)?.value ?? 0);
    return Math.floor(baseTime / 1000) * 1000 - ((get("hour") * 60 + get("minute")) * 60 + get("second")) * 1000;
  }, [baseTime, formats]);

  const day = useMemo(
    () => (dayStart === null || !place ? null : sunDay(dayStart, place.latitude, place.longitude)),
    [dayStart, place],
  );

  const time = baseTime === null || dayStart === null ? null : scrub === null ? baseTime : dayStart + scrub * MINUTE;
  const sun = useMemo(
    () => (time === null || !place ? null : sunPosition(time, place.latitude, place.longitude)),
    [time, place],
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    if (time !== null && sun && day) onChangeRef.current?.({ time, ...sun, sunrise: day.sunrise, sunset: day.sunset });
  }, [time, sun, day]);

  // Real compass heading from the phone's sensor.
  useEffect(() => {
    if (!compassOn) return;
    const onOrientation = (event: DeviceOrientationEvent) => {
      const ios = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      const heading = typeof ios === "number" ? ios : event.absolute && event.alpha !== null ? 360 - event.alpha : null;
      if (heading === null) return;
      setRotation((current) => {
        const delta = ((((-heading - current) % 360) + 540) % 360) - 180;
        return current + delta;
      });
    };
    window.addEventListener("deviceorientationabsolute", onOrientation as EventListener);
    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation as EventListener);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [compassOn]);

  const toggleCompass = async () => {
    if (compassOn) {
      setCompassOn(false);
      setRotation(0);
      return;
    }
    try {
      const request = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission;
      if (typeof request === "function" && (await request()) !== "granted") {
        setNotice("Compass access was not allowed.");
        return;
      }
      setNotice(null);
      setCompassOn(true);
    } catch {
      setNotice("This device's compass couldn't be started.");
    }
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setNotice("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          id: "me",
          name: "My location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setLocationId("me");
        setLocating(false);
        setNotice(null);
      },
      (error) => {
        setLocating(false);
        setNotice(error.code === 1 ? "Location permission was denied." : "Your location couldn't be found.");
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const up = sun ? sun.altitude >= HORIZON : false;
  const phase = !sun ? "night" : sun.altitude > 6 ? "day" : sun.altitude > -6 ? "twilight" : "night";
  const sky = {
    day: ["#60a5fa", "#1e3a8a"],
    twilight: ["#fb923c", "#4c1d95"],
    night: ["#1e293b", "#020617"],
  }[phase];

  const clock = (ms: number | null) => (ms === null ? "--:--" : formats.clock.format(ms));
  const sunXY = sun ? onSky(sun.azimuth, sun.altitude) : null;
  const shadowLength = sun && sun.altitude > 1 ? 1 / Math.tan(sun.altitude * DEG) : null;

  // Daytime part of the path, as one or more SVG sub-paths.
  const pathD = useMemo(() => {
    if (!day) return "";
    let d = "";
    let drawing = false;
    for (const p of day.path) {
      if (p.altitude < HORIZON) {
        drawing = false;
        continue;
      }
      const [x, y] = onSky(p.azimuth, p.altitude);
      d += `${drawing ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      drawing = true;
    }
    return d;
  }, [day]);

  const hours = useMemo(() => {
    if (!day || dayStart === null || !place) return [];
    return Array.from({ length: 24 }, (_, hour) => {
      const p = sunPosition(dayStart + hour * 60 * MINUTE, place.latitude, place.longitude);
      return { hour, ...p };
    }).filter((h) => h.altitude > 2);
  }, [day, dayStart, place]);

  let status = "";
  if (time !== null && day && sun) {
    if (day.sunrise === null && day.sunset === null)
      status = day.noon.altitude > HORIZON ? "The sun stays up all day" : "The sun stays below the horizon today";
    else if (day.sunrise !== null && time < day.sunrise) status = `Sunrise in ${durationText(day.sunrise - time)}`;
    else if (day.sunset !== null && time < day.sunset) status = `${durationText(day.sunset - time)} of daylight left`;
    else status = "The sun has set";
  }
  const dayLength =
    day && day.sunrise !== null && day.sunset !== null ? durationText(day.sunset - day.sunrise) : day ? "—" : "--";

  const sliderValue = scrub ?? (time !== null && dayStart !== null ? Math.floor((time - dayStart) / MINUTE) : 720);
  const chip = (selected: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95",
      selected
        ? "bg-amber-300 text-slate-950 ring-amber-300"
        : "bg-white/5 text-slate-200 ring-white/15 hover:bg-white/10",
    );

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={cn(
        "@container relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#070b18] p-5 text-slate-100 ring-1 ring-white/10 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-200/80 uppercase">
            {place?.name ?? ""} · {time === null ? "" : formats.day.format(time)}
          </p>
          <h2 id={`${uid}-title`} className="mt-1 text-2xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        <p className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-slate-200 tabular-nums ring-1 ring-white/10">
          {clock(time)}
          {scrub === null && fixedTime === null ? " · live" : ""}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-6 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Dial */}
        <svg
          viewBox="8 8 344 344"
          role="img"
          aria-label={
            sun
              ? `Sun compass for ${place?.name}. The sun is at ${Math.round(sun.azimuth)} degrees, ${compassPoint(sun.azimuth)}, ${up ? `${Math.round(sun.altitude)} degrees above the horizon` : "below the horizon"}.`
              : "Sun compass"
          }
          className="mx-auto w-full max-w-[26rem]"
        >
          <defs>
            <radialGradient id={`${uid}-sky`}>
              <stop offset="0%" stopColor={sky[0]} />
              <stop offset="100%" stopColor={sky[1]} />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${C}px ${C}px`,
              transition: compassOn ? "transform 200ms linear" : "transform 500ms ease",
            }}
          >
            <circle cx={C} cy={C} r={R + 30} fill="rgb(255 255 255 / 0.03)" stroke="rgb(255 255 255 / 0.1)" />
            <circle cx={C} cy={C} r={R} fill={`url(#${uid}-sky)`} stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.5" />
            {[30, 60].map((altitude) => (
              <g key={altitude}>
                <circle
                  cx={C}
                  cy={C}
                  r={R * (1 - altitude / 90)}
                  fill="none"
                  stroke="rgb(255 255 255 / 0.16)"
                  strokeDasharray="2 4"
                />
                <text x={C + 3} y={C - R * (1 - altitude / 90) - 3} fontSize="8" fill="rgb(255 255 255 / 0.5)">
                  {altitude}°
                </text>
              </g>
            ))}

            {Array.from({ length: 36 }, (_, i) => {
              const azimuth = i * 10;
              const [x1, y1] = onRim(azimuth, R);
              const [x2, y2] = onRim(azimuth, R + (azimuth % 30 === 0 ? 8 : 4));
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgb(255 255 255 / 0.45)"
                  strokeWidth={azimuth % 90 === 0 ? 2 : 1}
                />
              );
            })}
            {(
              [
                ["N", 0],
                ["E", 90],
                ["S", 180],
                ["W", 270],
              ] as const
            ).map(([letter, azimuth]) => {
              const [x, y] = onRim(azimuth, R + 20);
              return (
                <text
                  key={letter}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="15"
                  fontWeight="700"
                  fill={letter === "N" ? "#fca5a5" : "#e2e8f0"}
                >
                  {letter}
                </text>
              );
            })}

            {/* Today's path across the sky */}
            <path
              d={pathD}
              fill="none"
              stroke="#fde68a"
              strokeWidth="6"
              strokeOpacity="0.35"
              filter={`url(#${uid}-glow)`}
            />
            <path d={pathD} fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" />
            {hours.map((h) => {
              const [x, y] = onSky(h.azimuth, h.altitude);
              const [lx, ly] = onSky(h.azimuth, h.altitude + 9);
              return (
                <g key={h.hour}>
                  <circle cx={x} cy={y} r="2" fill="#fef3c7" />
                  {h.hour % 3 === 0 && (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8.5"
                      fill="rgb(255 255 255 / 0.8)"
                    >
                      {h.hour === 12 ? "12p" : h.hour < 12 ? `${h.hour}a` : `${h.hour - 12}p`}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Sunrise and sunset on the horizon ring */}
            {day &&
              (
                [
                  ["Sunrise", day.sunrise],
                  ["Sunset", day.sunset],
                ] as const
              ).map(([name, at]) => {
                if (at === null || !place) return null;
                const azimuth = sunPosition(at, place.latitude, place.longitude).azimuth;
                const [x, y] = onRim(azimuth, R);
                const [tx, ty] = onRim(azimuth, R + 40);
                return (
                  <g key={name}>
                    <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="#070b18" strokeWidth="1.5" />
                    <text
                      x={clamp(tx, 34, 326)}
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="#fcd34d"
                    >
                      {name === "Sunrise" ? "↑" : "↓"} {clock(at)}
                    </text>
                  </g>
                );
              })}

            {/* Shadow of a stick at the centre, and the sun itself */}
            {sun && sunXY && up && shadowLength !== null && (
              <line
                x1={C}
                y1={C}
                x2={onRim(sun.azimuth + 180, clamp(shadowLength * 18, 8, R - 8))[0]}
                y2={onRim(sun.azimuth + 180, clamp(shadowLength * 18, 8, R - 8))[1]}
                stroke="rgb(2 6 23 / 0.55)"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
            {sun && sunXY && (
              <g opacity={up ? 1 : 0.45}>
                <line
                  x1={C}
                  y1={C}
                  x2={sunXY[0]}
                  y2={sunXY[1]}
                  stroke="#fde68a"
                  strokeOpacity="0.6"
                  strokeDasharray="3 4"
                />
                <circle cx={sunXY[0]} cy={sunXY[1]} r="16" fill="#fbbf24" opacity="0.5" filter={`url(#${uid}-glow)`} />
                <circle
                  cx={sunXY[0]}
                  cy={sunXY[1]}
                  r="8"
                  fill={up ? "#fde047" : "#94a3b8"}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </g>
            )}
            <circle cx={C} cy={C} r="3.5" fill="#fff" />
          </g>
        </svg>

        {/* Readouts */}
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">The sun is now</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
              {sun ? `${Math.round(sun.azimuth)}° ${compassPoint(sun.azimuth)}` : "--"}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {sun
                ? up
                  ? `${Math.round(sun.altitude)}° above the horizon`
                  : `${Math.abs(Math.round(sun.altitude))}° below the horizon`
                : " "}
              {status && <span className="text-amber-200"> · {status}</span>}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[
              [
                "Sunrise",
                day ? (day.sunrise === null ? "—" : clock(day.sunrise)) : "--",
                day?.sunrise != null && place
                  ? `${compassPoint(sunPosition(day.sunrise, place.latitude, place.longitude).azimuth)}`
                  : "",
              ],
              [
                "Sunset",
                day ? (day.sunset === null ? "—" : clock(day.sunset)) : "--",
                day?.sunset != null && place
                  ? `${compassPoint(sunPosition(day.sunset, place.latitude, place.longitude).azimuth)}`
                  : "",
              ],
              [
                "Highest point",
                day ? clock(day.noon.time) : "--",
                day ? `${Math.abs(Math.round(day.noon.altitude))}° ${day.noon.altitude >= 0 ? "high" : "below"}` : "",
              ],
              ["Day length", dayLength, ""],
              [
                "Shadows point",
                sun && up ? compassPoint(sun.azimuth + 180) : "—",
                shadowLength !== null && up ? `${shadowLength.toFixed(1)}× height` : "",
              ],
              [
                "Coordinates",
                place ? `${Math.abs(place.latitude).toFixed(2)}°${place.latitude >= 0 ? "N" : "S"}` : "--",
                place ? `${Math.abs(place.longitude).toFixed(2)}°${place.longitude >= 0 ? "E" : "W"}` : "",
              ],
            ].map(([term, value, extra]) => (
              <div key={term} className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
                <dt className="text-[11px] text-slate-400">{term}</dt>
                <dd className="font-semibold tabular-nums">
                  {value}
                  {extra && <span className="ml-1.5 text-xs font-normal text-slate-400">{extra}</span>}
                </dd>
              </div>
            ))}
          </dl>

          <div>
            <div role="radiogroup" aria-label="Location" className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={locationId === l.id}
                  onClick={() => setLocationId(l.id)}
                  className={chip(locationId === l.id)}
                >
                  {l.name}
                </button>
              ))}
              {allowGeolocation && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={locationId === "me"}
                  onClick={locate}
                  disabled={locating}
                  className={cn(chip(locationId === "me"), "disabled:opacity-60")}
                >
                  {locating ? "Finding you…" : "◎ My location"}
                </button>
              )}
            </div>
            {allowDeviceCompass && compassAvailable && (
              <button
                type="button"
                aria-pressed={compassOn}
                onClick={toggleCompass}
                className={cn(chip(compassOn), "mt-2")}
              >
                {compassOn ? "Phone compass on: hold it flat" : "Use phone compass"}
              </button>
            )}
            {notice && (
              <p role="alert" className="mt-2 text-xs text-rose-300">
                {notice}
              </p>
            )}
          </div>
        </div>
      </div>

      {showControls && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="flex min-w-48 flex-1 items-center gap-3 text-xs text-slate-400">
            <span className="shrink-0">Time of day</span>
            <input
              type="range"
              min={0}
              max={1439}
              step={5}
              value={sliderValue}
              disabled={time === null}
              onChange={(event) => setScrub(Number(event.target.value))}
              aria-valuetext={clock(time)}
              className="h-1.5 w-full cursor-pointer accent-amber-300"
            />
            <span className="w-16 shrink-0 text-right font-mono text-slate-200 tabular-nums">{clock(time)}</span>
          </label>
          <button
            type="button"
            onClick={() => setScrub(null)}
            disabled={scrub === null}
            className="rounded-full px-3.5 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/15 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40"
          >
            {fixedTime === null ? "Now" : "Reset"}
          </button>
        </div>
      )}
    </section>
  );
}
