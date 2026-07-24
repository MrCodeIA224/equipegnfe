import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import MapPicker from '../MapPicker';

let capturedClickHandler: ((e: { latlng: { lat: number; lng: number } }) => void) | undefined;

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom }: { children: ReactNode; center: [number, number]; zoom: number }) => (
    <div data-testid="map-container" data-center={center.join(',')} data-zoom={zoom}>{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="marker" data-position={position.join(',')} />
  ),
  useMapEvents: (handlers: { click: (e: { latlng: { lat: number; lng: number } }) => void }) => {
    capturedClickHandler = handlers.click;
    return null;
  },
}));

vi.mock('@/lib/leafletIcons', () => ({ CONAKRY_CENTER: [9.535, -13.679] }));

describe('MapPicker', () => {
  it('centers on Conakry and shows no marker when no position is given', () => {
    render(<MapPicker onChange={() => {}} />);
    expect(screen.getByTestId('map-container')).toHaveAttribute('data-center', '9.535,-13.679');
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('centers on and shows the given position', () => {
    render(<MapPicker latitude={9.6} longitude={-13.7} onChange={() => {}} />);
    expect(screen.getByTestId('map-container')).toHaveAttribute('data-center', '9.6,-13.7');
    expect(screen.getByTestId('marker')).toHaveAttribute('data-position', '9.6,-13.7');
  });

  it('calls onChange with the clicked coordinates', () => {
    const onChange = vi.fn();
    render(<MapPicker onChange={onChange} />);

    capturedClickHandler?.({ latlng: { lat: 9.4, lng: -13.5 } });
    expect(onChange).toHaveBeenCalledWith(9.4, -13.5);
  });

  it('renders at the requested height', () => {
    const { container } = render(<MapPicker onChange={() => {}} height={400} />);
    expect(container.firstChild).toHaveStyle({ height: '400px' });
  });
});
