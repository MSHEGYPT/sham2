import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Compass,
  Navigation,
  RefreshCw,
  Phone,
  Package,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff,
  User,
  Search,
  Crosshair,
  Building2,
  DollarSign,
  Filter,
  Route,
  Activity,
  Check,
  ExternalLink,
  Wifi,
  BatteryCharging,
  Gauge,
  History,
  Radio,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Shipment, StaffMember } from '../types';
import {
  CENTRAL_HUB,
  getShipmentCoordinates,
  calculateDistanceKm,
  getCourierBaseLocation,
  GeoLocation,
} from '../utils/geoRouting';

export interface ReactLeafletShipmentsMapProps {
  staff: StaffMember[];
  shipments: Shipment[];
  onSelectShipment?: (shipment: Shipment) => void;
  initialHeatmapActive?: boolean;
  onApplySmartAllocation?: (trackingNumbers: string[], courierId: string) => void;
  className?: string;
}

// Map center controller with support for Auto-Follow
interface MapControllerProps {
  center: [number, number];
  zoom: number;
  triggerRecenter: number;
  autoFollowCoords?: [number, number] | null;
}

const MapController: React.FC<MapControllerProps> = ({
  center,
  zoom,
  triggerRecenter,
  autoFollowCoords,
}) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [triggerRecenter, center, zoom, map]);

  useEffect(() => {
    if (autoFollowCoords) {
      map.panTo(autoFollowCoords, { animate: true, duration: 0.8 });
    }
  }, [autoFollowCoords, map]);

  return null;
};

// Auto-resizer for Leaflet container inside tabs or flex layouts
const MapResizeHandler: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Helper: Calculate bearing / heading in degrees between two coordinates
function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Helper: Custom Courier DivIcon with live direction indicator & pulsing telemetry
const createCourierIcon = (
  courier: StaffMember,
  isSelected: boolean,
  status: string,
  speedKmh: number,
  headingDeg: number,
  isAutoUpdating: boolean
) => {
  const isBusy = status === 'BUSY_DELIVERING';
  const isOnBreak = status === 'ON_BREAK';
  const isSuspended = status === 'SUSPENDED';

  let bgColor = 'bg-emerald-600';
  let iconEmoji = courier.vehicleType?.includes('سيارة') ? '🚗' : courier.vehicleType?.includes('فان') ? '🚐' : '🛵';

  if (isSuspended) {
    bgColor = 'bg-rose-600';
    iconEmoji = '⛔';
  } else if (isOnBreak) {
    bgColor = 'bg-amber-500';
    iconEmoji = '☕';
  } else if (isBusy) {
    bgColor = 'bg-purple-600';
  }

  const ringStyle = isSelected
    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110 shadow-2xl z-50'
    : 'ring-2 ring-white shadow-xl hover:scale-105';

  return L.divIcon({
    className: 'custom-courier-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer transition-all">
        <!-- Directional arrow pointer pointing towards vehicle heading -->
        ${
          speedKmh > 0 && !isOnBreak && !isSuspended
            ? `
          <div class="absolute -top-3 w-4 h-4 flex items-center justify-center transition-transform duration-500 pointer-events-none" style="transform: rotate(${headingDeg}deg);">
            <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-amber-400 drop-shadow"></div>
          </div>
          `
            : ''
        }

        <!-- Main Courier Avatar -->
        <div class="w-10 h-10 rounded-2xl ${bgColor} ${ringStyle} text-white shadow-lg flex items-center justify-center font-bold text-base transition-transform">
          <span>${iconEmoji}</span>
          
          <!-- Pulsing Radar Ring during Active GPS transmission -->
          ${
            isAutoUpdating && speedKmh > 0
              ? '<span class="absolute -inset-1 rounded-2xl bg-emerald-400/40 animate-ping pointer-events-none"></span>'
              : ''
          }
          
          <!-- Delivery Activity indicator -->
          ${
            isBusy
              ? '<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-400 rounded-full animate-ping"></span>'
              : ''
          }
          <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 ${
            courier.status === 'ACTIVE' || courier.status === 'ON_DUTY'
              ? 'bg-emerald-400'
              : 'bg-amber-400'
          } border-2 border-white rounded-full"></span>
        </div>

        <!-- Name & Speed Badge -->
        <div class="mt-1 flex items-center gap-1 bg-slate-950/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow border border-slate-700 pointer-events-none">
          <span>${courier.name.split(' ')[0]}</span>
          ${
            speedKmh > 0
              ? `<span class="text-amber-400 font-mono text-[9px] border-r border-slate-700 pr-1 mr-1">${Math.round(speedKmh)}k</span>`
              : ''
          }
        </div>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 28],
    popupAnchor: [0, -28],
  });
};

