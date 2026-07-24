import L from 'leaflet';

// Les icônes par défaut de Leaflet référencent des images via des chemins
// relatifs qui cassent sous un bundler (webpack/turbopack) : on les remplace
// par les mêmes assets servis depuis le CDN unpkg, résolus une seule fois.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const CONAKRY_CENTER: [number, number] = [9.535, -13.679];
