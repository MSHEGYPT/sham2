import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck,
  MapPin,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Compass,
  Navigation,
  RefreshCw,
  Phone,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  Flame,
  Zap,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Share2,
} from 'lucide-react';
import { StaffMember, Shipment } from '../types';
import {
  computeZoneMetrics,
  generateOrderHeatPoints,
  CAIRO_ZONES,
  ZoneMetricResult,
  SmartAllocationSuggestion,
  matchShipmentToZone,
} from '../utils/heatmapData';

export type CourierLiveStatus = 'ACTIVE' | 'ON_BREAK' | 'BUSY_DELIVERING' | 'SUSPENDED';

export interface CourierStatusInfo {
  status: CourierLiveStatus;
  labelAr: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  iconBg: string;
  iconSymbol: string;
  activeShipment?: Shipment;
}

export function getCourierStatusInfo(
  courier: StaffMember,
  shipments: Shipment[]
): CourierStatusInfo {
  if (courier.status === 'SUSPENDED') {
    return {
      status: 'SUSPENDED',
      labelAr: 'موقوف إدارياً',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800',
      borderColor: 'border-rose-400',
      dotColor: 'bg-rose-600',
      iconBg: 'bg-rose-500',
      iconSymbol: '⛔',
    };
  }

  if (courier.status === 'ON_BREAK') {
    return {
      status: 'ON_BREAK',
      labelAr: 'في استراحة',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      borderColor: 'border-amber-400',
      dotColor: 'bg-amber-500',
      iconBg: 'bg-amber-500',
      iconSymbol: '☕',
    };
  }

  // Check if courier has an active delivery in progress
  const activeShipment = shipments.find(
    (s) =>
      (s.assignedCourierId === courier.id || s.assignedCourierName === courier.name) &&
      s.status === 'OUT_FOR_DELIVERY'
  );

  if (activeShipment) {
    return {
      status: 'BUSY_DELIVERING',
      labelAr: 'مشغول بتوصيل',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800',
      borderColor: 'border-purple-500',
      dotColor: 'bg-purple-600',
      iconBg: 'bg-purple-600',
      iconSymbol: '📦',
      activeShipment,
    };
  }

  return {
    status: 'ACTIVE',
    labelAr: 'نشط ومتاح',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-600',
    iconSymbol: '🟢',
  };
}

// Preset route checkpoints for Greater Cairo zones
export interface CourierRouteData {
  courierId: string;
  zoneName: string;
  routeColor: string;
  currentLocation: [number, number];
  stops: {
    name: string;
    coords: [number, number];
    type: 'HUB' | 'COMPLETED' | 'CURRENT' | 'PENDING';
    orderId?: string;
    eta?: string;
  }[];
}

const DEFAULT_COURIER_ROUTES: Record<string, CourierRouteData> = {
  'STF-04': {
    courierId: 'STF-04',
    zoneName: 'مدينة نصر ومصر الجديدة',
    routeColor: '#8b5cf6', // Violet
    currentLocation: [30.0652, 31.3415],
    stops: [
      { name: 'المستودع الرئيسي (مشاوير هب - رمسيس)', coords: [30.0444, 31.2357], type: 'HUB' },
      { name: 'صلاح سالم (تم استلام طردين)', coords: [30.052, 31.298], type: 'COMPLETED', orderId: 'SND-8041' },
      { name: 'شارع عباس العقاد (موقع المندوب الآن)', coords: [30.0652, 31.3415], type: 'CURRENT', orderId: 'SND-8042', eta: 'الآن' },
      { name: 'ميدان روكسي (تسليم قادم)', coords: [30.088, 31.332], type: 'PENDING', orderId: 'SND-8045', eta: 'خلال 20 دقيقة' },
      { name: 'أرض الجولف - النزهة', coords: [30.102, 31.345], type: 'PENDING', orderId: 'SND-8049', eta: 'خلال 45 دقيقة' },
    ],
  },
  'STF-05': {
    courierId: 'STF-05',
    zoneName: 'المعادي والمقطم وحلوان',
    routeColor: '#f59e0b', // Amber
    currentLocation: [29.9602, 31.2569],
    stops: [
      { name: 'المستودع الرئيسي (مشاوير هب - رمسيس)', coords: [30.0444, 31.2357], type: 'HUB' },
      { name: 'كورنيش المعادي (تسليم مكتمل)', coords: [29.975, 31.248], type: 'COMPLETED', orderId: 'SND-8038' },
      { name: 'دجلة المعادي (استراحة غداء ومراجعة عهدة)', coords: [29.9602, 31.2569], type: 'CURRENT', eta: 'استراحة مؤقتة 15 د' },
      { name: 'الهضبة الوسطى - المقطم', coords: [29.988, 31.305], type: 'PENDING', orderId: 'SND-8047', eta: 'خلال 35 دقيقة' },
    ],
  },
  'STF-06': {
    courierId: 'STF-06',
    zoneName: 'الدقي والمهندسين وأكتوبر',
    routeColor: '#06b6d4', // Cyan
    currentLocation: [30.049, 31.201],
    stops: [
      { name: 'المستودع الرئيسي (مشاوير هب - رمسيس)', coords: [30.0444, 31.2357], type: 'HUB' },
      { name: 'شارع مصدق - الدقي (تم التسليم)', coords: [30.0385, 31.2115], type: 'COMPLETED', orderId: 'SND-8032' },
      { name: 'ميدان لبنان - المهندسين (جاري التسليم)', coords: [30.049, 31.201], type: 'CURRENT', orderId: 'SND-8044', eta: 'الآن' },
      { name: 'محور 26 يوليو', coords: [30.032, 31.12], type: 'PENDING', orderId: 'SND-8051', eta: 'خلال 30 دقيقة' },
      { name: 'الشيخ زايد - الحي الأول', coords: [30.021, 31.018], type: 'PENDING', orderId: 'SND-8055', eta: 'خلال 55 دقيقة' },
    ],
  },
};

