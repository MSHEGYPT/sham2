import { Shipment, StaffMember, PickupSchedule } from '../types';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface RouteStop {
  sequence: number;
  type: 'DELIVERY' | 'PICKUP';
  shipment?: Shipment;
  pickup?: PickupSchedule;
  title: string;
  recipientOrMerchant: string;
  address: string;
  coordinates: GeoLocation;
  distanceFromPreviousKm: number;
  estimatedArrivalMins: number;
  status: string;
}

export interface SuggestedRoute {
  courierId: string;
  courierName: string;
  startPoint: GeoLocation;
  startPointLabel: string;
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedTotalTimeMins: number;
  polylineCoords: [number, number][];
}

// Central Logistics Hub (Cairo Central Sorting Center)
export const CENTRAL_HUB: GeoLocation & { name: string; address: string } = {
  lat: 30.0620,
  lng: 31.3320,
  name: 'المستودع الرئيسي - مركز الفرز المركزي',
  address: 'شارع النصر، مدينة نصر، القاهرة',
};

// District coordinates directory
const DISTRICT_COORDINATES: Record<string, GeoLocation> = {
  'مدينة نصر': { lat: 30.0560, lng: 31.3450 },
  'مصر الجديدة': { lat: 30.0880, lng: 31.3280 },
  'المعادي': { lat: 29.9602, lng: 31.2780 },
  'المقطم': { lat: 30.0150, lng: 31.3020 },
  'حلوان': { lat: 29.8450, lng: 31.3320 },
  'الدقي': { lat: 30.0380, lng: 31.2120 },
  'المهندسين': { lat: 30.0520, lng: 31.2010 },
  'التجمع الخامس': { lat: 30.0240, lng: 31.4720 },
  'القاهرة الجديدة': { lat: 30.0300, lng: 31.4850 },
  'الهرم': { lat: 29.9980, lng: 31.1850 },
  'الجيزة': { lat: 30.0131, lng: 31.2089 },
  'شبرا': { lat: 30.0890, lng: 31.2450 },
  'وسط البلد': { lat: 30.0444, lng: 31.2357 },
  'الزمالك': { lat: 30.0610, lng: 31.2200 },
  'العجوزة': { lat: 30.0570, lng: 31.2110 },
  'أكتوبر': { lat: 29.9720, lng: 30.9420 },
  'الشيخ زايد': { lat: 30.0350, lng: 31.0050 },
  'عين شمس': { lat: 30.1310, lng: 31.3250 },
  'المطرية': { lat: 30.1250, lng: 31.3140 },
  'العباسية': { lat: 30.0690, lng: 31.2820 },
  'لوران': { lat: 31.2450, lng: 29.9700 },
  'سموحة': { lat: 31.2150, lng: 29.9450 },
};

// Courier default starting bases
export const COURIER_BASES: Record<string, GeoLocation & { label: string }> = {
  'STF-04': {
    lat: 30.0635,
    lng: 31.3360,
    label: 'نقطة انطلاق كابتن حسام البدري (مدينة نصر)',
  },
  'STF-05': {
    lat: 29.9650,
    lng: 31.2820,
    label: 'نقطة انطلاق كابتن كريم عبد العاطي (دجلة المعادي)',
  },
  'STF-06': {
    lat: 30.0395,
    lng: 31.2135,
    label: 'نقطة انطلاق كابتن إسلام نبيل (ميدان المساحة - الدقي)',
  },
};

/**
 * Deterministic pseudo-random jitter so shipments in the same district don't sit on the exact same pixel
 */
function getJitter(str: string, index: number): { latOffset: number; lngOffset: number } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const factor = ((Math.abs(hash) % 100) + index * 17) % 100;
  // Offset by up to ~450 meters (0.004 degrees)
  const angle = (factor / 100) * 2 * Math.PI;
  const radius = 0.002 + (factor / 100) * 0.0035;
  return {
    latOffset: Math.sin(angle) * radius,
    lngOffset: Math.cos(angle) * radius,
  };
}

/**
 * Resolves precise coordinates for a shipment
 */
