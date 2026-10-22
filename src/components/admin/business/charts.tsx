import type { ReactNode } from "react";
import { compactMoney } from "@/lib/business/present";
import type { GroupPoint, Point, Rank } from "@/lib/business/types";

const GOLD = "#c9a14a";
const TEAK = "#6b4226";
const INK = "#3b3532";
const SAND = "#e5d9c3";

function ChartFrame({ label, children, height = 240 }: { label: string; children: ReactNode; height?: number }) {
  return (
    <div>
      <svg viewBox={`0 0 640 ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        {children}
      </svg>
    </div>
  );
}

export function ColumnChart({
  points,
  label,
  format = compactMoney,
}: {
  points: Point[];
  label: string;
  format?: (value: number) => string;
}) {
  const width = 640;
  const height = 240;
  const padL = 46;
  const padR = 8;
  const padT = 16;
  const padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...points.map((point) => point.value), 1);
  const gap = points.length > 20 ? 2 : 6;
  const barW = Math.max(1, (innerW - gap * Math.max(points.length - 1, 0)) / Math.max(points.length, 1));
  const ticks = 4;
  return (
    <ChartFrame label={label}>
      {Array.from({ length: ticks + 1 }, (_, index) => {
        const value = (max / ticks) * index;
        const y = padT + innerH - (value / max) * innerH;
        return (
          <g key={index}>
            <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={SAND} />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill={INK}>
              {format(value)}
            </text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const h = (point.value / max) * innerH;
        const x = padL + index * (barW + gap);
        const y = padT + innerH - h;
        const showLabel = points.length <= 14 || index % Math.ceil(points.length / 8) === 0;
        return (
          <g key={`${point.label}-${index}`}>
            <rect x={x} y={point.value > 0 ? y : padT + innerH - 1} width={barW} height={Math.max(h, point.value > 0 ? 2 : 1)} rx="2" fill={point.muted ? SAND : GOLD}>
              <title>{point.title ?? `${point.label}: ${format(point.value)}`}</title>
            </rect>
            {showLabel ? (
              <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize="10" fill={INK}>
                {point.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </ChartFrame>
  );
}

export function GroupedColumnChart({
  points,
  label,
  currentName,
  previousName,
  format = compactMoney,
}: {
  points: GroupPoint[];
  label: string;
  currentName: string;
  previousName: string;
  format?: (value: number) => string;
}) {
  const width = 640;
  const height = 250;
  const padL = 46;
  const padR = 8;
  const padT = 16;
  const padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...points.flatMap((point) => [point.current ?? 0, point.previous]), 1);
  const groupW = innerW / Math.max(points.length, 1);
  const barW = Math.min(16, groupW / 3);
  return (
    <div>
      <ChartFrame label={label} height={250}>
        {[0, 1, 2, 3, 4].map((index) => {
          const value = (max / 4) * index;
          const y = padT + innerH - (index / 4) * innerH;
          return (
            <g key={index}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={SAND} />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill={INK}>
                {format(value)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const x = padL + index * groupW + groupW / 2;
          const prevH = (point.previous / max) * innerH;
          const currH = point.current == null ? 0 : (point.current / max) * innerH;
          return (
            <g key={point.label}>
              <rect x={x - barW - 1} y={padT + innerH - prevH} width={barW} height={Math.max(prevH, point.previous > 0 ? 2 : 0)} rx="2" fill={TEAK}>
                <title>{`${previousName} ${point.label}: ${format(point.previous)}`}</title>
              </rect>
              {point.current != null ? (
                <rect x={x + 1} y={padT + innerH - currH} width={barW} height={Math.max(currH, point.current > 0 ? 2 : 0)} rx="2" fill={GOLD}>
                  <title>{`${currentName} ${point.label}: ${format(point.current)}`}</title>
                </rect>
              ) : null}
              <text x={x} y={height - 12} textAnchor="middle" fontSize="10" fill={INK}>
                {point.label}
              </text>
            </g>
          );
        })}
      </ChartFrame>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-black/60">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-gold" aria-hidden="true" />{currentName}</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-teak" aria-hidden="true" />{previousName}</span>
      </div>
    </div>
  );
}

export function LineChart({
  points,
  label,
  format = (value: number) => String(value),
}: {
  points: Point[];
  label: string;
  format?: (value: number) => string;
}) {
  const width = 640;
  const height = 240;
  const padL = 42;
  const padR = 12;
  const padT = 16;
  const padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const coords = points.map((point, index) => {
    const x = padL + index * step;
    const y = padT + innerH - (point.value / max) * innerH;
    return { ...point, x, y };
  });
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = coords.length ? `${line} L ${coords[coords.length - 1]!.x} ${padT + innerH} L ${coords[0]!.x} ${padT + innerH} Z` : "";
  return (
    <ChartFrame label={label}>
      <line x1={padL} x2={width - padR} y1={padT + innerH} y2={padT + innerH} stroke={SAND} />
      <path d={area} fill={GOLD} opacity="0.18" />
      <path d={line} fill="none" stroke={TEAK} strokeWidth="2.5" />
      {coords.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="3.5" fill={GOLD} stroke={TEAK}>
            <title>{point.title ?? `${point.label}: ${format(point.value)}`}</title>
          </circle>
          <text x={point.x} y={height - 10} textAnchor="middle" fontSize="10" fill={INK}>
            {point.label}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

export function RankBars({ rows, format }: { rows: Rank[]; format?: (value: number) => string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  if (!rows.length) return <p className="text-sm text-black/50">Nothing to rank yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row, index) => (
        <li key={`${row.name}-${index}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium" title={row.name}>
              <span className="mr-2 text-xs text-black/40">{index + 1}</span>
              {row.name}
            </span>
            <span className="shrink-0 text-black/55">{row.hint ?? format?.(row.value) ?? row.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-sand" aria-hidden="true">
            <div className="h-2 rounded-full bg-gold" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Donut({
  segments,
  label,
}: {
  segments: { name: string; value: number; color: string }[];
  label: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36" role="img" aria-label={label}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke={SAND} strokeWidth="16" />
        {total > 0
          ? segments.map((segment) => {
              const length = (segment.value / total) * circ;
              const dash = `${length} ${circ - length}`;
              const node = (
                <circle
                  key={segment.name}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="16"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                >
                  <title>{`${segment.name}: ${segment.value}`}</title>
                </circle>
              );
              offset += length;
              return node;
            })
          : null}
        <text x="70" y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d1b1a">
          {total ? `${Math.round(((segments[0]?.value ?? 0) / total) * 100)}%` : "—"}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.name} className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-sm" style={{ background: segment.color }} aria-hidden="true" />
            <span className="font-medium">{segment.name}</span>
            <span className="text-black/50">{segment.value.toLocaleString("en-GB")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
