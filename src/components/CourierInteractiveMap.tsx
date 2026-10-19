import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Phone,
  Package,
  KeyRound,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Truck,
  Building2,
  Clock,
  Compass,
  Radio,
  BellRing,
} from 'lucide-react';
import { Shipment, StaffMember, PickupSchedule } from '../types';
import {
  CENTRAL_HUB,
  generateSuggestedRoute,
  getCourierBaseLocation,
  getShipmentCoordinates,
  calculateDistanceKm,
  SuggestedRoute,
  RouteStop,
} from '../utils/geoRouting';
import { useLogistics } from '../context/LogisticsContext';

interface CourierInteractiveMapProps {
  currentCourier: StaffMember;
  couriersList: StaffMember[];
  shipments: Shipment[];
  pickups?: PickupSchedule[];
  onSelectCourier?: (courierId: string) => void;
  onStartDelivery?: (shipment: Shipment) => void;
  onRecordReturn?: (shipment: Shipment) => void;
  onShowQr?: (shipment: Shipment) => void;
}

// Color palettes for multi-courier routes
const COURIER_PALETTES = [
  { stroke: '#4f46e5', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600' }, // Indigo
  { stroke: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600' }, // Emerald
  { stroke: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600' }, // Amber
  { stroke: '#9333ea', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600' }, // Purple
];

export const CourierInteractiveMap: React.FC<CourierInteractiveMapProps> = ({
  currentCourier,
  couriersList,
  shipments,
  pickups = [],
  onSelectCourier,
  onStartDelivery,
  onRecordReturn,
  onShowQr,
}) => {
  const { triggerProximityAlert } = useLogistics();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const animIntervalRef = useRef<number | null>(null);
  const alertedStopsRef = useRef<Set<number>>(new Set());

  // Map controls state
  const [selectedCourierId, setSelectedCourierId] = useState<string>(currentCourier.id);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL'>('SINGLE');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURN_PENDING'>('ALL');
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [isItineraryOpen, setIsItineraryOpen] = useState(true);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const simMarkerRef = useRef<L.Marker | null>(null);

  // Sync selected courier when prop changes
  useEffect(() => {
    setSelectedCourierId(currentCourier.id);
  }, [currentCourier.id]);

  const activeCourier = useMemo(() => {
    return couriersList.find((c) => c.id === selectedCourierId) || currentCourier;
  }, [selectedCourierId, couriersList, currentCourier]);

  // Shipments for the active courier
  const activeCourierShipments = useMemo(() => {
    const list = shipments.filter(
      (s) => s.assignedCourierId === activeCourier.id || s.assignedCourierName === activeCourier.name
    );
    if (statusFilter === 'ALL') return list;
    return list.filter((s) => s.status === statusFilter);
  }, [shipments, activeCourier, statusFilter]);

  // Pickups for the active courier
  const activeCourierPickups = useMemo(() => {
    return pickups.filter(
      (p) =>
        p.status !== 'CANCELLED' &&
        (p.assignedCourierId === activeCourier.id ||
          p.assignedCourierName === activeCourier.name ||
          activeCourier.assignedZone?.includes(p.city))
    );
  }, [pickups, activeCourier]);

  // Compute suggested route for active courier (both pickups and deliveries)
  const activeRoute = useMemo<SuggestedRoute>(() => {
    return generateSuggestedRoute(activeCourier, activeCourierShipments, activeCourierPickups);
  }, [activeCourier, activeCourierShipments, activeCourierPickups]);

  // Compute routes for all couriers (for multi-courier view)
  const allRoutes = useMemo<SuggestedRoute[]>(() => {
    return couriersList.map((c) => {
      const cShipments = shipments.filter(
        (s) => s.assignedCourierId === c.id || s.assignedCourierName === c.name
      );
      const cPickups = pickups.filter(
        (p) =>
          p.status !== 'CANCELLED' &&
          (p.assignedCourierId === c.id ||
            p.assignedCourierName === c.name ||
            c.assignedZone?.includes(p.city))
      );
      return generateSuggestedRoute(c, cShipments, cPickups);
    });
  }, [couriersList, shipments, pickups]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const baseLoc = getCourierBaseLocation(activeCourier);

    const map = L.map(mapContainerRef.current, {
      center: [baseLoc.lat, baseLoc.lng],
      zoom: 13,
      zoomControl: false,
    });

    // Add zoom control on top-left (RTL safe)
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // High performance CartoDB Voyager clean tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    routeLayersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Routes and Markers whenever dependencies change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = routeLayersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
      setIsSimulating(false);
    }

    const bounds = L.latLngBounds([]);

    // 1. Add Central Hub Marker
    const hubIcon = L.divIcon({
      className: 'custom-hub-icon',
      html: `
        <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#0f172a;color:#f8fafc;border-radius:10px;border:2px solid #38bdf8;box-shadow:0 4px 10px rgba(0,0,0,0.3);cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const hubMarker = L.marker([CENTRAL_HUB.lat, CENTRAL_HUB.lng], { icon: hubIcon });
    hubMarker.bindPopup(`
      <div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;min-width:200px;">
        <strong style="color:#0f172a;font-size:13px;display:block;">${CENTRAL_HUB.name}</strong>
        <span style="color:#64748b;font-size:11px;">${CENTRAL_HUB.address}</span>
        <div style="margin-top:6px;padding:4px 8px;background:#e0f2fe;color:#0369a1;border-radius:6px;font-size:10px;font-weight:bold;">
          نقطة انطلاق وتوريد الطرود المركزية
        </div>
      </div>
    `);
    group.addLayer(hubMarker);
    bounds.extend([CENTRAL_HUB.lat, CENTRAL_HUB.lng]);

    // Function to render a single route
    const renderRoute = (route: SuggestedRoute, colorIndex: number, isPrimary: boolean) => {
      const palette = COURIER_PALETTES[colorIndex % COURIER_PALETTES.length];

      // Courier Start/Current Base Marker
      const courierIcon = L.divIcon({
        className: 'custom-courier-icon',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:44px;height:44px;background:${palette.stroke};opacity:0.25;border-radius:50%;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;background:#0f172a;color:#ffffff;border-radius:50%;border:3px solid ${palette.stroke};box-shadow:0 4px 12px rgba(0,0,0,0.35);cursor:pointer;position:relative;z-index:2;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
            </div>
            <div style="position:absolute;bottom:-20px;background:#0f172a;color:#fbbf24;font-size:10px;font-weight:bold;padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,0.25);border:1px solid #334155;">
              ${route.courierName.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const courierMarker = L.marker([route.startPoint.lat, route.startPoint.lng], {
        icon: courierIcon,
      });
      courierMarker.bindPopup(`
        <div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;min-width:210px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <strong style="color:#0f172a;font-size:13px;">${route.courierName}</strong>
            <span style="background:${palette.stroke}20;color:${palette.stroke};font-size:9px;font-weight:bold;padding:1px 5px;border-radius:4px;">مندوب</span>
          </div>
          <p style="color:#64748b;font-size:11px;margin:2px 0;">${route.startPointLabel}</p>
          <div style="margin-top:6px;font-size:11px;color:#334155;border-top:1px solid #e2e8f0;padding-top:4px;">
            <div>إجمالي المحطات: <strong>${route.stops.length} محطة</strong></div>
            <div>المسافة المقدرة: <strong>${route.totalDistanceKm} كم</strong></div>
          </div>
        </div>
      `);
      group.addLayer(courierMarker);
      bounds.extend([route.startPoint.lat, route.startPoint.lng]);

      // Route Polyline
      if (route.polylineCoords.length > 1) {
        // Outer glow/shadow line
        const glowLine = L.polyline(route.polylineCoords, {
          color: palette.stroke,
          weight: isPrimary ? 8 : 5,
          opacity: isPrimary ? 0.25 : 0.15,
          lineCap: 'round',
          lineJoin: 'round',
        });
        group.addLayer(glowLine);

        // Core line
        const mainLine = L.polyline(route.polylineCoords, {
          color: palette.stroke,
          weight: isPrimary ? 4 : 2.5,
          opacity: isPrimary ? 0.9 : 0.7,
          dashArray: isPrimary ? undefined : '6, 6',
          lineCap: 'round',
          lineJoin: 'round',
        });
        group.addLayer(mainLine);

        route.polylineCoords.forEach((pt) => bounds.extend(pt));
      }

      // Route Stop Markers (Pickups & Deliveries)
      route.stops.forEach((stop) => {
        const { coordinates, sequence, type } = stop;
        bounds.extend([coordinates.lat, coordinates.lng]);

        const isPickup = type === 'PICKUP';
        let statusColor = isPickup ? '#d97706' : '#2563eb'; // amber for pickup, blue for delivery
        let statusLabel = isPickup ? 'طلب استلام بضائع' : 'قيد التوصيل';
        let badgeIcon = isPickup ? '📦' : sequence;

        if (stop.status === 'DELIVERED' || stop.status === 'COMPLETED') {
          statusColor = '#10b981'; // emerald
          statusLabel = isPickup ? 'تم الاستلام' : 'تم التسليم';
        } else if (stop.status === 'RETURN_PENDING') {
          statusColor = '#f43f5e'; // rose
          statusLabel = 'مرتجع / مؤجل';
        } else if (stop.status === 'IN_PROGRESS') {
          statusColor = '#8b5cf6'; // violet
          statusLabel = 'جاري التنفيذ';
        }

        const stopIcon = L.divIcon({
          className: 'custom-stop-icon',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:${statusColor};color:#ffffff;border-radius:50%;font-weight:900;font-size:11px;font-family:'Cairo',sans-serif;border:2.5px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.35);">
                ${badgeIcon}
              </div>
              <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${statusColor};"></div>
            </div>
          `,
          iconSize: [28, 33],
          iconAnchor: [14, 33],
        });

        const stopMarker = L.marker([coordinates.lat, coordinates.lng], { icon: stopIcon });

        // Popup content with rich interaction and real-time GPS coordinates
        const popupContent = document.createElement('div');
        popupContent.style.direction = 'rtl';
        popupContent.style.textAlign = 'right';
        popupContent.style.fontFamily = "'Cairo', sans-serif";
        popupContent.style.minWidth = '240px';

        const phone = isPickup ? stop.pickup?.merchantPhone : stop.shipment?.recipientPhone;
        const detailsLine = isPickup
          ? `📦 <strong>المطلوب استلامه:</strong> ${stop.pickup?.expectedParcelsCount || 0} طرد | ⏰ <strong>النافذة:</strong> ${stop.pickup?.scheduledTimeWindow || 'اليوم'}`
          : `📦 <strong>المحتوى:</strong> ${stop.shipment?.itemsDescription || 'طرد شحن'} | 💰 <strong>التحصيل (COD):</strong> <strong style="color:#b45309;font-size:12px;">${stop.shipment?.codAmount || 0} ج.م</strong>`;

        popupContent.innerHTML = `
          <div style="border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-weight:bold;font-size:12px;color:#0f172a;">#${sequence} - ${stop.title}</span>
              <span style="font-size:9px;font-weight:bold;background:${statusColor}20;color:${statusColor};padding:1px 6px;border-radius:4px;">${statusLabel}</span>
            </div>
            <div style="font-size:13px;font-weight:900;color:#0f172a;margin-top:2px;">${stop.recipientOrMerchant}</div>
          </div>
          <div style="font-size:11px;color:#475569;margin-bottom:4px;">
            <div>📍 <strong>العنوان:</strong> ${stop.address}</div>
            <div style="margin-top:2px;">${detailsLine}</div>
            <div style="margin-top:4px;font-family:monospace;font-size:10px;color:#64748b;background:#f8fafc;padding:2px 6px;border-radius:4px;border:1px solid #e2e8f0;">
              🌐 إحداثيات GPS: <strong>${coordinates.lat.toFixed(5)}°N, ${coordinates.lng.toFixed(5)}°E</strong>
            </div>
          </div>
          <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #cbd5e1;display:flex;gap:4px;flex-wrap:wrap;">
            ${phone ? `
              <a href="tel:${phone}" style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;background:#f1f5f9;color:#0f172a;border-radius:6px;font-size:10px;font-weight:bold;text-decoration:none;border:1px solid #cbd5e1;">
                📞 ${phone}
              </a>
            ` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;background:#2563eb;color:#ffffff;border-radius:6px;font-size:10px;font-weight:bold;text-decoration:none;">
              🧭 فتح الملاحة
            </a>
          </div>
        `;

        stopMarker.bindPopup(popupContent);
        stopMarker.on('click', () => {
          setSelectedStop(stop);
        });

        group.addLayer(stopMarker);
      });
    };

    if (viewMode === 'ALL') {
      allRoutes.forEach((route, idx) => {
        renderRoute(route, idx, route.courierId === activeCourier.id);
      });
    } else {
      renderRoute(activeRoute, couriersList.findIndex((c) => c.id === activeCourier.id) || 0, true);
    }

    // Fit map bounds smoothly
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [viewMode, activeCourier, activeRoute, allRoutes, couriersList]);

  // Simulation handler: Animate courier along the route
  const toggleSimulation = () => {
    const map = mapInstanceRef.current;
    const group = routeLayersGroupRef.current;
    if (!map || !group) return;

    if (isSimulating) {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
      setIsSimulating(false);
      return;
    }

    if (activeRoute.polylineCoords.length <= 1) return;

    setIsSimulating(true);
    if (simStepIndex === 0) {
      alertedStopsRef.current.clear();
    }

    // Create or reset simulation moving marker
    if (!simMarkerRef.current) {
      const bikeIcon = L.divIcon({
        className: 'sim-bike-icon',
        html: `
          <div style="width:34px;height:34px;background:#f59e0b;color:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #0f172a;box-shadow:0 4px 14px rgba(245,158,11,0.6);font-weight:bold;transform:scale(1.15);">
            🏍️
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const marker = L.marker(activeRoute.polylineCoords[0], { icon: bikeIcon, zIndexOffset: 1000 });
      group.addLayer(marker);
      simMarkerRef.current = marker;
    }

    let currentIdx = simStepIndex;
    const totalPoints = activeRoute.polylineCoords.length;

    animIntervalRef.current = window.setInterval(() => {
      currentIdx = (currentIdx + 1) % totalPoints;
      setSimStepIndex(currentIdx);

      const pt = activeRoute.polylineCoords[currentIdx];
      if (simMarkerRef.current) {
        simMarkerRef.current.setLatLng(pt);
      }
      map.panTo(pt, { animate: true, duration: 0.4 });

      // Real-time Geofence Proximity Check: Calculate distance to each stop along route
      const [curLat, curLng] = pt;
      activeRoute.stops.forEach((stop) => {
        if (alertedStopsRef.current.has(stop.sequence)) return;

        const distKm = calculateDistanceKm(curLat, curLng, stop.coordinates.lat, stop.coordinates.lng);
        const distMeters = Math.round(distKm * 1000);

        // Proximity threshold: within 450 meters
        if (distMeters <= 450) {
          alertedStopsRef.current.add(stop.sequence);

          // Trigger rich Toast Notification
          triggerProximityAlert({
            courierId: activeCourier.id,
            courierName: activeCourier.name,
            stopType: stop.type,
            title: stop.title,
            targetName: stop.recipientOrMerchant,
            address: stop.address,
            distanceMeters: distMeters,
            phone: stop.type === 'PICKUP' ? stop.pickup?.merchantPhone : stop.shipment?.recipientPhone,
            trackingNumber: stop.shipment?.trackingNumber || stop.pickup?.id,
            codAmount: stop.shipment?.codAmount,
            otpSecret: stop.shipment?.otpSecret,
            parcelsCount: stop.pickup?.expectedParcelsCount,
          });

          // Add a temporary pulsing beacon on the map around this stop
          const proximityPulse = L.circle([stop.coordinates.lat, stop.coordinates.lng], {
            radius: 350,
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '4, 4',
          });
          group.addLayer(proximityPulse);
          setTimeout(() => {
            if (group) group.removeLayer(proximityPulse);
          }, 6000);
        }
      });

      // Stop when completed loop
      if (currentIdx === totalPoints - 1) {
        if (animIntervalRef.current) clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
        setIsSimulating(false);
      }
    }, 600);
  };

  const resetSimulation = () => {
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    animIntervalRef.current = null;
    setIsSimulating(false);
    setSimStepIndex(0);
    alertedStopsRef.current.clear();
    if (simMarkerRef.current && routeLayersGroupRef.current) {
      routeLayersGroupRef.current.removeLayer(simMarkerRef.current);
      simMarkerRef.current = null;
    }
    // Re-center
    fitAllBounds();
  };

  const fitAllBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = L.latLngBounds([]);
    bounds.extend([CENTRAL_HUB.lat, CENTRAL_HUB.lng]);
    activeRoute.polylineCoords.forEach((pt) => bounds.extend(pt));
    activeRoute.stops.forEach((s) => bounds.extend([s.coordinates.lat, s.coordinates.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  const zoomToStop = (stop: RouteStop) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([stop.coordinates.lat, stop.coordinates.lng], 16, { duration: 1.2 });
    setSelectedStop(stop);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col space-y-0">
      {/* Top Map Control Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">الخريطة التفاعلية والمسارات المقترحة</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                توجيه ذكي (TSP)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              مسار التوزيع الأمثل لنطاق: <strong>{activeCourier.assignedZone}</strong>
            </p>
          </div>
        </div>

        {/* View Mode & Courier Select */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Single vs All */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'SINGLE' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              مندوب محدد
            </button>
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              كامل الأسطول ({couriersList.length})
            </button>
          </div>

          {/* Courier Selector */}
          <select
            value={activeCourier.id}
            onChange={(e) => {
              setSelectedCourierId(e.target.value);
              if (onSelectCourier) onSelectCourier(e.target.value);
            }}
            className="bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-hidden"
          >
            {couriersList.map((c) => (
              <option key={c.id} value={c.id}>
                كابتن {c.name}
              </option>
            ))}
          </select>

          {/* Reset / Fit View */}
          <button
            onClick={fitAllBounds}
            title="إعادة ضبط إطار الخريطة"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Route Quick KPI Summary Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Truck className="w-4 h-4 text-slate-500" />
            <span>
              إجمالي المحطات: <strong>{activeRoute.stops.length} نقطة توقف</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>
              المسافة المقترحة: <strong>{activeRoute.totalDistanceKm} كم</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              الوقت التقديري: <strong>~{activeRoute.estimatedTotalTimeMins} دقيقة</strong>
            </span>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">تصفية الشحنات:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-300 text-slate-800 text-[11px] font-bold rounded-md px-2 py-1"
          >
            <option value="ALL">كافة الحالات</option>
            <option value="OUT_FOR_DELIVERY">قيد التوصيل فقط</option>
            <option value="DELIVERED">تم التسليم</option>
            <option value="RETURN_PENDING">المرتجعات والمؤجل</option>
          </select>

          {/* Simulation Toggle */}
          <button
            onClick={toggleSimulation}
            disabled={activeRoute.stops.length === 0}
            className={`px-3 py-1 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
              isSimulating
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>إيقاف المحاكاة</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>محاكاة خط السير</span>
              </>
            )}
          </button>

          {isSimulating && (
            <button
              onClick={resetSimulation}
              className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              title="إعادة تعيين المحاكاة"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Map Body with side/bottom itinerary tray */}
      <div className="relative flex-1 min-h-[460px] md:min-h-[520px] w-full bg-slate-100">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Legend Box Overlay (bottom-left) */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/90 shadow-md text-[10px] space-y-1.5 hidden sm:block">
          <div className="font-bold text-slate-800 pb-1 border-b border-slate-200">دليل الخريطة اللوجستية</div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>استلام بضائع من متجر (Pickup)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span>توصيل طرد للعميل (Delivery)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span>تم التسليم / الاستلام بنجاح</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
            <span>مرتجع / طلب تأجيل</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-md bg-slate-900 border border-sky-400 inline-block"></span>
            <span>المستودع الرئيسي ونقطة التمركز</span>
          </div>
        </div>

        {/* Floating Itinerary Drawer Toggle Button */}
        <button
          onClick={() => setIsItineraryOpen(!isItineraryOpen)}
          className="absolute top-3 right-3 z-10 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5 border border-slate-700 hover:bg-slate-800 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>جدول محطات السير ({activeRoute.stops.length})</span>
          {isItineraryOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Itinerary Side Panel / Drawer */}
        {isItineraryOpen && (
          <div className="absolute top-12 bottom-3 right-3 z-10 w-80 max-w-[calc(100vw-1.5rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">مسارات الاستلام والتسليم</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeRoute.totalDistanceKm} كم
              </span>
            </div>

            <div className="p-2 space-y-2 overflow-y-auto flex-1 max-h-[400px]">
              {/* Start Depot Stop */}
              <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-900 text-sky-400 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <strong className="block text-slate-800 text-[11px]">نقطة الانطلاق</strong>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {activeRoute.startPointLabel}
                  </span>
                </div>
              </div>

              {activeRoute.stops.map((stop) => {
                const isSelected = selectedStop?.sequence === stop.sequence;
                const isPickup = stop.type === 'PICKUP';
                const isFinished = stop.status === 'DELIVERED' || stop.status === 'COMPLETED';
                const isReturn = stop.status === 'RETURN_PENDING';
                const phone = isPickup ? stop.pickup?.merchantPhone : stop.shipment?.recipientPhone;

                return (
                  <div
                    key={`${stop.type}-${stop.sequence}`}
                    onClick={() => zoomToStop(stop)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] text-white shrink-0 ${
                            isFinished
                              ? 'bg-emerald-600'
                              : isReturn
                              ? 'bg-rose-600'
                              : isPickup
                              ? 'bg-amber-600'
                              : 'bg-blue-600'
                          }`}
                        >
                          {isPickup ? '📦' : stop.sequence}
                        </span>
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[125px]">
                          {stop.recipientOrMerchant}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        +{stop.distanceFromPreviousKm} كم
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        isPickup ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isPickup ? 'استلام بضائع من متجر' : 'توصيل طرد للعميل'}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        GPS: {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate">
                      📍 {stop.address}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        {isPickup ? (
                          <>عدد الطرود: <strong>{stop.pickup?.expectedParcelsCount || 0} طرد</strong></>
                        ) : (
                          <>المطلوب: <strong>{stop.shipment?.codAmount || 0} ج.م</strong></>
                        )}
                      </span>
                      <span>وصول تقديري: د+{stop.estimatedArrivalMins}</span>
                    </div>

                    {/* Action buttons inside stop card */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>اتصال</span>
                        </a>
                      )}

                      {!isPickup && stop.shipment && onStartDelivery && !isFinished && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartDelivery(stop.shipment!);
                          }}
                          className="flex-1 p-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          <span>تأكيد OTP</span>
                        </button>
                      )}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${stop.coordinates.lat},${stop.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1"
                        title="ملاحة خارجية"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {activeRoute.stops.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  لا توجد شحنات أو طلبات استلام في خط سير هذا المندوب حالياً.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Stop Details Footer Banner if a stop was clicked */}
      {selectedStop && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
              #{selectedStop.sequence}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong>المحطة {selectedStop.sequence}: {selectedStop.recipientOrMerchant}</strong>
                <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  {selectedStop.type === 'PICKUP' ? 'استلام من متجر' : 'توصيل طرد'}
                </span>
                <span className="font-mono text-[10px] text-slate-600 bg-white/70 px-1.5 py-0.5 rounded border border-amber-200">
                  GPS: {selectedStop.coordinates.lat.toFixed(5)}°N, {selectedStop.coordinates.lng.toFixed(5)}°E
                </span>
              </div>
              <span className="text-[11px] text-amber-900">
                {selectedStop.address} | {selectedStop.type === 'PICKUP' ? `الطرود: ${selectedStop.pickup?.expectedParcelsCount || 0}` : `المطلوب: ${selectedStop.shipment?.codAmount || 0} ج.م`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {((selectedStop.type === 'PICKUP' ? selectedStop.pickup?.merchantPhone : selectedStop.shipment?.recipientPhone)) && (
              <a
                href={`tel:${selectedStop.type === 'PICKUP' ? selectedStop.pickup?.merchantPhone : selectedStop.shipment?.recipientPhone}`}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>{selectedStop.type === 'PICKUP' ? selectedStop.pickup?.merchantPhone : selectedStop.shipment?.recipientPhone}</span>
              </a>
            )}

            {onStartDelivery && selectedStop.type === 'DELIVERY' && selectedStop.shipment && selectedStop.shipment.status !== 'DELIVERED' && (
              <button
                onClick={() => onStartDelivery(selectedStop.shipment!)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>إدخال كود الـ OTP</span>
              </button>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStop.coordinates.lat},${selectedStop.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ملاحة مباشرة</span>
            </a>

            <button
              onClick={() => setSelectedStop(null)}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
