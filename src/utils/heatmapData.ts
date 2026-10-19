import { Shipment, StaffMember } from '../types';

export interface ZoneDefinition {
  id: string;
  name: string;
  shortName: string;
  center: [number, number];
  polygonPoints?: [number, number][];
  defaultCourierId?: string;
  keywords: string[];
}

export const CAIRO_ZONES: ZoneDefinition[] = [
  {
    id: 'ZONE_NASR_CITY',
    name: 'مدينة نصر ومصر الجديدة',
    shortName: 'مدينة نصر',
    center: [30.0652, 31.3415],
    defaultCourierId: 'STF-04',
    keywords: ['مدينة نصر', 'نصر', 'عباس العقاد', 'مكرم عبيد', 'السراج', 'أول العاشر', 'مصر الجديدة', 'روكسي', 'الميرغني', 'النزهة', 'شيراتون', 'العروبة', 'صلاح سالم'],
  },
  {
    id: 'ZONE_NEW_CAIRO',
    name: 'القاهرة الجديدة والتجمع الخامس',
    shortName: 'التجمع الخامس',
    center: [30.0250, 31.4700],
    defaultCourierId: 'STF-04',
    keywords: ['التجمع', 'التجمع الخامس', 'القاهرة الجديدة', 'التجمع الأول', 'التجمع الثالث', 'الرحاب', 'مدينتي', 'المستقبل', 'الشروق', 'التسعين'],
  },
  {
    id: 'ZONE_MAADI',
    name: 'المعادي والمقطم وحلوان',
    shortName: 'المعادي',
    center: [29.9602, 31.2569],
    defaultCourierId: 'STF-05',
    keywords: ['المعادي', 'دجلة', 'كورنيش المعادي', 'البساتين', 'دار السلام', 'حلوان', 'المقطم', 'الهضبة الوسطى', 'النافورة', 'طرة'],
  },
  {
    id: 'ZONE_DOKKI_GIZA',
    name: 'الدقي والمهندسين وأكتوبر',
    shortName: 'الدقي والمهندسين',
    center: [30.0490, 31.2010],
    defaultCourierId: 'STF-06',
    keywords: ['الدقي', 'المهندسين', 'العجوزة', 'مصدق', 'التحرير (الدقي)', 'لبنان', 'جامعة الدول', 'أكتوبر', '6 أكتوبر', 'الشيخ زايد', 'زايد', 'محور 26 يوليو', 'الهرم', 'فيصل', 'الجيزة'],
  },
  {
    id: 'ZONE_DOWNTOWN',
    name: 'وسط البلد وعابدين ورمسيس',
    shortName: 'وسط البلد',
    center: [30.0444, 31.2357],
    defaultCourierId: 'STF-06',
    keywords: ['وسط البلد', 'عابدين', 'التحرير', 'باب اللوق', 'رمسيس', 'الأزبكية', 'الزمالك', 'قصر النيل', 'الفجالة', 'العتبة'],
  },
  {
    id: 'ZONE_SHUBRA_NORTH',
    name: 'شبرا وعين شمس والمرج',
    shortName: 'شبرا',
    center: [30.1150, 31.2550],
    defaultCourierId: 'STF-04',
    keywords: ['شبرا', 'شبرا مصر', 'الساحل', 'الروضة', 'عين شمس', 'المرج', 'المطرية', 'الزيتون', 'حدائق القبة'],
  },
];

export interface OrderHeatPoint {
  id: string;
  trackingNumber: string;
  coords: [number, number];
  weight: number; // 0.1 to 1.0 intensity
  recipientName: string;
  district: string;
  address: string;
  status: string;
  codAmount: number;
  merchantName: string;
  assignedCourierName?: string;
  zoneId: string;
  isUrgent?: boolean;
}

export interface ZoneMetricResult {
  zone: ZoneDefinition;
  totalOrders: number;
  outForDeliveryCount: number;
  pendingPickupCount: number;
  receivedInHubCount: number;
  deliveredCount: number;
  returnCount: number;
  totalCodAmount: number;
  densityScore: number; // 0 - 100%
  densityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  activeCouriers: StaffMember[];
  assignedCouriersCount: number;
  courierCapacityUtilization: number; // percentage
  statusBadgeAr: string;
  badgeColor: string;
  glowColor: string;
  recommendation: string;
  needsSupport: boolean;
  excessCapacity: boolean;
  unassignedOrdersCount: number;
  unassignedTrackingNumbers: string[];
}

export interface SmartAllocationSuggestion {
  sourceZoneName: string;
  targetZoneName: string;
  targetZoneId: string;
  courierId: string;
  courierName: string;
  ordersToReassign: {
    trackingNumber: string;
    recipientName: string;
    address: string;
    codAmount: number;
  }[];
  explanation: string;
  expectedEfficiencyGain: number; // e.g. +18%
}

// Map a shipment address/district to the best matching zone
export function matchShipmentToZone(shp: Shipment): ZoneDefinition {
  const text = `${shp.city} ${shp.district} ${shp.address}`.toLowerCase();

  for (const zone of CAIRO_ZONES) {
    for (const kw of zone.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return zone;
      }
    }
  }

  // Fallback heuristic based on tracking number hash
  const hash = shp.trackingNumber
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackIndex = hash % CAIRO_ZONES.length;
  return CAIRO_ZONES[fallbackIndex];
}