export function getShipmentCoordinates(shipment: Shipment, index: number = 0): GeoLocation {
  if (shipment.coordinates && shipment.coordinates.lat && shipment.coordinates.lng) {
    return shipment.coordinates;
  }

  // Check matching district
  const districtKey = Object.keys(DISTRICT_COORDINATES).find(
    (k) => shipment.district?.includes(k) || shipment.address?.includes(k)
  );

  const base = districtKey
    ? DISTRICT_COORDINATES[districtKey]
    : shipment.city?.includes('الجيزة')
    ? DISTRICT_COORDINATES['الجيزة']
    : shipment.city?.includes('الإسكندرية')
    ? DISTRICT_COORDINATES['سموحة']
    : CENTRAL_HUB;

  const jitter = getJitter(shipment.trackingNumber || shipment.id, index);
  return {
    lat: Number((base.lat + jitter.latOffset).toFixed(6)),
    lng: Number((base.lng + jitter.lngOffset).toFixed(6)),
  };
}

/**
 * Resolves precise coordinates for a merchant pickup request
 */
export function getPickupCoordinates(pickup: PickupSchedule, index: number = 0): GeoLocation {
  const districtKey = Object.keys(DISTRICT_COORDINATES).find(
    (k) => pickup.merchantAddress?.includes(k) || pickup.city?.includes(k)
  );

  const base = districtKey
    ? DISTRICT_COORDINATES[districtKey]
    : pickup.city?.includes('الجيزة')
    ? DISTRICT_COORDINATES['الجيزة']
    : CENTRAL_HUB;

  const jitter = getJitter(pickup.id || pickup.merchantName, index + 42);
  return {
    lat: Number((base.lat + jitter.latOffset).toFixed(6)),
    lng: Number((base.lng + jitter.lngOffset).toFixed(6)),
  };
}

/**
 * Returns courier current starting position
 */
export function getCourierBaseLocation(courier: StaffMember): GeoLocation & { label: string } {
  if (COURIER_BASES[courier.id]) {
    return COURIER_BASES[courier.id];
  }

  // Fallback based on assigned zone
  const matchingKey = Object.keys(DISTRICT_COORDINATES).find((k) =>
    courier.assignedZone?.includes(k)
  );
  if (matchingKey) {
    const base = DISTRICT_COORDINATES[matchingKey];
    return {
      lat: base.lat,
      lng: base.lng,
      label: `نقطة تمركز ${courier.name} (${matchingKey})`,
    };
  }

  return {
    lat: CENTRAL_HUB.lat,
    lng: CENTRAL_HUB.lng,
    label: `المركز اللوجستي الرئيسي (${courier.name})`,
  };
}

/**
 * Haversine formula to compute distance in km
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Creates realistic intermediate routing waypoints between two points
 * to simulate navigation along road corridors rather than unrealistic straight lines
 */
function createCurvedWaypoints(
  start: GeoLocation,
  end: GeoLocation,
  subdivisions: number = 3
): [number, number][] {
  const points: [number, number][] = [[start.lat, start.lng]];

  // Slight Manhattan / road grid adjustment
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  // Add realistic street turn offset
  const latDelta = end.lat - start.lat;
  const lngDelta = end.lng - start.lng;
  const turnOffsetLat = -lngDelta * 0.15;
  const turnOffsetLng = latDelta * 0.15;

  const intermediate1: [number, number] = [
    start.lat + latDelta * 0.35 + turnOffsetLat,
    start.lng + lngDelta * 0.35 + turnOffsetLng,
  ];

  const intermediate2: [number, number] = [
    start.lat + latDelta * 0.7 - turnOffsetLat * 0.5,
    start.lng + lngDelta * 0.7 - turnOffsetLng * 0.5,
  ];

  points.push(intermediate1);
  points.push(intermediate2);
  points.push([end.lat, end.lng]);

  return points;
}

/**
 * Solves Traveling Salesperson Problem (Greedy nearest-neighbor)
 * and generates a suggested optimized route with polyline & timing
 */
