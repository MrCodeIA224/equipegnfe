'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletIcons';
import { CONAKRY_CENTER } from '@/lib/leafletIcons';

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      // Le backend stocke les coordonnées en DecimalField(max_digits=9, decimal_places=6) :
      // la précision flottante brute de Leaflet (15+ décimales) dépasserait cette limite.
      onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

export default function MapPicker({ latitude, longitude, onChange, height = 300 }: MapPickerProps) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition ? [latitude, longitude] : CONAKRY_CENTER;

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-gray-300">
      <MapContainer center={center} zoom={hasPosition ? 15 : 12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {hasPosition && <Marker position={[latitude, longitude]} />}
        <ClickHandler onChange={onChange} />
      </MapContainer>
    </div>
  );
}
