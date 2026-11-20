import { divIcon } from 'leaflet';

/**
 * Creates a Leaflet divIcon backed by a real DOM element (using textContent
 * rather than HTML strings) so markers remain compatible with Trusted Types.
 */
export function createPinDivIcon({
  color,
  label,
  className = 'custom-map-pin',
  iconSize = [60, 24],
  iconAnchor = [30, 12],
  popupAnchor = [0, -12],
  style = '',
}) {
  const el = document.createElement('div');
  el.textContent = label;
  el.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: ${color};
    color: white;
    border: 2px solid white;
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
    white-space: nowrap;
    ${style}
  `;
  return divIcon({
    className,
    html: el,
    iconSize,
    iconAnchor,
    popupAnchor,
  });
}

export function createDotDivIcon(color) {
  const el = document.createElement('div');
  el.style.cssText = `
    background-color: ${color};
    width: 14px;
    height: 14px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  return divIcon({
    html: el,
    className: '',
    iconSize: [14, 14],
  });
}
