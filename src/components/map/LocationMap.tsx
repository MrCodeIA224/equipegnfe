'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletIcons';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  height?: number;
  zoom?: number;
}

export default function LocationMap({ latitude, longitude, label, height = 220, zoom = 15 }: LocationMapProps) {
  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[latitude, longitude]}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