// Generate precise heat points with deterministic micro-offsets within zones
export function generateOrderHeatPoints(shipments: Shipment[]): OrderHeatPoint[] {
  return shipments.map((shp, index) => {
    const zone = matchShipmentToZone(shp);
    
    // Spread coordinates naturally inside zone radius (~1-3 km around center)
    const seed = (shp.trackingNumber.charCodeAt(shp.trackingNumber.length - 1) || index) * 17 + index;
    const angle = (seed % 360) * (Math.PI / 180);
    const distanceFactor = ((seed % 100) / 100) * 0.016 + 0.003; // ~400m to 2.2km offset
    
    const lat = zone.center[0] + Math.cos(angle) * distanceFactor;
    const lng = zone.center[1] + Math.sin(angle) * distanceFactor;

    // Weight calculation based on COD and urgency/status
    let baseWeight = 0.5;
    if (shp.status === 'OUT_FOR_DELIVERY') baseWeight = 0.85;
    else if (shp.status === 'RECEIVED_IN_HUB') baseWeight = 0.65;
    else if (shp.status === 'PENDING_PICKUP') baseWeight = 0.45;
    else if (shp.status === 'RETURN_PENDING') baseWeight = 0.7;

    if (shp.codAmount > 1000) baseWeight = Math.min(1.0, baseWeight + 0.15);
    const isUrgent = shp.orderType === 'EXCHANGE' || shp.status === 'OUT_FOR_DELIVERY';

    return {
      id: shp.id,
      trackingNumber: shp.trackingNumber,
      coords: [lat, lng],
      weight: baseWeight,
      recipientName: shp.recipientName,
      district: shp.district || zone.shortName,
      address: shp.address,
      status: shp.status,
      codAmount: shp.codAmount,
      merchantName: shp.merchantName,
      assignedCourierName: shp.assignedCourierName,
      zoneId: zone.id,
      isUrgent,
    };
  });
}