// Helper: Custom Shipment DivIcon
const createShipmentIcon = (shipment: Shipment, isSelected: boolean) => {
  let color = 'bg-slate-700';
  let icon = '📦';

  switch (shipment.status) {
    case 'OUT_FOR_DELIVERY':
      color = 'bg-purple-600';
      icon = '🚚';
      break;
    case 'DELIVERED':
      color = 'bg-emerald-600';
      icon = '✓';
      break;
    case 'PENDING_PICKUP':
      color = 'bg-amber-600';
      icon = '⏳';
      break;
    case 'RECEIVED_IN_HUB':
      color = 'bg-blue-600';
      icon = '🏢';
      break;
    case 'RETURN_PENDING':
    case 'RETURNED_TO_MERCHANT':
    case 'PARTIAL_DELIVERY':
      color = 'bg-rose-600';
      icon = '↩';
      break;
  }

  const ringStyle = isSelected
    ? 'ring-4 ring-amber-400 scale-125 z-50'
    : 'ring-2 ring-white shadow-md hover:scale-110';

  return L.divIcon({
    className: 'custom-shipment-marker',
    html: `
      <div class="relative flex flex-col items-center cursor-pointer transition-transform">
        <div class="w-8 h-8 rounded-xl ${color} ${ringStyle} text-white flex items-center justify-center font-bold text-xs shadow-md">
          <span>${icon}</span>
        </div>
        <div class="mt-0.5 bg-slate-900/95 text-amber-300 text-[9px] font-mono font-bold px-1 rounded shadow-xs whitespace-nowrap pointer-events-none border border-slate-700">
          ${shipment.codAmount || 0} ج.م
        </div>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 22],
    popupAnchor: [0, -22],
  });
};

// Helper: Hub DivIcon
const createHubIcon = () => {
  return L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-11 h-11 rounded-2xl bg-slate-950 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-2xl">
          <span class="text-xl">🏛️</span>
          <span class="absolute -top-1 -right-1 flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>
        <div class="mt-1 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
          المستودع الرئيسي (HUB)
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 26],
    popupAnchor: [0, -26],
  });
};

export const ReactLeafletShipmentsMap: React.FC<ReactLeafletShipmentsMapProps> = ({
  staff,
  shipments,
  onSelectShipment,
  initialHeatmapActive = false,
  onApplySmartAllocation,
  className = '',
}) => {
  // Main view state
  const [selectedCourierId, setSelectedCourierId] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Layer toggles
  const [showCouriers, setShowCouriers] = useState<boolean>(true);
  const [showShipments, setShowShipments] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(true);
  const [showHubRadius, setShowHubRadius] = useState<boolean>(true);

  // Auto-Update and GPS Simulation state
  const [isAutoUpdating, setIsAutoUpdating] = useState<boolean>(true);
  const [updateIntervalSec, setUpdateIntervalSec] = useState<number>(2); // 1, 2, or 5 seconds
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState<number>(1);
  const [simTick, setSimTick] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [autoFollowCourier, setAutoFollowCourier] = useState<boolean>(false);
  const [recentEvents, setRecentEvents] = useState<string[]>([
    'تم تفعيل نظام التحديث التلقائي اللحظي لمواقع المناديب عبر الأقمار الصناعية GPS',
  ]);

  // Breadcrumb movement trail storage: { [courierId]: Array<[lat, lng]> }
  const breadcrumbsRef = useRef<Record<string, [number, number][]>>({});

  // Map viewport
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.055, 31.325]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);

  // Filter couriers
  const couriers = useMemo(() => {
    return staff.filter((s) => s.role === 'COURIER');
  }, [staff]);

  // Resolve shipment coordinates
  const shipmentsWithCoords = useMemo(() => {
    return shipments.map((shp, idx) => {
      const coords = getShipmentCoordinates(shp, idx);
      return {
        ...shp,
        coords: [coords.lat, coords.lng] as [number, number],
      };
    });
  }, [shipments]);

  // Automatic periodic GPS simulation ticker
  useEffect(() => {
    if (!isAutoUpdating) return;

    const intervalMs = Math.max(800, (updateIntervalSec * 1000) / simulationSpeedMultiplier);
    const timer = setInterval(() => {
      setSimTick((prev) => prev + 1);
      setLastSyncTime(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoUpdating, updateIntervalSec, simulationSpeedMultiplier]);

  // Compute live courier positions using realistic multi-waypoint route interpolation
  const courierLivePositions = useMemo(() => {
    const positions: Record<
      string,
      {
        coords: [number, number];
        status: 'ACTIVE' | 'BUSY_DELIVERING' | 'ON_BREAK' | 'SUSPENDED';
        speedKmh: number;
        headingDeg: number;
        currentMissionText: string;
        etaMinutes: number;
        distanceRemainingKm: number;
        batteryLevel: number;
        assignedShipments: Shipment[];
        currentStopIndex: number;
        totalStops: number;
      }
    > = {};

    couriers.forEach((courier, idx) => {
      const baseLoc = getCourierBaseLocation(courier);
      const assigned = shipmentsWithCoords.filter(
        (s) => s.assignedCourierId === courier.id || s.assignedCourierName === courier.name
      );

      const activeDeliveries = assigned.filter(
        (s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'PENDING_PICKUP'
      );

      let liveStatus: 'ACTIVE' | 'BUSY_DELIVERING' | 'ON_BREAK' | 'SUSPENDED' = 'ACTIVE';
      if (courier.status === 'SUSPENDED') liveStatus = 'SUSPENDED';
      else if (courier.status === 'ON_BREAK') liveStatus = 'ON_BREAK';
      else if (activeDeliveries.length > 0) liveStatus = 'BUSY_DELIVERING';

      // 1. Build mission waypoints for this courier
      const waypoints: [number, number][] = [];
      waypoints.push([baseLoc.lat, baseLoc.lng]);

      if (activeDeliveries.length > 0) {
        // Waypoints are the active delivery/pickup points
        activeDeliveries.forEach((deliv) => {
          waypoints.push(deliv.coords);
        });
        // Loop back to central hub or base
        waypoints.push([CENTRAL_HUB.lat, CENTRAL_HUB.lng]);
      } else {
        // Courier is in active roving / patrol mode in their district zone
        // Generate a 4-point district patrol circuit
        const zoneLat = baseLoc.lat;
        const zoneLng = baseLoc.lng;
        waypoints.push([zoneLat + 0.007, zoneLng + 0.006]);
        waypoints.push([zoneLat + 0.003, zoneLng + 0.012]);
        waypoints.push([zoneLat - 0.006, zoneLng + 0.005]);
        waypoints.push([zoneLat - 0.003, zoneLng - 0.006]);
      }

      // If suspended or on break, courier stays parked at base
      if (liveStatus === 'SUSPENDED' || liveStatus === 'ON_BREAK') {
        positions[courier.id] = {
          coords: [baseLoc.lat, baseLoc.lng],
          status: liveStatus,
          speedKmh: 0,
          headingDeg: 0,
          currentMissionText:
            liveStatus === 'ON_BREAK'
              ? 'متوقف مؤقتاً للاستراحة والغداء ☕'
              : 'الحساب معلق مؤقتاً - متوقف بالفرع',
          etaMinutes: 0,
          distanceRemainingKm: 0,
          batteryLevel: 92,
          assignedShipments: assigned,
          currentStopIndex: 0,
          totalStops: activeDeliveries.length,
        };
        return;
      }

      // Realistic path interpolation
      // Each waypoint segment has 24 steps
      const STEPS_PER_SEGMENT = 24;
      const numSegments = waypoints.length - 1;
      const totalCycleSteps = Math.max(1, numSegments * STEPS_PER_SEGMENT);

      // Offset courier start so they aren't all at step 0
      const courierOffset = idx * 11;
      const currentGlobalStep = (simTick + courierOffset) % totalCycleSteps;

      const segmentIndex = Math.min(
        numSegments - 1,
        Math.floor(currentGlobalStep / STEPS_PER_SEGMENT)
      );
      const stepInSegment = currentGlobalStep % STEPS_PER_SEGMENT;
      const progress = stepInSegment / STEPS_PER_SEGMENT;

      const startPt = waypoints[segmentIndex];
      const endPt = waypoints[segmentIndex + 1] || waypoints[0];

      // Add realistic street curve deviation (perpendicular sine wave offset)
      const latDiff = endPt[0] - startPt[0];
      const lngDiff = endPt[1] - startPt[1];
      const roadWiggle = Math.sin(progress * Math.PI) * 0.0012; // ~100m street bend

      let curLat = startPt[0] + latDiff * progress - roadWiggle * 0.6;
      let curLng = startPt[1] + lngDiff * progress + roadWiggle;

      // Calculate next step for heading determination
      const nextProgress = Math.min(1, progress + 0.05);
      const nextLat = startPt[0] + latDiff * nextProgress;
      const nextLng = startPt[1] + lngDiff * nextProgress;

      const heading = calculateBearing(curLat, curLng, nextLat, nextLng);

      // Distance and ETA calculations
      const remainingDistanceKm = calculateDistanceKm(curLat, curLng, endPt[0], endPt[1]);

      // Dynamic Speed calculation
      let currentSpeed = 0;
      if (progress > 0.92) {
        // Slowing down / arrived at customer door
        currentSpeed = Math.max(0, Math.round(8 * (1 - progress) * 10));
      } else {
        // Cruising speed based on vehicle type and city traffic
        const baseSpeed = courier.vehicleType?.includes('سيارة') ? 35 : 42;
        const speedFluctuation = Math.sin((simTick + idx * 3) * 0.5) * 8;
        currentSpeed = Math.round(baseSpeed + speedFluctuation);
      }

      const etaMins = Math.max(1, Math.round((remainingDistanceKm / Math.max(15, currentSpeed)) * 60));

      // Battery level simulation (between 68% and 98%)
      const battery = Math.max(45, 96 - ((simTick + idx * 7) % 35));

      // Mission text description
      let missionText = '';
      if (activeDeliveries.length > 0 && segmentIndex < activeDeliveries.length) {
        const targetShipment = activeDeliveries[segmentIndex];
        if (progress > 0.9) {
          missionText = `وصل الآن إلى وجهة العميل: ${targetShipment.recipientName} (${targetShipment.district || targetShipment.city})`;
        } else {
          missionText = `في الطريق لتسليم طرد #${targetShipment.trackingNumber} لـ ${targetShipment.recipientName}`;
        }
      } else {
        missionText = `دورية استطلاعية وتمركز في نطاق (${courier.assignedZone || 'القاهرة'})`;
      }

      const preciseCoords: [number, number] = [
        Number(curLat.toFixed(6)),
        Number(curLng.toFixed(6)),
      ];

      positions[courier.id] = {
        coords: preciseCoords,
        status: liveStatus,
        speedKmh: currentSpeed,
        headingDeg: Math.round(heading),
        currentMissionText: missionText,
        etaMinutes: etaMins,
        distanceRemainingKm: Number(remainingDistanceKm.toFixed(2)),
        batteryLevel: battery,
        assignedShipments: assigned,
        currentStopIndex: segmentIndex + 1,
        totalStops: activeDeliveries.length,
      };

      // Record breadcrumb trail point
      if (!breadcrumbsRef.current[courier.id]) {
        breadcrumbsRef.current[courier.id] = [];
      }
      const history = breadcrumbsRef.current[courier.id];
      const lastPoint = history[history.length - 1];
      if (
        !lastPoint ||
        Math.abs(lastPoint[0] - preciseCoords[0]) > 0.0003 ||
        Math.abs(lastPoint[1] - preciseCoords[1]) > 0.0003
      ) {
        history.push(preciseCoords);
        if (history.length > 18) {
          history.shift();
        }
      }
    });

    return positions;
  }, [couriers, shipmentsWithCoords, simTick]);

  // Periodically add telemetry feed log message
  useEffect(() => {
    if (!isAutoUpdating || couriers.length === 0) return;
    const activeCouriers = couriers.filter(
      (c) => courierLivePositions[c.id]?.status === 'BUSY_DELIVERING' || courierLivePositions[c.id]?.status === 'ACTIVE'
    );
    if (activeCouriers.length === 0) return;

    const randomCourier = activeCouriers[simTick % activeCouriers.length];
    const liveData = courierLivePositions[randomCourier.id];
    if (liveData && simTick % 4 === 0) {
      const timeStr = new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const newEvent = `[${timeStr}] ${randomCourier.name}: ${liveData.currentMissionText} (السرعة: ${liveData.speedKmh} كم/س)`;
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 5)]);
    }
  }, [simTick, isAutoUpdating, couriers, courierLivePositions]);

  // Filtered shipments based on selections
  const visibleShipments = useMemo(() => {
    return shipmentsWithCoords.filter((shp) => {
      if (selectedStatusFilter !== 'ALL' && shp.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedCourierId !== 'ALL') {
        const matchesCourier =
          shp.assignedCourierId === selectedCourierId ||
          couriers.find((c) => c.id === selectedCourierId)?.name === shp.assignedCourierName;
        if (!matchesCourier) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          shp.trackingNumber.toLowerCase().includes(query) ||
          shp.recipientName.toLowerCase().includes(query) ||
          shp.district?.toLowerCase().includes(query) ||
          shp.city?.toLowerCase().includes(query) ||
          shp.codAmount.toString().includes(query);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [shipmentsWithCoords, selectedStatusFilter, selectedCourierId, searchQuery, couriers]);

  // Compute route polylines between Hub -> Courier -> Active Deliveries
  const routePolylines = useMemo(() => {
    if (!showRoutes) return [];

    const lines: {
      id: string;
      courierName: string;
      color: string;
      positions: [number, number][];
      dashArray?: string;
    }[] = [];

    const colors = ['#8b5cf6', '#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#3b82f6'];

    couriers.forEach((courier, idx) => {
      if (selectedCourierId !== 'ALL' && selectedCourierId !== courier.id) return;

      const courierData = courierLivePositions[courier.id];
      if (!courierData) return;

      const color = colors[idx % colors.length];
      const activeDeliveries = courierData.assignedShipments.filter(
        (s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'PENDING_PICKUP'
      );

      if (activeDeliveries.length > 0) {
        // Line from central hub to courier
        lines.push({
          id: `hub-to-${courier.id}`,
          courierName: courier.name,
          color,
          positions: [[CENTRAL_HUB.lat, CENTRAL_HUB.lng], courierData.coords],
          dashArray: '4, 8',
        });

        // Lines from courier to delivery points
        activeDeliveries.forEach((deliv) => {
          const shpCoord = shipmentsWithCoords.find((s) => s.id === deliv.id);
          if (shpCoord) {
            lines.push({
              id: `courier-${courier.id}-deliv-${deliv.id}`,
              courierName: courier.name,
              color,
              positions: [courierData.coords, shpCoord.coords],
            });
          }
        });
      }
    });

    return lines;
  }, [couriers, courierLivePositions, shipmentsWithCoords, selectedCourierId, showRoutes]);

  // Focus on courier
  const handleFocusCourier = (courierId: string) => {
    setSelectedCourierId(courierId);
    const data = courierLivePositions[courierId];
    if (data) {
      setMapCenter(data.coords);
      setMapZoom(15);
      setRecenterTrigger((t) => t + 1);
    }
  };

  // Focus on shipment
  const handleFocusShipment = (shipment: Shipment & { coords: [number, number] }) => {
    setActiveShipmentId(shipment.id);
    setMapCenter(shipment.coords);
    setMapZoom(16);
    setRecenterTrigger((t) => t + 1);
    if (onSelectShipment) {
      onSelectShipment(shipment);
    }
  };

  // Reset to full Cairo overview
  const handleResetView = () => {
    setSelectedCourierId('ALL');
    setSelectedStatusFilter('ALL');
    setSearchQuery('');
    setAutoFollowCourier(false);
    setMapCenter([30.055, 31.325]);
    setMapZoom(12);
    setRecenterTrigger((t) => t + 1);
  };

  // Manual instant sync
  const handleForceSync = () => {
    setSimTick((prev) => prev + 1);
    setLastSyncTime(new Date());
    const timeStr = new Date().toLocaleTimeString('ar-EG');
    setRecentEvents((prev) => [
      `[${timeStr}] 📡 تم استلام إشارة GPS فورية وتحديث مواقع جميع المناديب بنجاح`,
      ...prev.slice(0, 5),
    ]);
  };

  // Selected courier live object
  const selectedCourierData =
    selectedCourierId !== 'ALL' ? courierLivePositions[selectedCourierId] : null;
  const selectedCourierObj =
    selectedCourierId !== 'ALL' ? couriers.find((c) => c.id === selectedCourierId) : null;

  // Live Statistics
  const activeCouriersCount = couriers.filter(
    (c) =>
      courierLivePositions[c.id]?.status === 'ACTIVE' ||
      courierLivePositions[c.id]?.status === 'BUSY_DELIVERING'
  ).length;

  const totalCodInTransit = shipments
    .filter((s) => s.status === 'OUT_FOR_DELIVERY')
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  const outForDeliveryCount = shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden ${className}`}
    >
      {/* Top Header & Live Telemetry Controls */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 shrink-0">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                خريطة التتبع المباشر وتحديث مواقع المناديب
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-700/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>تحديث تلقائي لحظي (React-Leaflet)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              محاكاة حركة حية للمناديب النشطين بالمركبات مع تتبع المسارات ونقاط التسليم والسرعات اللحظية
            </p>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">المناديب النشطون</div>
              <div className="text-sm font-black text-white font-mono">
                {activeCouriersCount} / {couriers.length}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2.5">
            <div className="p-2 bg-purple-950 text-purple-400 rounded-lg shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">قيد التسليم الميداني</div>
              <div className="text-sm font-black text-purple-400 font-mono">
                {outForDeliveryCount} طرد
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2.5">
            <div className="p-2 bg-amber-950 text-amber-400 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">عهدة قيد التحصيل (COD)</div>
              <div className="text-sm font-black text-amber-400 font-mono">
                {totalCodInTransit.toLocaleString()} ج.م
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2.5">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">تم تسليمه اليوم</div>
              <div className="text-sm font-black text-blue-400 font-mono">{deliveredCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry & Simulation Controls Bar */}
      <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* GPS Status & Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Play/Pause Auto-Update */}
          <button
            onClick={() => setIsAutoUpdating(!isAutoUpdating)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isAutoUpdating
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isAutoUpdating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>التحديث التلقائي نشط</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>استئناف التحديث</span>
              </>
            )}
          </button>

          {/* Update frequency interval selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>معدل البث:</span>
            </span>
            {[1, 2, 5].map((sec) => (
              <button
                key={sec}
                onClick={() => setUpdateIntervalSec(sec)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  updateIntervalSec === sec
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sec} ثانية
              </button>
            ))}
          </div>

          {/* Simulation speed multiplier */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>سرعة المحاكاة:</span>
            </span>
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => setSimulationSpeedMultiplier(mult)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  simulationSpeedMultiplier === mult
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>

          {/* Manual Force Refresh */}
          <button
            onClick={handleForceSync}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="طلب تحديث فوري فوري لمواقع GPS الآن"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>تحديث فوري</span>
          </button>
        </div>

        {/* Telemetry metadata tags */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>اتصال GPS: ممتاز (دقة ±2م)</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              آخر نبضة: {lastSyncTime.toLocaleTimeString('ar-EG', { second: '2-digit' })}
            </span>
          </span>
        </div>
      </div>

      {/* Filter & View Toolbar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث برقم الشحنة، المستلم، أو المنطقة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Courier Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>المندوب:</span>
          </span>
          <select
            value={selectedCourierId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCourierId(val);
              if (val !== 'ALL') {
                const data = courierLivePositions[val];
                if (data) {
                  setMapCenter(data.coords);
                  setMapZoom(15);
                  setRecenterTrigger((t) => t + 1);
                }
              }
            }}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
          >
            <option value="ALL">جميع المناديب ({couriers.length})</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.assignedZone || 'منطقة عامة'})
              </option>
            ))}
          </select>
        </div>

        {/* Shipment Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span>الحالة:</span>
          </span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
          >
            <option value="ALL">كافة الحالات ({shipments.length})</option>
            <option value="OUT_FOR_DELIVERY">مع المندوب للتسليم ({outForDeliveryCount})</option>
            <option value="RECEIVED_IN_HUB">بالمستودع الرئيسي</option>
            <option value="PENDING_PICKUP">قيد الاستلام من التاجر</option>
            <option value="DELIVERED">تم التسليم ({deliveredCount})</option>
            <option value="RETURN_PENDING">مرتجع / تسوية</option>
          </select>
        </div>

        {/* Layer Toggles & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCouriers(!showCouriers)}
            className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showCouriers
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-slate-950 text-slate-500 border border-slate-800'
            }`}
            title="إظهار / إخفاء مواقع المناديب"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>المناديب</span>
          </button>

          <button
            onClick={() => setShowShipments(!showShipments)}
            className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showShipments
                ? 'bg-purple-950 text-purple-400 border border-purple-800'
                : 'bg-slate-950 text-slate-500 border border-slate-800'
            }`}
            title="إظهار / إخفاء علامات الشحنات"
          >
            <Package className="w-3.5 h-3.5" />
            <span>الشحنات</span>
          </button>

          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showRoutes
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-slate-950 text-slate-500 border border-slate-800'
            }`}
            title="إظهار / إخفاء مسارات التسليم"
          >
            <Route className="w-3.5 h-3.5" />
            <span>المسارات</span>
          </button>

          <button
            onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
            className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showBreadcrumbs
                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                : 'bg-slate-950 text-slate-500 border border-slate-800'
            }`}
            title="إظهار / إخفاء أثر التحرك اللحظي (Breadcrumbs)"
          >
            <History className="w-3.5 h-3.5" />
            <span>أثر الحركة</span>
          </button>

          {/* Auto-Follow Camera Toggle */}
          {selectedCourierId !== 'ALL' && (
            <button
              onClick={() => setAutoFollowCourier(!autoFollowCourier)}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoFollowCourier
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
              title="تتبع الكاميرا التلقائي لحركة المندوب"
            >
              <Navigation className={`w-3.5 h-3.5 ${autoFollowCourier ? 'animate-spin-slow' : ''}`} />
              <span>متابعة الكاميرا</span>
            </button>
          )}

          {/* Recenter Cairo */}
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="إعادة ضبط الرؤية لكامل القاهرة"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Body with Side Panel */}
      <div className="relative w-full h-[600px] flex">
        {/* Leaflet MapContainer */}
        <div className="flex-1 w-full h-full relative z-10">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ background: '#0b1329' }}
          >
            {/* Tile Layer (OpenStreetMap) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Map controller hook with auto-follow capability */}
            <MapController
              center={mapCenter}
              zoom={mapZoom}
              triggerRecenter={recenterTrigger}
              autoFollowCoords={
                autoFollowCourier && selectedCourierData ? selectedCourierData.coords : null
              }
            />
            <MapResizeHandler />

            {/* Central Logistics Hub Marker */}
            <Marker
              position={[CENTRAL_HUB.lat, CENTRAL_HUB.lng]}
              icon={createHubIcon()}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-3 text-right" dir="rtl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{CENTRAL_HUB.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{CENTRAL_HUB.address}</p>
                  <div className="bg-slate-100 p-2 rounded-lg text-[11px] text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">سعة التوزيع:</span>
                      <span className="font-bold">5,000 طرد/يوم</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">المناديب المسجلين:</span>
                      <span className="font-bold font-mono text-emerald-600">
                        {couriers.length} كابتن
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
                <span className="font-bold text-xs">{CENTRAL_HUB.name}</span>
              </Tooltip>
            </Marker>

            {/* Hub Coverage Radius */}
            {showHubRadius && (
              <Circle
                center={[CENTRAL_HUB.lat, CENTRAL_HUB.lng]}
                radius={4500}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.05,
                  weight: 1.5,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Breadcrumb Trail Polylines (Recent movements) */}
            {showBreadcrumbs &&
              couriers.map((courier) => {
                if (selectedCourierId !== 'ALL' && selectedCourierId !== courier.id) return null;
                const history = breadcrumbsRef.current[courier.id];
                if (!history || history.length < 2) return null;

                return (
                  <Polyline
                    key={`trail-${courier.id}`}
                    positions={history}
                    pathOptions={{
                      color: '#38bdf8',
                      weight: 3,
                      opacity: 0.7,
                      dashArray: '2, 6',
                    }}
                  />
                );
              })}

            {/* Planned Route Polylines */}
            {routePolylines.map((route) => (
              <Polyline
                key={route.id}
                positions={route.positions}
                pathOptions={{
                  color: route.color,
                  weight: route.dashArray ? 2 : 3.5,
                  opacity: 0.85,
                  dashArray: route.dashArray,
                }}
              >
                <Tooltip sticky>
                  <span className="font-bold text-xs">
                    {route.courierName} (خط السير الميداني)
                  </span>
                </Tooltip>
              </Polyline>
            ))}

            {/* Active Courier Markers with Real-Time Updating Positions */}
            {showCouriers &&
              couriers.map((courier) => {
                const liveData = courierLivePositions[courier.id];
                if (!liveData) return null;
                const isSelected = selectedCourierId === courier.id;

                return (
                  <Marker
                    key={courier.id}
                    position={liveData.coords}
                    icon={createCourierIcon(
                      courier,
                      isSelected,
                      liveData.status,
                      liveData.speedKmh,
                      liveData.headingDeg,
                      isAutoUpdating
                    )}
                    eventHandlers={{
                      click: () => handleFocusCourier(courier.id),
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-3 text-right min-w-[240px]" dir="rtl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-bold text-slate-900 text-sm">{courier.name}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                            {courier.id}
                          </span>
                        </div>

                        {/* Current mission highlight */}
                        <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-lg mb-2.5 text-xs text-amber-950">
                          <div className="text-[10px] text-amber-700 font-bold mb-0.5">
                            المهمة الحالية:
                          </div>
                          <div className="font-medium">{liveData.currentMissionText}</div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">حالة التواجد:</span>
                            <span className="font-bold text-emerald-600">
                              {liveData.status === 'BUSY_DELIVERING'
                                ? 'مشغول بتسليم طرد'
                                : liveData.status === 'ON_BREAK'
                                ? 'في استراحة'
                                : 'نشط ومتاح'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">السرعة اللحظية:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {liveData.speedKmh} كم/ساعة
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">الاتجاه / زاوية السير:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {liveData.headingDeg}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">الوقت التقديري للوصول:</span>
                            <span className="font-mono font-bold text-purple-700">
                              ~ {liveData.etaMinutes} دقيقة
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">البطارية:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              %{liveData.batteryLevel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">المركبة:</span>
                            <span className="font-medium text-slate-800">
                              {courier.vehicleType || 'موتوسيكل'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">العهدة النقدية:</span>
                            <span className="font-mono font-bold text-amber-600">
                              {courier.currentCashHeld || 0} ج.م
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-1 border-t border-slate-100">
                          {courier.phone && (
                            <a
                              href={`tel:${courier.phone}`}
                              className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-center text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>اتصال بالكابتن</span>
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCourierId(courier.id);
                              setAutoFollowCourier(true);
                            }}
                            className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-center text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Navigation className="w-3 h-3 text-amber-400" />
                            <span>متابعة حية</span>
                          </button>
                        </div>
                      </div>
                    </Popup>

                    <Tooltip direction="top" offset={[0, -20]}>
                      <span className="font-bold text-xs">
                        {courier.name} ({liveData.speedKmh} كم/س)
                      </span>
                    </Tooltip>
                  </Marker>
                );
              })}

            {/* Shipment Markers */}
            {showShipments &&
              visibleShipments.map((shipment) => {
                const isSelected = activeShipmentId === shipment.id;

                return (
                  <Marker
                    key={shipment.id}
                    position={shipment.coords}
                    icon={createShipmentIcon(shipment, isSelected)}
                    eventHandlers={{
                      click: () => handleFocusShipment(shipment),
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-3 text-right min-w-[240px]" dir="rtl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <span className="font-mono font-black text-slate-900 text-xs">
                            {shipment.trackingNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              shipment.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-purple-100 text-purple-800'
                                : shipment.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : shipment.status === 'PENDING_PICKUP'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {shipment.status === 'OUT_FOR_DELIVERY'
                              ? 'مع المندوب للتسليم'
                              : shipment.status === 'DELIVERED'
                              ? 'تم التسليم'
                              : shipment.status === 'PENDING_PICKUP'
                              ? 'قيد الاستلام'
                              : shipment.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 mb-2.5">
                          <div className="font-bold text-slate-900">{shipment.recipientName}</div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {shipment.city} - {shipment.district || shipment.address}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
                            <span className="text-slate-500">مبلغ التحصيل (COD):</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm">
                              {shipment.codAmount} ج.م
                            </span>
                          </div>
                          {shipment.assignedCourierName && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500">المندوب المسند:</span>
                              <span className="font-bold text-purple-700">
                                {shipment.assignedCourierName}
                              </span>
                            </div>
                          )}
                          {shipment.otpSecret && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500">رمز التحقق OTP:</span>
                              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1 rounded">
                                {shipment.otpSecret}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5 pt-1 border-t border-slate-100">
                          {shipment.recipientPhone && (
                            <a
                              href={`tel:${shipment.recipientPhone}`}
                              className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-center text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>العميل</span>
                            </a>
                          )}
                          <button
                            onClick={() => {
                              if (onSelectShipment) onSelectShipment(shipment);
                            }}
                            className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-center text-xs font-bold transition-colors"
                          >
                            عرض التفاصيل
                          </button>
                        </div>
                      </div>
                    </Popup>

                    <Tooltip direction="top" offset={[0, -20]}>
                      <span className="font-bold text-xs">
                        {shipment.recipientName} ({shipment.codAmount} ج.م)
                      </span>
                    </Tooltip>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>

        {/* Floating Quick Action Drawer / Active Couriers Sidebar */}
        <div className="hidden xl:flex flex-col w-84 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 z-20 overflow-y-auto scrollbar-thin">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">مناديب التوصيل الميداني</h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{activeCouriersCount} متصل</span>
              </span>
            </div>
          </div>

          {/* Selected courier telemetry HUD (if any selected) */}
          {selectedCourierObj && selectedCourierData && (
            <div className="p-3 bg-gradient-to-b from-amber-500/15 to-slate-900 border-b border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{selectedCourierObj.name}</h4>
                    <span className="text-[10px] text-amber-400 font-medium">
                      تتبع مباشر مفعل
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourierId('ALL')}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded border border-slate-700"
                >
                  إلغاء التحديد
                </button>
              </div>

              {/* Speedometer & Live Stats */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800 mb-2">
                <div className="text-center">
                  <div className="text-[9px] text-slate-400">السرعة</div>
                  <div className="text-xs font-black text-white font-mono flex items-center justify-center gap-0.5">
                    <Gauge className="w-3 h-3 text-amber-400" />
                    <span>{selectedCourierData.speedKmh}</span>
                    <span className="text-[9px] text-slate-400">كم/س</span>
                  </div>
                </div>
                <div className="text-center border-x border-slate-800">
                  <div className="text-[9px] text-slate-400">الوصول التقديري</div>
                  <div className="text-xs font-black text-purple-400 font-mono">
                    ~{selectedCourierData.etaMinutes} د
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-slate-400">البطارية</div>
                  <div className="text-xs font-black text-emerald-400 font-mono flex items-center justify-center gap-0.5">
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                    <span>%{selectedCourierData.batteryLevel}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold block mb-0.5">الوجهة القادمة:</span>
                <span>{selectedCourierData.currentMissionText}</span>
              </div>
            </div>
          )}

          {/* Couriers List */}
          <div className="p-2 space-y-2">
            {couriers.map((courier) => {
              const liveData = courierLivePositions[courier.id];
              const isSelected = selectedCourierId === courier.id;

              return (
                <div
                  key={courier.id}
                  onClick={() => handleFocusCourier(courier.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          liveData?.status === 'BUSY_DELIVERING'
                            ? 'bg-purple-900/60 text-purple-300'
                            : liveData?.status === 'ON_BREAK'
                            ? 'bg-amber-900/60 text-amber-300'
                            : 'bg-emerald-900/60 text-emerald-300'
                        }`}
                      >
                        {liveData?.status === 'BUSY_DELIVERING'
                          ? '📦'
                          : courier.vehicleType?.includes('سيارة')
                          ? '🚗'
                          : '🛵'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {courier.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {courier.assignedZone || 'منطقة القاهرة'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        liveData?.status === 'BUSY_DELIVERING'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : liveData?.status === 'ON_BREAK'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {liveData?.status === 'BUSY_DELIVERING'
                        ? 'توصيل'
                        : liveData?.status === 'ON_BREAK'
                        ? 'استراحة'
                        : 'متاح'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <div>
                      <span className="block text-slate-500 text-[9px]">السرعة</span>
                      <span className="font-mono font-bold text-slate-300">
                        {liveData?.speedKmh || 0} كم/س
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[9px]">العهدة</span>
                      <span className="font-mono font-bold text-amber-400">
                        {courier.currentCashHeld || 0} ج.م
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[9px]">الشحنات</span>
                      <span className="font-mono font-bold text-purple-400">
                        {liveData?.assignedShipments.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Telemetry Event Log */}
          <div className="mt-auto p-3 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 mb-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>شريط إشارات GPS اللحظية</span>
            </div>
            <div className="space-y-1 overflow-hidden">
              {recentEvents.slice(0, 3).map((evt, i) => (
                <div
                  key={i}
                  className="text-[10px] text-slate-400 font-mono truncate bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80"
                >
                  {evt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-purple-600 inline-block"></span>
            <span>مع المندوب للتسليم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block"></span>
            <span>تم التسليم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-600 inline-block"></span>
            <span>قيد الاستلام من التاجر</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-600 inline-block"></span>
            <span>بالمستودع الرئيسي</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-600 inline-block"></span>
            <span>مرتجع / تسوية</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <span>
            معروض حالياً: <b className="text-white font-mono">{visibleShipments.length}</b> شحنة
          </span>
          <span>•</span>
          <span>
            <b className="text-white font-mono">{couriers.length}</b> كابتن على الخريطة
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">تحديث تلقائي مستمر</span>
        </div>
      </div>
    </div>
  );
};
