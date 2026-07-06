import { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteCoordinate } from '../types';

interface RouteMapProps {
  coordinates: RouteCoordinate[];
  originName: string;
  destinationName?: string;
}

const makeCircleIcon = (color: string) =>
  L.divIcon({
    html: `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });

const originIcon = makeCircleIcon('#16a34a');
const destIcon = makeCircleIcon('#dc2626');

export default function RouteMap({ coordinates, originName, destinationName }: RouteMapProps) {
  const positions = useMemo<[number, number][]>(
    () => coordinates.map((c) => [c.lat, c.lng]),
    [coordinates],
  );

  const bounds = useMemo(() => L.latLngBounds(positions), [positions]);

  const origin = positions[0];
  const destination = positions[positions.length - 1];

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '360px', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={false}
      className="route-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} color="#2563eb" weight={4} opacity={0.8} />
      <Marker position={origin} icon={originIcon}>
        <Popup>{originName}</Popup>
      </Marker>
      {destinationName && (
        <Marker position={destination} icon={destIcon}>
          <Popup>{destinationName}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