// Compute comprehensive zone density and operational intelligence
export function computeZoneMetrics(
  shipments: Shipment[],
  staff: StaffMember[]
): {
  zoneMetrics: ZoneMetricResult[];
  overallDensityAverage: number;
  peakHotspotZone: ZoneMetricResult;
  smartSuggestions: SmartAllocationSuggestion[];
  totalActiveOrders: number;
  totalCodInField: number;
} {
  const couriers = staff.filter((s) => s.role === 'COURIER' && s.status !== 'SUSPENDED');

  const zoneBuckets: Record<
    string,
    {
      zone: ZoneDefinition;
      shipments: Shipment[];
      activeCouriers: StaffMember[];
    }
  > = {};

  CAIRO_ZONES.forEach((z) => {
    zoneBuckets[z.id] = {
      zone: z,
      shipments: [],
      activeCouriers: couriers.filter((c) => {
        const zoneMatch = c.assignedZone.includes(z.shortName) || c.assignedZone.includes(z.name);
        return zoneMatch;
      }),
    };
  });

  // Assign shipments to zone buckets
  shipments.forEach((shp) => {
    const matchedZone = matchShipmentToZone(shp);
    if (zoneBuckets[matchedZone.id]) {
      zoneBuckets[matchedZone.id].shipments.push(shp);
    }
  });

  // Process metrics per zone
  const zoneMetrics: ZoneMetricResult[] = CAIRO_ZONES.map((zone) => {
    const bucket = zoneBuckets[zone.id];
    const zoneShipments = bucket.shipments;
    const activeCouriers = bucket.activeCouriers;

    const outForDeliveryCount = zoneShipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
    const pendingPickupCount = zoneShipments.filter((s) => s.status === 'PENDING_PICKUP').length;
    const receivedInHubCount = zoneShipments.filter((s) => s.status === 'RECEIVED_IN_HUB').length;
    const deliveredCount = zoneShipments.filter((s) => s.status === 'DELIVERED').length;
    const returnCount = zoneShipments.filter(
      (s) => s.status === 'RETURN_PENDING' || s.status === 'RETURNED_TO_MERCHANT'
    ).length;

    const totalCodAmount = zoneShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);
    const unassignedOrders = zoneShipments.filter((s) => !s.assignedCourierId && s.status !== 'DELIVERED');
    const unassignedTrackingNumbers = unassignedOrders.map((s) => s.trackingNumber);

    // Calculate density score (0 to 100) based on active volume vs courier fleet
    const activeInField = outForDeliveryCount + receivedInHubCount + pendingPickupCount;
    const courierCount = Math.max(1, activeCouriers.length);
    const loadPerCourier = activeInField / courierCount;

    // Normalize density: 8+ orders/courier in rush time is considered peak
    let densityScore = Math.min(100, Math.round((loadPerCourier / 7) * 85 + (totalCodAmount > 3000 ? 10 : 0)));
    if (densityScore < 15 && activeInField > 0) densityScore = 25;

    let densityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    let statusBadgeAr = 'كثافة هادئة';
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let glowColor = 'rgba(16, 185, 129, 0.4)';
    let recommendation = 'المنطقة مستقرة وتغطيها المناديب بأريحية.';
    let needsSupport = false;
    let excessCapacity = false;

    if (densityScore >= 85) {
      densityLevel = 'CRITICAL';
      statusBadgeAr = 'كثافة حرجة 🔥 (ضغط عالي)';
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-400';
      glowColor = 'rgba(239, 68, 68, 0.55)';
      recommendation = '⚠️ ضغط طلبات استثنائي يفوق طاقة المندوب! يلزم توجيه مندوب إضافي لمنع تأخير التسليم.';
      needsSupport = true;
    } else if (densityScore >= 65) {
      densityLevel = 'HIGH';
      statusBadgeAr = 'كثافة مرتفعة ⚡ (ذروة طلبات)';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-400';
      glowColor = 'rgba(245, 158, 11, 0.5)';
      recommendation = 'نشاط مكثف في التوزيع، يُوصى بمراقبة سرعة الإنجاز وتفريغ العهد النقدية.';
      needsSupport = activeCouriers.length === 0;
    } else if (densityScore >= 40) {
      densityLevel = 'MODERATE';
      statusBadgeAr = 'كثافة متوسطة (متوازنة)';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
      glowColor = 'rgba(59, 130, 246, 0.4)';
      recommendation = 'تغطية منتظمة وسير العمليات ضمن المعدل الطبيعي.';
    } else {
      excessCapacity = true;
      recommendation = 'فائض في الطاقة الاستيعابية. يمكن الاستعانة بمناديب هذا النطاق لإسناد المناطق المضغوطة.';
    }

    const courierCapacityUtilization = Math.min(100, Math.round(loadPerCourier * 14));

    return {
      zone,
      totalOrders: zoneShipments.length,
      outForDeliveryCount,
      pendingPickupCount,
      receivedInHubCount,
      deliveredCount,
      returnCount,
      totalCodAmount,
      densityScore,
      densityLevel,
      activeCouriers,
      assignedCouriersCount: activeCouriers.length,
      courierCapacityUtilization,
      statusBadgeAr,
      badgeColor,
      glowColor,
      recommendation,
      needsSupport,
      excessCapacity,
      unassignedOrdersCount: unassignedOrders.length,
      unassignedTrackingNumbers,
    };
  });

  // Calculate totals
  const totalActiveOrders = shipments.filter((s) => s.status !== 'DELIVERED').length;
  const totalCodInField = shipments.reduce((acc, s) => acc + (s.codAmount || 0), 0);
  const overallDensityAverage = Math.round(
    zoneMetrics.reduce((acc, z) => acc + z.densityScore, 0) / zoneMetrics.length
  );

  // Peak hotspot
  const sortedByDensity = [...zoneMetrics].sort((a, b) => b.densityScore - a.densityScore);
  const peakHotspotZone = sortedByDensity[0] || zoneMetrics[0];

  // Smart allocation recommendations
  const criticalZones = zoneMetrics.filter((z) => z.densityLevel === 'CRITICAL' || z.needsSupport);
  const relaxedZones = zoneMetrics.filter((z) => z.densityLevel === 'LOW' || z.excessCapacity);

  const smartSuggestions: SmartAllocationSuggestion[] = [];

  if (criticalZones.length > 0) {
    const target = criticalZones[0];
    const source = relaxedZones.find((z) => z.activeCouriers.length > 0) || relaxedZones[0] || zoneMetrics[zoneMetrics.length - 1];
    
    // Select an available courier from source or default available
    const availableCourier =
      source?.activeCouriers.find((c) => c.status === 'ACTIVE') ||
      couriers.find((c) => c.status === 'ACTIVE') ||
      couriers[0];

    const unassignedInTarget = shipments
      .filter((s) => matchShipmentToZone(s).id === target.zone.id && s.status !== 'DELIVERED')
      .slice(0, 3)
      .map((s) => ({
        trackingNumber: s.trackingNumber,
        recipientName: s.recipientName,
        address: s.address,
        codAmount: s.codAmount,
      }));

    if (availableCourier) {
      smartSuggestions.push({
        sourceZoneName: source?.zone.name || 'وسط البلد ورمسيس',
        targetZoneName: target.zone.name,
        targetZoneId: target.zone.id,
        courierId: availableCourier.id,
        courierName: availableCourier.name,
        ordersToReassign: unassignedInTarget,
        explanation: `منطقة ${target.zone.name} تسجل كثافة ضغط ${target.densityScore}%، بينما منطقة ${source?.zone.name || 'وسط البلد'} تشهد استقراراً نسبياً. توجيه كابتن ${availableCourier.name} لتغطية ${unassignedInTarget.length || '3'} طلبات سيعيد التوازن اللوجستي.`,
        expectedEfficiencyGain: 19,
      });
    }
  }

  return {
    zoneMetrics,
    overallDensityAverage,
    peakHotspotZone,
    smartSuggestions,
    totalActiveOrders,
    totalCodInField,
  };
}
