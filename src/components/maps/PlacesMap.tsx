import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router';
import { getCategoryForPlace, getLocality, getPlaceTypeById } from '../../lib/data-access';
import type { Place } from '../../types';
import { categoryColor } from './category-colors';

export interface PlacesMapProps {
  places: Place[];
  center: { lat: number; lng: number; zoom: number };
  /** Accessible name for the map region. */
  label: string;
  className?: string;
}

/**
 * An OpenStreetMap map with one dot per place, colored by category.
 * Only places with verified coordinates are drawn. Loaded lazily so Leaflet
 * stays out of the main bundle.
 */
export default function PlacesMap({ places, center, label, className = 'h-[420px] md:h-[520px]' }: PlacesMapProps) {
  const mappable = places.filter((p) => p.lat !== null && p.lng !== null);
  return (
    <div role="region" aria-label={label} className={`overflow-hidden rounded border border-line ${className}`}>
      <MapContainer center={[center.lat, center.lng]} zoom={center.zoom} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((p) => {
          const category = getCategoryForPlace(p);
          const type = getPlaceTypeById(p.placeTypeId);
          const full = p.profile !== 'basic';
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat!, p.lng!]}
              radius={full ? 8 : 6}
              pathOptions={{
                color: '#ffffff',
                weight: full ? 2 : 1,
                fillColor: categoryColor(category?.id),
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <span className="block text-caption font-semibold uppercase tracking-wider text-gold-ink">{type?.name}</span>
                <Link to={`/places/${p.slug}`} className="mt-1 block text-small font-semibold text-navy-700 hover:underline">
                  {p.name}
                </Link>
                <span className="block text-caption text-ink-muted">{getLocality(p)}</span>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
