/**
 * StudentHub AI — Durable Device Sync Store
 * 
 * Provides crash-safe atomic persistence for registered devices and cross-device synced state.
 * File storage: .data/device_sync_store.json
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "device_sync_store.json");

export class DeviceSyncStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #devices = new Map(); // key: deviceId, value: DeviceRecord
  static #syncStores = new Map(); // key: subjectId, value: { version: number, entities: Map<string, object> }
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#devices.clear();
    this.#syncStores.clear();
    this.#isHydrated = true;
    try {
      if (fs.existsSync(this.#storageFilePath)) {
        fs.unlinkSync(this.#storageFilePath);
      }
    } catch {
      // ignore
    }
  }

  static #ensureStorageDir() {
    const dir = path.dirname(this.#storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static rehydrate() {
    this.#ensureStorageDir();
    if (!fs.existsSync(this.#storageFilePath)) {
      this.#devices.clear();
      this.#syncStores.clear();
      this.#isHydrated = true;
      return;
    }

    try {
      const raw = fs.readFileSync(this.#storageFilePath, "utf8");
      const data = JSON.parse(raw);
      this.#devices.clear();
      this.#syncStores.clear();

      if (data && typeof data === "object") {
        if (data.devices) {
          for (const [id, dev] of Object.entries(data.devices)) {
            this.#devices.set(id, dev);
          }
        }
        if (data.syncStores) {
          for (const [subj, storeData] of Object.entries(data.syncStores)) {
            const entitiesMap = new Map();
            if (storeData.entities) {
              for (const [entId, entVal] of Object.entries(storeData.entities)) {
                entitiesMap.set(entId, entVal);
              }
            }
            this.#syncStores.set(subj, {
              version: storeData.version || 1,
              entities: entitiesMap
            });
          }
        }
      }
      this.#isHydrated = true;
    } catch {
      this.#devices.clear();
      this.#syncStores.clear();
      this.#isHydrated = true;
    }
  }

  static persist() {
    this.#ensureStorageDir();
    const devicesObj = {};
    for (const [id, dev] of this.#devices.entries()) {
      devicesObj[id] = dev;
    }

    const syncStoresObj = {};
    for (const [subj, storeData] of this.#syncStores.entries()) {
      const entitiesObj = {};
      const entries = storeData.entities instanceof Map
        ? storeData.entities.entries()
        : Object.entries(storeData.entities || {});
      for (const [entId, entVal] of entries) {
        entitiesObj[entId] = entVal;
      }
      syncStoresObj[subj] = {
        version: storeData.version,
        entities: entitiesObj
      };
    }

    const payload = {
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      devices: devicesObj,
      syncStores: syncStoresObj
    };

    const tempFile = `${this.#storageFilePath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
      fs.renameSync(tempFile, this.#storageFilePath);
    } catch (err) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {
        // ignore
      }
    }
  }

  static getDevice(deviceId) {
    if (!this.#isHydrated) this.rehydrate();
    return this.#devices.get(deviceId) || null;
  }

  static getAllDevices() {
    if (!this.#isHydrated) this.rehydrate();
    return Array.from(this.#devices.values());
  }

  static saveDevice(deviceId, device) {
    if (!this.#isHydrated) this.rehydrate();
    this.#devices.set(deviceId, device);
    this.persist();
    return device;
  }

  static getSyncStore(subjectId) {
    if (!this.#isHydrated) this.rehydrate();
    if (!this.#syncStores.has(subjectId)) {
      this.#syncStores.set(subjectId, {
        version: 1,
        entities: new Map()
      });
    }
    return this.#syncStores.get(subjectId);
  }

  static saveSyncStore(subjectId, storeData) {
    if (!this.#isHydrated) this.rehydrate();
    this.#syncStores.set(subjectId, storeData);
    this.persist();
    return storeData;
  }
}
