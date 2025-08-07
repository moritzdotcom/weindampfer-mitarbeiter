'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for missing marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

type Props = {
  shift: {
    clockInLat: number | null;
    clockInLon: number | null;
    clockOutLat: number | null;
    clockOutLon: number | null;
  };
};

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

export default function LocationMap({ shift }: Props) {
  const positions: [number, number][] = [];

  if (shift.clockInLat && shift.clockInLon) {
    positions.push([shift.clockInLat, shift.clockInLon]);
  }
  if (shift.clockOutLat && shift.clockOutLon) {
    positions.push([shift.clockOutLat, shift.clockOutLon]);
  }

  if (positions.length === 0) {
    return <p className="text-gray-400">Keine Standortdaten verfügbar.</p>;
  }

  const bounds = L.latLngBounds(positions);

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      style={{ height: 300, borderRadius: '1rem' }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      <FitBounds bounds={bounds} />

      {shift.clockInLat && shift.clockInLon && (
        <Marker position={[shift.clockInLat, shift.clockInLon]}>
          <Popup>Check-In</Popup>
        </Marker>
      )}
      {shift.clockOutLat && shift.clockOutLon && (
        <Marker position={[shift.clockOutLat, shift.clockOutLon]}>
          <Popup>Check-Out</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
