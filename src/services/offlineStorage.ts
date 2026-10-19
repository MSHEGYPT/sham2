/**
 * خدمة التخزين والمزامنة بدون اتصال بالإنترنت باستخدام مكتبة localforage
 * Mesharweer Offline Storage & Sync Engine
 */
import localforage from 'localforage';
import { Shipment, WorkerTask, OfflineQueuedAction } from '../types';

// تهيئة مستودعات localforage المخصصة لكل نوع من البيانات
export const shipmentsStore = localforage.createInstance({
  name: 'MesharweerOfflineDB',
  storeName: 'shipments_v1',
  description: 'تخزين بيانات الشحنات محلياً للعمل بدون إنترنت',
});

export const tasksStore = localforage.createInstance({
  name: 'MesharweerOfflineDB',
  storeName: 'courier_tasks_v1',
  description: 'تخزين مهام المناديب الميدانية محلياً',
});

export const offlineQueueStore = localforage.createInstance({
  name: 'MesharweerOfflineDB',
  storeName: 'offline_queue_v1',
  description: 'طابور الإجراءات المنفذة أوفلاين والمؤجلة للمزامنة',
});

export const metaStore = localforage.createInstance({
  name: 'MesharweerOfflineDB',
  storeName: 'app_meta_v1',
  description: 'بيانات المزامنة وتاريخ آخر تحديث محلي',
});

const LAST_SYNC_KEY = 'last_synced_timestamp';

/**
 * حفظ قائمة الشحنات محلياً
 */
export async function cacheShipmentsLocally(shipments: Shipment[]): Promise<boolean> {
  try {
    await shipmentsStore.setItem('all_shipments', shipments);
    await metaStore.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return true;
  } catch (err) {
    console.error('Failed to cache shipments to localforage:', err);
    return false;
  }
}

/**
 * استرجاع الشحنات المخزنة محلياً عند انقطاع الإنترنت
 */
export async function getCachedShipments(): Promise<Shipment[] | null> {
  try {
    const list = await shipmentsStore.getItem<Shipment[]>('all_shipments');
    return list || null;
  } catch (err) {
    console.error('Failed to retrieve cached shipments from localforage:', err);
    return null;
  }
}

/**
 * حفظ مهام المناديب الميدانية محلياً
 */
export async function cacheWorkerTasksLocally(tasks: WorkerTask[]): Promise<boolean> {
  try {
    await tasksStore.setItem('all_tasks', tasks);
    return true;
  } catch (err) {
    console.error('Failed to cache tasks to localforage:', err);
    return false;
  }
}

/**
 * استرجاع مهام المناديب المخزنة محلياً
 */
export async function getCachedWorkerTasks(): Promise<WorkerTask[] | null> {
  try {
    const list = await tasksStore.getItem<WorkerTask[]>('all_tasks');
    return list || null;
  } catch (err) {
    console.error('Failed to retrieve cached tasks from localforage:', err);
    return null;
  }
}

/**
 * إضافة إجراء إلى طابور الانتظار عند تنفيذ عملية بدون اتصال (تأكيد تسليم، كود OTP، تقييم)
 */
export async function enqueueOfflineAction(action: Omit<OfflineQueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<OfflineQueuedAction> {
  const queuedAction: OfflineQueuedAction = {
    ...action,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    const existing = (await offlineQueueStore.getItem<OfflineQueuedAction[]>('queue_items')) || [];
    existing.push(queuedAction);
    await offlineQueueStore.setItem('queue_items', existing);
  } catch (err) {
    console.error('Failed to enqueue offline action:', err);
  }

  return queuedAction;
}

/**
 * جلب قائمة الإجراءات المنتظرة للمزامنة
 */
export async function getQueuedOfflineActions(): Promise<OfflineQueuedAction[]> {
  try {
    const list = await offlineQueueStore.getItem<OfflineQueuedAction[]>('queue_items');
    return list || [];
  } catch (err) {
    console.error('Failed to get queued actions:', err);
    return [];
  }
}

/**
 * مسح أو تفريغ طابور الإجراءات بعد اكتمال المزامنة الناجحة
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await offlineQueueStore.setItem('queue_items', []);
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
}

/**
 * فحص إحصائيات التخزين المحلي
 */
export async function getOfflineStorageStats(): Promise<{
  cachedShipmentsCount: number;
  cachedTasksCount: number;
  queuedActionsCount: number;
  lastSyncedAt: string | null;
}> {
  try {
    const shipments = (await shipmentsStore.getItem<Shipment[]>('all_shipments')) || [];
    const tasks = (await tasksStore.getItem<WorkerTask[]>('all_tasks')) || [];
    const queue = (await offlineQueueStore.getItem<OfflineQueuedAction[]>('queue_items')) || [];
    const lastSynced = await metaStore.getItem<string>(LAST_SYNC_KEY);

    return {
      cachedShipmentsCount: shipments.length,
      cachedTasksCount: tasks.length,
      queuedActionsCount: queue.length,
      lastSyncedAt: lastSynced,
    };
  } catch {
    return {
      cachedShipmentsCount: 0,
      cachedTasksCount: 0,
      queuedActionsCount: 0,
      lastSyncedAt: null,
    };
  }
}