export function generateSuggestedRoute(
  courier: StaffMember,
  shipments: Shipment[],
  pickups: PickupSchedule[] = []
): SuggestedRoute {
  const startBase = getCourierBaseLocation(courier);
  const startPoint: GeoLocation = { lat: startBase.lat, lng: startBase.lng };

  // Filter relevant shipments for routing: exclude cancelled or returned_to_merchant
  const targetShipments = shipments.filter(
    (s) => s.status !== 'CANCELLED' && s.status !== 'RETURNED_TO_MERCHANT'
  );

  // Filter active pickups assigned to courier (or in courier zone)
  const targetPickups = pickups.filter(
    (p) =>
      p.status !== 'CANCELLED' &&
      (p.assignedCourierId === courier.id ||
        p.assignedCourierName === courier.name ||
        courier.assignedZone?.includes(p.city))
  );

  if (targetShipments.length === 0 && targetPickups.length === 0) {
    return {
      courierId: courier.id,
      courierName: courier.name,
      startPoint,
      startPointLabel: startBase.label,
      stops: [],
      totalDistanceKm: 0,
      estimatedTotalTimeMins: 0,
      polylineCoords: [[startPoint.lat, startPoint.lng]],
    };
  }

  // Pre-calculate coordinates for each delivery shipment
  const shipmentItems = targetShipments.map((s, idx) => ({
    type: 'DELIVERY' as const,
    shipment: s,
    title: `تسليم طرد #${s.trackingNumber}`,
    recipientOrMerchant: s.recipientName,
    address: `${s.district} - ${s.address}`,
    status: s.status,
    coords: getShipmentCoordinates(s, idx),
  }));

  // Pre-calculate coordinates for each merchant pickup
  const pickupItems = targetPickups.map((p, idx) => ({
    type: 'PICKUP' as const,
    pickup: p,
    title: `استلام بضائع (${p.expectedParcelsCount} طرد)`,
    recipientOrMerchant: `متجر ${p.merchantName}`,
    address: `${p.city} - ${p.merchantAddress}`,
    status: p.status,
    coords: getPickupCoordinates(p, idx),
  }));

  // Combine items to be sequenced
  const unvisited = [...shipmentItems, ...pickupItems];
  const stops: RouteStop[] = [];
  let currentPos = startPoint;
  let accumulatedDistance = 0;
  let accumulatedTime = 0;
  const polylineCoords: [number, number][] = [[startPoint.lat, startPoint.lng]];

  let seq = 1;
  while (unvisited.length > 0) {
    // Score based on distance + status priority weight
    let bestIndex = 0;
    let minScore = Infinity;
    let bestDist = 0;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      const dist = calculateDistanceKm(
        currentPos.lat,
        currentPos.lng,
        candidate.coords.lat,
        candidate.coords.lng
      );

      // Status weight
      let statusWeight = 1.0;
      if (candidate.type === 'PICKUP') {
        // Pickups in the morning/early in route are convenient
        statusWeight = candidate.status === 'COMPLETED' ? 2.5 : 0.85;
      } else if (candidate.type === 'DELIVERY') {
        if (candidate.shipment.status === 'OUT_FOR_DELIVERY') statusWeight = 0.9;
        else if (candidate.shipment.status === 'RETURN_PENDING') statusWeight = 1.1;
        else if (candidate.shipment.status === 'PENDING_PICKUP') statusWeight = 1.2;
        else if (candidate.shipment.status === 'DELIVERED') statusWeight = 2.0;
      }

      const score = dist * statusWeight;
      if (score < minScore) {
        minScore = score;
        bestIndex = i;
        bestDist = dist;
      }
    }

    const selected = unvisited.splice(bestIndex, 1)[0];
    accumulatedDistance += bestDist;

    // Driving time @ ~24 km/h + 8 mins per delivery/pickup handshake
    const legDriveMins = Math.round((bestDist / 24) * 60);
    const isFinished = selected.status === 'DELIVERED' || selected.status === 'COMPLETED';
    accumulatedTime += Math.max(3, legDriveMins) + (isFinished ? 0 : 7);

    stops.push({
      sequence: seq++,
      type: selected.type,
      shipment: selected.type === 'DELIVERY' ? selected.shipment : undefined,
      pickup: selected.type === 'PICKUP' ? selected.pickup : undefined,
      title: selected.title,
      recipientOrMerchant: selected.recipientOrMerchant,
      address: selected.address,
      coordinates: selected.coords,
      distanceFromPreviousKm: Number(bestDist.toFixed(1)),
      estimatedArrivalMins: accumulatedTime,
      status: selected.status,
    });

    // Add intermediate road waypoints to polyline
    const segmentWaypoints = createCurvedWaypoints(currentPos, selected.coords);
    for (let k = 1; k < segmentWaypoints.length; k++) {
      polylineCoords.push(segmentWaypoints[k]);
    }

    currentPos = selected.coords;
  }

  return {
    courierId: courier.id,
    courierName: courier.name,
    startPoint,
    startPointLabel: startBase.label,
    stops,
    totalDistanceKm: Number(accumulatedDistance.toFixed(1)),
    estimatedTotalTimeMins: accumulatedTime,
    polylineCoords,
  };
}
