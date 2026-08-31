/**
 * StudentHub AI — DeviceRepository
 * Production repository abstraction for multi-device management and synchronized client states.
 */

import { DatabaseAdapter } from "../DatabaseAdapter.js";

export class DeviceRepository {
  static #devicesAdapter = new DatabaseAdapter("devices");
  static #syncStateAdapter = new DatabaseAdapter("device_sync_states");

  static async getDevice(deviceId) {
    return this.#devicesAdapter.findById(deviceId, "deviceId");
  }

  static async getDevicesForSubject(subjectId) {
    return this.#devicesAdapter.find({ subjectId });
  }

  static async saveDevice(device) {
    return this.#devicesAdapter.save(device, "deviceId");
  }

  static async getSyncState(subjectId) {
    const found = await this.#syncStateAdapter.findById(subjectId, "subjectId");
    return found || {
      subjectId,
      version: 1,
      lastModifiedAt: new Date().toISOString(),
      entities: {
        plannerPreferences: { theme: "dark", layoutDensity: "comfortable", autoSync: true },
        savedKnowledgeIds: [],
        watchedClaimIds: []
      }
    };
  }

  static async saveSyncState(subjectId, syncState) {
    const record = {
      ...syncState,
      subjectId
    };
    return this.#syncStateAdapter.save(record, "subjectId");
  }

  static async clear() {
    await this.#devicesAdapter.clear();
    await this.#syncStateAdapter.clear();
  }
}
