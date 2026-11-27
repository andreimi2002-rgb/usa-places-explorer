import { geoAlbersUsa, geoMercator, geoPath, type GeoProjection } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type Props = { slug: string; name: string };

export type MapPoint = { lat: number; lon: number; label: string; href?: string; emphasis?: boolean };

/**
 * Server-rendered SVG map from real Census cartographic boundaries.
 * No tile server is used (no licensing ambiguity, works offline); every
 * polygon links to its place page. Points are drawn only from sourced
 * coordinates (Census Gazetteer internal points), never estimated ones.
 */
export function AreaMap({
  collection,
  projection = "mercator",
  fitSlug,
  fitFeature,
  highlight = [],
  activeSlugs,
  points = [],
  overlay = [],
  width = 640,
  height = 520,
  title,
  attribution,
}: {
  collection: FeatureCollection<Geometry, Props>;
  projection?: "mercator" | "albers-usa";
  fitSlug?: string;
  /** Fit the view to an arbitrary feature (e.g. a city boundary) instead of a collection member. */
  fitFeature?: Feature<Geometry, Props>;
  highlight?: string[];
  activeSlugs?: string[];
  points?: MapPoint[];
  /** Place boundaries drawn above the base layer (highlighted ones in gold). */
  overlay?: Feature<Geometry, Props>[];
  width?: number;
  height?: number;
  title: string;
  attribution: string;
}) {
  const pad = 12;
  const fitTarget: FeatureCollection | Feature =
    fitFeature ?? ((fitSlug && collection.features.find((f) => f.properties.slug === fitSlug)) || collection);
  const proj: GeoProjection = (projection === "albers-usa" ? geoAlbersUsa() : geoMercator()).fitExtent(
    [
      [pad, pad],
      [width - pad, height - pad],
    ],
    fitTarget,
  );
  const path = geoPath(proj);
  const hl = new Set(highlight);
  const active = activeSlugs ? new Set(activeSlugs) : null;

  return (
    <figure className="card overflow-hidden" data-testid="area-map">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="block h-auto w-full bg-navy-900">
        <title>{title}</title>
        {collection.features.map((f) => {
          const d = path(f);
          if (!d) return null;
          const isHl = hl.has(f.properties.slug);
          const isActive = !active || active.has(f.properties.slug);
          return (
            <a key={f.properties.slug} href={`/places/${f.properties.slug}`} aria-label={f.properties.name}>
              <path
                d={d}
                className={`transition-colors ${isHl ? "fill-gold/35 stroke-gold" : isActive ? "fill-navy-700 stroke-line-strong hover:fill-navy-800" : "fill-navy-850 stroke-line hover:fill-navy-800"}`}
                strokeWidth={isHl ? 1.6 : 0.6}
                vectorEffect="non-scaling-stroke"
              >
                <title>{f.properties.name}</title>
              </path>
            </a>
          );
        })}
        {overlay.map((f) => {
          const d = path(f);
          if (!d) return null;
          const isHl = hl.has(f.properties.slug);
          return (
            <a key={`o-${f.properties.slug}`} href={`/places/${f.properties.slug}`} aria-label={f.properties.name}>
              <path d={d} className={isHl ? "fill-gold/45 stroke-gold" : "fill-mint/15 stroke-mint/70 hover:fill-mint/30"} strokeWidth={isHl ? 1.6 : 0.7} vectorEffect="non-scaling-stroke">
                <title>{f.properties.name}</title>
              </path>
            </a>
          );
        })}
        {points.map((p) => {
          const xy = proj([p.lon, p.lat]);
          if (!xy) return null;
          const dot = (
            <g key={`${p.label}-${p.lat}`}>
              <circle cx={xy[0]} cy={xy[1]} r={p.emphasis ? 6 : 3.5} className={p.emphasis ? "fill-gold stroke-navy-950" : "fill-mint stroke-navy-950"} strokeWidth={1.5} />
              {p.emphasis && (
                <text x={xy[0] + 9} y={xy[1] + 4} className="fill-ink text-[13px] font-semibold" style={{ paintOrder: "stroke", stroke: "#070f18", strokeWidth: 3 }}>
                  {p.label}
                </text>
              )}
              <title>{p.label}</title>
            </g>
          );
          return p.href ? (
            <a key={`${p.label}-${p.lat}`} href={p.href} aria-label={p.label}>
              {dot}
            </a>
          ) : (
            dot
          );
        })}
      </svg>
      <figcaption className="border-t border-line px-4 py-2 text-[11px] text-muted">{attribution}</figcaption>
    </figure>
  );
}
