import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet marker asset paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored div icons for clear categorization
const createCustomMarker = (type, isVerified) => {
  let bgColor = '#0284c7'; // default sky
  let symbol = '📍';

  if (type === 'Flood') {
    bgColor = '#0284c7';
    symbol = '🌊';
  } else if (type === 'Fire') {
    bgColor = '#e11d48';
    symbol = '🔥';
  } else if (type === 'Building Collapse') {
    bgColor = '#d97706';
    symbol = '🏚️';
  } else if (type === 'Medical Emergency') {
    bgColor = '#dc2626';
    symbol = '🚑';
  } else if (type === 'ResourceOffer' || type === 'Resource') {
    bgColor = '#0d9488';
    symbol = '📦';
  }

  const borderStyle = isVerified ? 'border: 2.5px solid #10b981;' : 'border: 2px dashed #f59e0b;';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.2);
        ${borderStyle}
        cursor: pointer;
        font-size: 15px;
        transition: transform 0.2s;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export default function InteractiveCrisisMap({
  incidents = [],
  resources = [],
  filterMode = 'ALL',
  onSelectIncident,
  onSelectResource,
  selectedId,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.545, 77.195],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const bounds = L.latLngBounds([]);
    let validMarkerCount = 0;

    // Process Incidents
    if (filterMode !== 'RESOURCES') {
      incidents.forEach((inc) => {
        const isVerified = inc.verificationStatus === 'VERIFIED';
        if (filterMode === 'VERIFIED' && !isVerified) return;
        if (filterMode === 'PENDING' && isVerified) return;

        const lat = inc.location?.coordinates?.lat;
        const lng = inc.location?.coordinates?.lng;

        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          validMarkerCount++;
          bounds.extend([lat, lng]);

          const marker = L.marker([lat, lng], {
            icon: createCustomMarker(inc.incidentType, isVerified),
          });

          const popupContent = document.createElement('div');
          popupContent.className = 'p-1 text-slate-800 text-xs';
          popupContent.innerHTML = `
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 3px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>${inc.incidentType} Emergency</span>
              ${inc.isSimulation ? '<span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 0 4px; border-radius: 3px; font-size: 9px; font-weight: 800;">SIMULATION</span>' : ''}
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 6px;">
              <span style="background-color: ${isVerified ? '#ecfdf5' : '#fef3c7'}; color: ${isVerified ? '#065f46' : '#92400e'}; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
                ${isVerified ? 'VERIFIED' : 'PENDING'}
              </span>
              <span style="background-color: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
                ${inc.urgency || 'HIGH'}
              </span>
            </div>
            <p style="margin: 0 0 6px 0; color: #334155; line-height: 1.3;">${inc.description ? inc.description.slice(0, 110) + '...' : ''}</p>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
              📍 ${inc.location?.address || 'Location on map'}
            </div>
          `;

          const actionBtn = document.createElement('button');
          actionBtn.style.cssText =
            'background: #0f766e; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; width: 100%;';
          actionBtn.innerText = 'Inspect in Command Center';
          actionBtn.onclick = () => {
            if (onSelectIncident) onSelectIncident(inc);
          };
          popupContent.appendChild(actionBtn);

          marker.bindPopup(popupContent);
          markersLayer.addLayer(marker);

          if (selectedId && selectedId === inc._id) {
            marker.openPopup();
          }
        }
      });
    }

    // Process Resources
    if (filterMode !== 'INCIDENTS') {
      resources.forEach((res) => {
        const isVerified = res.verificationStatus === 'VERIFIED';
        if (filterMode === 'VERIFIED' && !isVerified) return;
        if (filterMode === 'PENDING' && isVerified) return;

        const lat = res.location?.coordinates?.lat;
        const lng = res.location?.coordinates?.lng;

        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          validMarkerCount++;
          bounds.extend([lat, lng]);

          const marker = L.marker([lat, lng], {
            icon: createCustomMarker('Resource', isVerified),
          });

          const popupContent = document.createElement('div');
          popupContent.className = 'p-1 text-slate-800 text-xs';
          popupContent.innerHTML = `
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 3px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>📦 ${res.title}</span>
              ${res.isSimulation ? '<span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 0 4px; border-radius: 3px; font-size: 9px; font-weight: 800;">SIMULATION</span>' : ''}
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 6px;">
              <span style="background-color: #ecfdf5; color: #065f46; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
                ${res.resourceType}
              </span>
              <span style="background-color: #f1f5f9; color: #334155; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
                ${res.availability}
              </span>
            </div>
            <div style="color: #0f766e; font-weight: 700; font-size: 11px; margin-bottom: 4px;">
              Capacity: ${res.quantity}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
              📍 ${res.location?.address || 'Pickup point'}
            </div>
          `;

          if (onSelectResource) {
            const actionBtn = document.createElement('button');
            actionBtn.style.cssText =
              'background: #0284c7; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; width: 100%;';
            actionBtn.innerText = 'View Resource Details';
            actionBtn.onclick = () => onSelectResource(res);
            popupContent.appendChild(actionBtn);
          }

          marker.bindPopup(popupContent);
          markersLayer.addLayer(marker);
        }
      });
    }

    if (validMarkerCount > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [incidents, resources, filterMode, selectedId]);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-soft bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Overlay Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-soft text-[11px] space-y-1.5 pointer-events-auto">
        <div className="font-bold text-navy-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
          <span>Crisis Map Legend</span>
          <span className="text-[10px] text-slate-400 font-normal">Real Telemetry</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Flood
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Fire
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Collapse
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Medical
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span> Resource Offer (Teal)
          </div>
        </div>
        <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="text-emerald-700 font-semibold">Solid Border = Verified</span>
          <span className="text-amber-700 font-semibold">Dashed = Pending</span>
        </div>
      </div>
    </div>
  );
}