interface CourierFieldRoutesMapProps {
  staff: StaffMember[];
  shipments: Shipment[];
  onSelectShipment?: (shipment: Shipment) => void;
  initialHeatmapActive?: boolean;
  onApplySmartAllocation?: (trackingNumbers: string[], courierId: string) => void;
}

export const CourierFieldRoutesMap: React.FC<CourierFieldRoutesMapProps> = ({
  staff,
  shipments,
  onSelectShipment,
  initialHeatmapActive = false,
  onApplySmartAllocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedCourierId, setSelectedCourierId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CourierLiveStatus>('ALL');
  const [isSimulatingGps, setIsSimulatingGps] = useState(true);
  const [gpsTick, setGpsTick] = useState(0);

  // Heatmap State
  const [isHeatmapActive, setIsHeatmapActive] = useState<boolean>(initialHeatmapActive);
  const [heatmapFilter, setHeatmapFilter] = useState<'ALL' | 'OUT_FOR_DELIVERY' | 'COD_HIGH' | 'URGENT'>('ALL');
  const [showCouriersOnMap, setShowCouriersOnMap] = useState<boolean>(true);
  const [focusedZoneId, setFocusedZoneId] = useState<string | null>(null);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);

  const couriers = staff.filter((s) => s.role === 'COURIER');

  // Filter shipments for heatmap based on selected metric
  const filteredHeatmapShipments = useMemo(() => {
    return shipments.filter((shp) => {
      if (shp.status === 'CANCELLED') return false;
      if (heatmapFilter === 'OUT_FOR_DELIVERY') return shp.status === 'OUT_FOR_DELIVERY';
      if (heatmapFilter === 'COD_HIGH') return shp.codAmount >= 700;
      if (heatmapFilter === 'URGENT') {
        return shp.orderType === 'EXCHANGE' || shp.status === 'OUT_FOR_DELIVERY' || shp.status === 'RETURN_PENDING';
      }
      return true;
    });
  }, [shipments, heatmapFilter]);

  // Compute live zone metrics and smart allocation suggestions
  const {
    zoneMetrics,
    peakHotspotZone,
    smartSuggestions,
    totalActiveOrders,
    totalCodInField,
    overallDensityAverage,
  } = useMemo(() => {
    return computeZoneMetrics(filteredHeatmapShipments, staff);
  }, [filteredHeatmapShipments, staff]);

  // Heat points for individual shipments
  const orderHeatPoints = useMemo(() => {
    return generateOrderHeatPoints(filteredHeatmapShipments);
  }, [filteredHeatmapShipments]);

  // Periodic GPS simulation tick
  useEffect(() => {
    if (!isSimulatingGps) return;
    const interval = setInterval(() => {
      setGpsTick((t) => (t + 1) % 1000);
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulatingGps]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30.0444, 31.245],
        zoom: 12,
        zoomControl: true,
      });

      // CartoDB Voyager tiles (crisp, modern, high contrast for logistics)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      routesLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      heatmapLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers, Routes, and Heatmap Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routesGroup = routesLayerGroupRef.current;
    const markersGroup = markersLayerGroupRef.current;
    const heatmapGroup = heatmapLayerGroupRef.current;

    if (!map || !routesGroup || !markersGroup || !heatmapGroup) return;

    routesGroup.clearLayers();
    markersGroup.clearLayers();
    heatmapGroup.clearLayers();

    // 1. Central Hub Marker (משاوير هب - رمسيس)
    const hubCoords: [number, number] = [30.0444, 31.2357];
    const hubIcon = L.divIcon({
      className: 'custom-hub-marker',
      html: `
        <div style="background-color: #0f172a; color: #fbbf24; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px;">
          🏢
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const hubMarker = L.marker(hubCoords, { icon: hubIcon }).addTo(markersGroup);
    hubMarker.bindPopup(`
      <div style="direction: rtl; font-family: inherit; padding: 6px; text-align: right;">
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
          المستودع اللوجستي الرئيسي (مشاوير هب - رمسيس)
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
          نقطة انطلاق شحنات القاهرة الكبرى وفرز البوالص الذكية
        </div>
        <div style="font-size: 11px; color: #059669; font-weight: bold; background: #ecfdf5; padding: 4px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">
          ✓ جاهزية 100% | فرز متواصل على مدار الساعة
        </div>
      </div>
    `);

    // 2. Render Real-Time Order Density Heatmap Layers
    if (isHeatmapActive) {
      zoneMetrics.forEach((zm) => {
        const isCritical = zm.densityLevel === 'CRITICAL';
        const isHigh = zm.densityLevel === 'HIGH';
        const isModerate = zm.densityLevel === 'MODERATE';

        // Outer ambient Gaussian-like heat glow
        const haloDiameter = isCritical ? 210 : isHigh ? 175 : isModerate ? 140 : 110;
        const radialGradient = isCritical
          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.72) 0%, rgba(220, 38, 38, 0.42) 35%, rgba(239, 68, 68, 0.14) 65%, transparent 100%)'
          : isHigh
          ? 'radial-gradient(circle, rgba(249, 115, 22, 0.72) 0%, rgba(234, 88, 12, 0.42) 35%, rgba(249, 115, 22, 0.12) 65%, transparent 100%)'
          : isModerate
          ? 'radial-gradient(circle, rgba(245, 158, 11, 0.65) 0%, rgba(217, 119, 6, 0.35) 35%, rgba(245, 158, 11, 0.1) 65%, transparent 100%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.3) 35%, rgba(16, 185, 129, 0.08) 65%, transparent 100%)';

        const haloIcon = L.divIcon({
          className: 'zone-heat-halo',
          html: `
            <div style="
              width: ${haloDiameter}px;
              height: ${haloDiameter}px;
              border-radius: 50%;
              background: ${radialGradient};
              filter: blur(8px);
              pointer-events: none;
              transform: translate(-50%, -50%);
              ${isCritical ? 'animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
            "></div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker(zm.zone.center, { icon: haloIcon, interactive: false }).addTo(heatmapGroup);

        // Core Zone Density Interactive Pill Badge
        const badgeBorder = isCritical ? '#ef4444' : isHigh ? '#f97316' : isModerate ? '#f59e0b' : '#10b981';
        const levelBadgeBg = isCritical ? '#fee2e2' : isHigh ? '#ffedd5' : isModerate ? '#fef3c7' : '#d1fae5';
        const levelBadgeText = isCritical ? '#991b1b' : isHigh ? '#9a3412' : isModerate ? '#92400e' : '#065f46';
        const iconEmoji = isCritical ? '🔥' : isHigh ? '⚡' : isModerate ? '📦' : '🟢';

        const zonePillHtml = `
          <div style="
            background: #0f172a;
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 9999px;
            border: 2px solid ${badgeBorder};
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">
            <span>${iconEmoji}</span>
            <span>${zm.zone.shortName}</span>
            <span style="background: ${levelBadgeBg}; color: ${levelBadgeText}; padding: 1.5px 7px; border-radius: 12px; font-size: 10px; font-weight: 800;">
              ${zm.densityScore}% (${zm.totalOrders} طلب)
            </span>
          </div>
        `;

        const zonePillIcon = L.divIcon({
          className: 'custom-zone-pill-marker',
          html: zonePillHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const zoneMarker = L.marker(zm.zone.center, { icon: zonePillIcon }).addTo(heatmapGroup);

        // Rich Popup for Zone Density Breakdown and Dispatch Insights
        const couriersInZoneHtml = zm.activeCouriers.length > 0
          ? zm.activeCouriers.map((c) => `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
                <span style="font-weight: bold; color: #1e293b;">كابتن ${c.name}</span>
                <span style="color: #64748b;">${c.vehicleType === 'CAR' ? '🚗 سيارة' : '🛵 دباب'} | عهدة: ${c.currentCashHeld} ج.م</span>
              </div>
            `).join('')
          : '<div style="font-size: 10px; color: #dc2626; font-weight: bold;">⚠️ لا يوجد مندوب مخصص لهذا النطاق حالياً!</div>';

        zoneMarker.bindPopup(`
          <div style="direction: rtl; font-family: inherit; min-width: 260px; text-align: right; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <div style="font-weight: 900; font-size: 13px; color: #0f172a; display: flex; align-items: center; gap: 4px;">
                <span>${iconEmoji}</span>
                <span>${zm.zone.name}</span>
              </div>
              <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; background: ${levelBadgeBg}; color: ${levelBadgeText};">
                كثافة ${zm.densityScore}%
              </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px;">
              <div style="background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 9px; color: #64748b;">إجمالي الطلبات</div>
                <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${zm.totalOrders} شحنة</div>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 9px; color: #64748b;">تحصيلات COD</div>
                <div style="font-size: 14px; font-weight: 900; color: #059669;">${zm.totalCodAmount} ج.م</div>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 9px; color: #64748b;">مع المندوب للتسليم</div>
                <div style="font-size: 12px; font-weight: 800; color: #7c3aed;">${zm.outForDeliveryCount} طرد</div>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 9px; color: #64748b;">طلبات غير مسندة</div>
                <div style="font-size: 12px; font-weight: 800; color: ${zm.unassignedOrdersCount > 0 ? '#dc2626' : '#64748b'};">${zm.unassignedOrdersCount} طرد</div>
              </div>
            </div>

            <div style="margin-bottom: 8px;">
              <div style="font-size: 10px; font-weight: bold; color: #475569; margin-bottom: 4px;">المناديب في النطاق (${zm.activeCouriers.length}):</div>
              ${couriersInZoneHtml}
            </div>

            <div style="background: ${isCritical ? '#fff1f2' : '#f0fdf4'}; border: 1px solid ${isCritical ? '#fecdd3' : '#bbf7d0'}; border-radius: 8px; padding: 6px; font-size: 10px; color: ${isCritical ? '#9f1239' : '#166534'};">
              <strong>💡 توجيه العمليات الذكي:</strong> ${zm.recommendation}
            </div>
          </div>
        `);

        zoneMarker.on('click', () => {
          setFocusedZoneId(zm.zone.id);
        });
      });

      // Individual Shipment Micro Heat Dots
      orderHeatPoints.forEach((pt) => {
        const dotColor = pt.isUrgent
          ? '#ef4444'
          : pt.status === 'OUT_FOR_DELIVERY'
          ? '#8b5cf6'
          : pt.status === 'RECEIVED_IN_HUB'
          ? '#0284c7'
          : '#10b981';

        const dotMarker = L.circleMarker(pt.coords, {
          radius: 7,
          fillColor: dotColor,
          fillOpacity: 0.85,
          color: '#ffffff',
          weight: 2,
        }).addTo(heatmapGroup);

        dotMarker.bindTooltip(
          `<strong>${pt.trackingNumber}</strong> - ${pt.recipientName} (${pt.district}) | ${pt.codAmount} ج.م`,
          { direction: 'top', sticky: true }
        );

        dotMarker.bindPopup(`
          <div style="direction: rtl; font-family: inherit; padding: 4px; text-align: right;">
            <div style="font-weight: 900; font-size: 12px; color: #0f172a; margin-bottom: 3px;">
              شحنة #${pt.trackingNumber}
            </div>
            <div style="font-size: 11px; color: #475569;">المستلم: <strong>${pt.recipientName}</strong></div>
            <div style="font-size: 10px; color: #64748b;">العنوان: ${pt.address}</div>
            <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 3px;">
              مبلغ التحصيل: ${pt.codAmount} ج.م
            </div>
            <div style="font-size: 10px; color: #7c3aed; margin-top: 2px;">
              المندوب: ${pt.assignedCourierName || 'غير مسند لمندوب'}
            </div>
          </div>
        `);
      });
    }

    // 3. Render Courier Routes & Status Markers (if enabled)
    if (showCouriersOnMap) {
      couriers.forEach((courier, index) => {
        const statusInfo = getCourierStatusInfo(courier, shipments);

        // Filter check
        if (statusFilter !== 'ALL' && statusInfo.status !== statusFilter) return;
        if (selectedCourierId !== 'ALL' && selectedCourierId !== courier.id) return;

        const routeConfig = DEFAULT_COURIER_ROUTES[courier.id] || {
          courierId: courier.id,
          zoneName: courier.assignedZone,
          routeColor: index % 2 === 0 ? '#10b981' : '#f59e0b',
          currentLocation: [
            30.0444 + ((index + 1) * 0.02 - 0.01),
            31.2357 + ((index + 1) * 0.03 - 0.02),
          ],
          stops: [
            { name: 'المستودع الرئيسي (مشاوير هب)', coords: hubCoords, type: 'HUB' as const },
            {
              name: `نقطة تسليم ${courier.assignedZone}`,
              coords: [
                30.0444 + (index + 1) * 0.02,
                31.2357 + (index + 1) * 0.03,
              ] as [number, number],
              type: 'CURRENT' as const,
            },
          ],
        };

        // Slight simulated jitter for live GPS movement simulation
        const jitterLat = isSimulatingGps ? Math.sin((gpsTick + index * 5) * 0.8) * 0.0006 : 0;
        const jitterLng = isSimulatingGps ? Math.cos((gpsTick + index * 5) * 0.8) * 0.0006 : 0;
        const liveCoords: [number, number] = [
          routeConfig.currentLocation[0] + jitterLat,
          routeConfig.currentLocation[1] + jitterLng,
        ];

        // Draw polyline connecting stops
        const polylineCoords = [
          hubCoords,
          ...routeConfig.stops.filter((s) => s.type !== 'HUB').map((s) => s.coords),
        ];

        const polyline = L.polyline(polylineCoords, {
          color: routeConfig.routeColor,
          weight: selectedCourierId === courier.id ? 5 : 3.5,
          opacity: selectedCourierId === courier.id ? 0.95 : 0.65,
          dashArray: statusInfo.status === 'ON_BREAK' ? '8, 8' : undefined,
        }).addTo(routesGroup);

        polyline.bindTooltip(
          `مسار كابتن ${courier.name} (${statusInfo.labelAr})`,
          { direction: 'top', sticky: true }
        );

        // Draw route waypoint dots (stops)
        routeConfig.stops.forEach((stop, stopIdx) => {
          if (stop.type === 'HUB') return;

          const isCurrent = stop.type === 'CURRENT';
          const stopColor =
            stop.type === 'COMPLETED'
              ? '#10b981'
              : stop.type === 'CURRENT'
              ? routeConfig.routeColor
              : '#94a3b8';

          const stopIcon = L.divIcon({
            className: 'stop-waypoint-marker',
            html: `
              <div style="background-color: ${stopColor}; color: #ffffff; width: ${
              isCurrent ? '26px' : '20px'
            }; height: ${
              isCurrent ? '26px' : '20px'
            }; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
                ${stopIdx}
              </div>
            `,
            iconSize: [isCurrent ? 26 : 20, isCurrent ? 26 : 20],
            iconAnchor: [isCurrent ? 13 : 10, isCurrent ? 13 : 10],
          });

          const stopMarker = L.marker(stop.coords, { icon: stopIcon }).addTo(markersGroup);
          stopMarker.bindPopup(`
            <div style="direction: rtl; font-family: inherit; padding: 4px; text-align: right;">
              <div style="font-size: 11px; font-weight: bold; color: #1e293b;">
                محطة #${stopIdx}: ${stop.name}
              </div>
              ${
                stop.orderId
                  ? `<div style="font-size: 10px; color: #6366f1; font-family: monospace; font-weight: bold; margin-top: 2px;">بوليصة: ${stop.orderId}</div>`
                  : ''
              }
              ${
                stop.eta
                  ? `<div style="font-size: 10px; color: #059669; margin-top: 2px;">توقيت: ${stop.eta}</div>`
                  : ''
              }
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">مندوب الخط: ${courier.name}</div>
            </div>
          `);
        });

        // Live Courier Marker with Visual Indicator
        const statusIconSvg =
          statusInfo.status === 'ACTIVE'
            ? '<span style="background: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; display: inline-block;"></span>'
            : statusInfo.status === 'ON_BREAK'
            ? '<span style="background: #f59e0b; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 8px;">☕</span>'
            : statusInfo.status === 'BUSY_DELIVERING'
            ? '<span style="background: #9333ea; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 8px;">📦</span>'
            : '<span style="background: #e11d48; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; display: inline-block;"></span>';

        const courierMarkerHtml = `
          <div style="position: relative; width: 48px; height: 56px; cursor: pointer;">
            <!-- Pin Container -->
            <div style="position: absolute; top: 0; left: 0; width: 44px; height: 44px; border-radius: 50%; border: 3px solid ${routeConfig.routeColor}; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <img src="${courier.avatar}" alt="${courier.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            
            <!-- Visual Status Indicator Badge -->
            <div style="position: absolute; top: -3px; right: -2px; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              ${statusIconSvg}
            </div>

            <!-- Vehicle Type Mini Badge -->
            <div style="position: absolute; bottom: 2px; left: 10px; background: #0f172a; color: #fbbf24; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 6px; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ${courier.vehicleType === 'CAR' ? '🚗' : '🛵'}
            </div>

            <!-- Radar Pulse Effect when Busy delivering -->
            ${
              statusInfo.status === 'BUSY_DELIVERING'
                ? `<div style="position: absolute; top: -6px; left: -6px; width: 56px; height: 56px; border-radius: 50%; border: 2px solid ${routeConfig.routeColor}; opacity: 0.7; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>`
                : ''
            }
          </div>
        `;

        const courierIcon = L.divIcon({
          className: 'custom-courier-live-marker',
          html: courierMarkerHtml,
          iconSize: [48, 56],
          iconAnchor: [24, 28],
        });

        const courierMarker = L.marker(liveCoords, { icon: courierIcon }).addTo(markersGroup);

        courierMarker.bindTooltip(
          `<strong>كابتن ${courier.name}</strong> - <span style="color: ${
            routeConfig.routeColor
          }; font-weight: bold;">${statusInfo.labelAr}</span>`,
          { direction: 'top', offset: [0, -26] }
        );

        const activeShipmentHtml = statusInfo.activeShipment
          ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-top: 8px;">
              <div style="font-size: 11px; font-weight: bold; color: #0f172a; display: flex; align-items: center; justify-content: space-between;">
                <span>طرد قيد التسليم الآن:</span>
                <span style="font-family: monospace; color: #7c3aed; font-weight: 800;">${statusInfo.activeShipment.trackingNumber}</span>
              </div>
              <div style="font-size: 10px; color: #475569; margin-top: 3px;">المستلم: ${statusInfo.activeShipment.recipientName} (${statusInfo.activeShipment.city})</div>
              <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 2px;">مبلغ التحصيل (COD): ${statusInfo.activeShipment.codAmount} ج.م</div>
            </div>
          `
          : '';

        courierMarker.bindPopup(`
          <div style="direction: rtl; font-family: inherit; min-width: 230px; text-align: right; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #0f172a;">كابتن ${courier.name}</div>
                <div style="font-size: 10px; color: #64748b;">نطاق: ${courier.assignedZone}</div>
              </div>
              <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; background: ${
                statusInfo.status === 'ACTIVE'
                  ? '#dcfce7; color: #15803d;'
                  : statusInfo.status === 'ON_BREAK'
                  ? '#fef3c7; color: #b45309;'
                  : statusInfo.status === 'BUSY_DELIVERING'
                  ? '#f3e8ff; color: #7e22ce;'
                  : '#ffe4e6; color: #be123c;'
              }">
                ${statusInfo.iconSymbol} ${statusInfo.labelAr}
              </span>
            </div>

            <div style="font-size: 11px; color: #334155; line-height: 1.6;">
              <div>📱 <strong>الهاتف:</strong> <span style="font-family: monospace;">${courier.phone}</span></div>
              <div>🛵 <strong>المركبة:</strong> ${courier.vehicleType === 'CAR' ? 'سيارة' : 'دراجة نارية'} (${courier.vehiclePlate || 'بدون لوحة'})</div>
              <div>💰 <strong>العهدة النقدية الحالية:</strong> <span style="font-weight: bold; color: #0f172a;">${courier.currentCashHeld} ج.م</span> / السقف: ${courier.maxCashLimit} ج.م</div>
              <div>⭐ <strong>نسبة النجاح:</strong> ${courier.successRate}% (${courier.totalDelivered} طرد مُسلم)</div>
            </div>

            ${activeShipmentHtml}

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; display: flex; align-items: center; justify-content: space-between;">
              <span>إحداثيات GPS المباشرة:</span>
              <span style="font-family: monospace;">${liveCoords[0].toFixed(4)}, ${liveCoords[1].toFixed(4)}</span>
            </div>
          </div>
        `);
      });
    }
  }, [
    couriers,
    shipments,
    selectedCourierId,
    statusFilter,
    gpsTick,
    isSimulatingGps,
    isHeatmapActive,
    heatmapFilter,
    showCouriersOnMap,
    zoneMetrics,
    orderHeatPoints,
  ]);

  // Fly to specific courier
  const handleFlyToCourier = (courierId: string) => {
    setSelectedCourierId(courierId);
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return;

    const routeConfig = DEFAULT_COURIER_ROUTES[courierId];
    if (routeConfig && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(routeConfig.currentLocation, 14, {
        duration: 1.2,
      });
    }
  };

  // Fly to specific zone
  const handleFlyToZone = (zoneCenter: [number, number], zoneId: string) => {
    setFocusedZoneId(zoneId);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(zoneCenter, 13.5, { duration: 1.2 });
    }
  };

  const handleResetView = () => {
    setSelectedCourierId('ALL');
    setStatusFilter('ALL');
    setFocusedZoneId(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([30.0444, 31.245], 12, { duration: 1 });
    }
  };

  // Handle applying smart zone allocation
  const handleExecuteSmartAllocation = (suggestion: SmartAllocationSuggestion) => {
    if (onApplySmartAllocation && suggestion.ordersToReassign.length > 0) {
      onApplySmartAllocation(
        suggestion.ordersToReassign.map((o) => o.trackingNumber),
        suggestion.courierId
      );
    }
    setAppliedSuccessMsg(
      `تم إسناد ${suggestion.ordersToReassign.length || 3} شحنات تلقائياً إلى كابتن ${suggestion.courierName} في نطاق ${suggestion.targetZoneName} بنجاح وتحقيق التوازن بنسبة 96%!`
    );
    setTimeout(() => setAppliedSuccessMsg(null), 6000);
  };

  // Status statistics counts
  const activeCount = couriers.filter(
    (c) => getCourierStatusInfo(c, shipments).status === 'ACTIVE'
  ).length;
  const busyCount = couriers.filter(
    (c) => getCourierStatusInfo(c, shipments).status === 'BUSY_DELIVERING'
  ).length;
  const breakCount = couriers.filter(
    (c) => getCourierStatusInfo(c, shipments).status === 'ON_BREAK'
  ).length;
  const suspendedCount = couriers.filter(
    (c) => getCourierStatusInfo(c, shipments).status === 'SUSPENDED'
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-0">
      {/* 1. Header Toolbar with Heatmap Controls */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-white">
                رادار التتبع الميداني والخريطة الحرارية لكثافة الطلبات
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                إحداثيات لحظية Live GPS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              مراقبة حركة مناديب التوصيل، مؤشرات الكثافة الحرارية، والتوزيع الذكي للمناطق في القاهرة الكبرى
            </p>
          </div>
        </div>

        {/* Action Controls & Heatmap Trigger */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Heatmap Layer Toggle Button */}
          <button
            onClick={() => setIsHeatmapActive(!isHeatmapActive)}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isHeatmapActive
                ? 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white ring-2 ring-amber-400/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="تبديل عرض طبقة الخريطة الحرارية وتوزيع الكثافة"
          >
            <Flame className={`w-4 h-4 ${isHeatmapActive ? 'text-amber-200 animate-pulse' : 'text-amber-400'}`} />
            <span>الخريطة الحرارية للطلبات</span>
            {isHeatmapActive ? (
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            ) : (
              <span className="bg-slate-700 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-md">جديد</span>
            )}
          </button>

          {/* Courier Overlay Toggle */}
          {isHeatmapActive && (
            <button
              onClick={() => setShowCouriersOnMap(!showCouriersOnMap)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showCouriersOnMap
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="إظهار أو إخفاء أيقونات ومسارات المناديب"
            >
              {showCouriersOnMap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showCouriersOnMap ? 'طبقة المناديب: مفعلة' : 'طبقة المناديب: مخفية'}</span>
            </button>
          )}

          {/* GPS Simulation Toggle */}
          <button
            onClick={() => setIsSimulatingGps(!isSimulatingGps)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSimulatingGps
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="تشغيل/إيقاف محاكاة النبضات الحركية للـ GPS"
          >
            {isSimulatingGps ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isSimulatingGps ? 'بث GPS نشط' : 'متوقف مؤقتاً'}</span>
          </button>

          {/* Reset Map View */}
          <button
            onClick={handleResetView}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>إعادة ضبط العرض</span>
          </button>
        </div>
      </div>

      {/* 2. Success Banner on Smart Allocation */}
      {appliedSuccessMsg && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-inner animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 bg-white text-emerald-600 rounded-full p-0.5" />
            <span>{appliedSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAppliedSuccessMsg(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Heatmap Intelligence & Zone Operations Dashboard Bar */}
      {isHeatmapActive && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3.5 border-b border-slate-800 space-y-3">
          {/* Top Row: Metrics Overview + Filter Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Quick KPI Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  أعلى بؤرة كثافة:
                </span>
                <span className="font-bold text-white">{peakHotspotZone?.zone.name}</span>
                <span className="bg-rose-500/30 text-rose-300 text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                  {peakHotspotZone?.densityScore}% 🔥
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400">إجمالي شحنات الميدان:</span>
                <span className="font-mono font-black text-amber-400">{filteredHeatmapShipments.length} شحنة</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400">تحصيلات COD المعروضة:</span>
                <span className="font-mono font-bold text-emerald-400">{totalCodInField} ج.م</span>
              </div>
            </div>

            {/* Heatmap Metric Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0 text-xs">
              <span className="text-[11px] text-slate-400 whitespace-nowrap ml-1">تصفية الكثافة:</span>
              <button
                onClick={() => setHeatmapFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  heatmapFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                كافة الطلبات ({shipments.length})
              </button>
              <button
                onClick={() => setHeatmapFilter('OUT_FOR_DELIVERY')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  heatmapFilter === 'OUT_FOR_DELIVERY'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Package className="w-3 h-3" />
                <span>قيد التسليم الفعلي</span>
              </button>
              <button
                onClick={() => setHeatmapFilter('COD_HIGH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  heatmapFilter === 'COD_HIGH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>كثافة النقدية (COD &gt; 700)</span>
              </button>
              <button
                onClick={() => setHeatmapFilter('URGENT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  heatmapFilter === 'URGENT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                <span>عاجلة / استبدال</span>
              </button>
            </div>
          </div>

          {/* Smart Allocation Suggestion Card */}
          {smartSuggestions.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-slate-800 border border-amber-500/30 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>توصية خوارزمية التوزيع الذكي للمناطق (Smart Zone Dispatch)</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded-full font-mono">
                      كفاءة متوقعة +{smartSuggestions[0].expectedEfficiencyGain}%
                    </span>
                  </div>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    {smartSuggestions[0].explanation}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleExecuteSmartAllocation(smartSuggestions[0])}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer text-xs"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950" />
                <span>تطبيق التوزيع الذكي الفوري للمناديب</span>
              </button>
            </div>
          )}

          {/* Zone Quick-Jump Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">التركيز على منطقة:</span>
            {zoneMetrics.map((zm) => {
              const isSelected = focusedZoneId === zm.zone.id;
              const isCrit = zm.densityLevel === 'CRITICAL';
              const isHigh = zm.densityLevel === 'HIGH';

              return (
                <button
                  key={zm.zone.id}
                  onClick={() => handleFlyToZone(zm.zone.center, zm.zone.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                      : isCrit
                      ? 'bg-rose-950/70 text-rose-300 border-rose-800 hover:bg-rose-900'
                      : isHigh
                      ? 'bg-amber-950/70 text-amber-300 border-amber-800 hover:bg-amber-900'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>{isCrit ? '🔥' : isHigh ? '⚡' : '📍'}</span>
                  <span>{zm.zone.shortName}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    ({zm.totalOrders} طلب | {zm.densityScore}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Courier Status Indicators Legend & Filters Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 ml-1">تصفية بحالة المندوب:</span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            الكل ({couriers.length})
          </button>

          {/* BUSY DELIVERING */}
          <button
            onClick={() => setStatusFilter('BUSY_DELIVERING')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'BUSY_DELIVERING'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
            <span>مشغول بتوصيل</span>
            <span className="bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-full text-[10px]">
              {busyCount}
            </span>
          </button>

          {/* ACTIVE & READY */}
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>نشط ومتاح</span>
            <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px]">
              {activeCount}
            </span>
          </button>

          {/* ON BREAK */}
          <button
            onClick={() => setStatusFilter('ON_BREAK')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'ON_BREAK'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="text-[11px]">☕</span>
            <span>في استراحة</span>
            <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">
              {breakCount}
            </span>
          </button>

          {/* SUSPENDED */}
          {suspendedCount > 0 && (
            <button
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'SUSPENDED'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>موقوف</span>
              <span className="bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full text-[10px]">
                {suspendedCount}
              </span>
            </button>
          )}
        </div>

        {/* Legend Hint */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
          {isHeatmapActive ? (
            <>
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                أحمر: كثافة حرجة &gt; 85%
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                برتقالي: ذروة 65-85%
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                أخضر: كثافة متوازنة
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                بنفسجي: طرد قيد التوصيل
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                أخضر: جاهز ومتاح
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                أصفر: استراحة مؤقتة
              </span>
            </>
          )}
        </div>
      </div>

      {/* 5. Main Map and Couriers / Zone Analytics Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[520px]">
        {/* Sidebar Panel (Switches between Couriers or Zone Analytics) */}
        <div className="p-3.5 bg-slate-50/80 border-b lg:border-b-0 lg:border-l border-slate-200 space-y-2.5 overflow-y-auto max-h-[600px]">
          <div className="flex items-center justify-between text-xs text-slate-700 px-1">
            <span className="font-bold flex items-center gap-1">
              {isHeatmapActive ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>مناطق الكثافة ({zoneMetrics.length}):</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  <span>مناديب الميدان ({couriers.length}):</span>
                </>
              )}
            </span>
            <span className="text-[11px] text-slate-400">انقر للتركيز</span>
          </div>

          {/* When Heatmap is Active: Zone Analytics Cards */}
          {isHeatmapActive ? (
            <div className="space-y-2">
              {zoneMetrics.map((zm) => {
                const isSelected = focusedZoneId === zm.zone.id;
                const isCrit = zm.densityLevel === 'CRITICAL';
                const isHigh = zm.densityLevel === 'HIGH';

                return (
                  <div
                    key={zm.zone.id}
                    onClick={() => handleFlyToZone(zm.zone.center, zm.zone.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCrit
                              ? 'bg-rose-100 text-rose-600'
                              : isHigh
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {isCrit ? '🔥' : isHigh ? '⚡' : '📍'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {zm.zone.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {zm.totalOrders} شحنة • {zm.totalCodAmount} ج.م COD
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${zm.badgeColor}`}
                      >
                        {zm.densityScore}%
                      </span>
                    </div>

                    {/* Density Meter Bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>مؤشر ضغط الطلبات:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {zm.outForDeliveryCount} قيد التسليم
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCrit
                              ? 'bg-rose-500'
                              : isHigh
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${zm.densityScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Couriers assigned in zone */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">المناديب: </span>
                        <span className="font-bold text-slate-800">
                          {zm.activeCouriers.length > 0
                            ? zm.activeCouriers.map((c) => c.name).join('، ')
                            : 'لا يوجد مندوب'}
                        </span>
                      </div>

                      {zm.needsSupport && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                          بحاجة لدعم
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard Couriers List */
            <div className="space-y-2">
              {couriers.map((courier) => {
                const statusInfo = getCourierStatusInfo(courier, shipments);
                const routeConfig = DEFAULT_COURIER_ROUTES[courier.id];
                const isSelected = selectedCourierId === courier.id;

                return (
                  <div
                    key={courier.id}
                    onClick={() => handleFlyToCourier(courier.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={courier.avatar}
                            alt={courier.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <span
                            className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusInfo.dotColor}`}
                            title={statusInfo.labelAr}
                          ></span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {courier.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{courier.assignedZone}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.borderColor}`}
                      >
                        <span>{statusInfo.iconSymbol}</span>
                        <span>{statusInfo.labelAr}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">المركبة: </span>
                        <span className="font-bold text-slate-800">
                          {courier.vehicleType === 'CAR' ? 'سيارة' : 'دراجة نارية'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400">العهدة: </span>
                        <span className="font-mono font-bold text-slate-900">
                          {courier.currentCashHeld} ج.م
                        </span>
                      </div>
                    </div>

                    {statusInfo.activeShipment && (
                      <div className="mt-2 p-1.5 bg-purple-50 rounded-lg border border-purple-200 text-[10px] text-purple-900 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          <Package className="w-3 h-3 text-purple-600" />
                          طرد: {statusInfo.activeShipment.trackingNumber}
                        </span>
                        <span className="font-mono text-purple-700">
                          {statusInfo.activeShipment.codAmount} ج.م
                        </span>
                      </div>
                    )}

                    <div
                      className="mt-2 h-1 rounded-full w-full opacity-70"
                      style={{ backgroundColor: routeConfig?.routeColor || '#cbd5e1' }}
                    ></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Map Canvas (3 Columns) */}
        <div className="lg:col-span-3 relative h-[480px] lg:h-auto min-h-[480px] w-full">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-xs max-w-xs pointer-events-auto hidden sm:block">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2 pb-1.5 border-b border-slate-100">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>مفاتيح الخريطة والرموز:</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  🏢
                </span>
                <span>المستودع الرئيسي (مشاوير هب - رمسيس)</span>
              </div>

              {isHeatmapActive ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white"></span>
                    <span>بؤرة كثافة حرجة (ضغط عالي &gt; 85%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white"></span>
                    <span>كثافة مرتفعة (ذروة طلبات 65-85%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white"></span>
                    <span>كثافة منخفضة / معتدلة</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-white flex items-center justify-center text-[8px] text-white">
                      📦
                    </span>
                    <span>مندوب ميداني في مهمة تسليم طرد نشطة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white"></span>
                    <span>مندوب نشط ومتاح لإسناد شحنات جديدة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] text-white">
                      ☕
                    </span>
                    <span>مندوب في استراحة مصرح بها</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
