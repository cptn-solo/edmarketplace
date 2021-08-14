import { Injectable } from '@angular/core';

function getLocalStorage(): Storage {
  return localStorage;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _localStorage: Storage;

  constructor() {
    this._localStorage = getLocalStorage();
  }

  setInfo(data: any, key: string) {
    try {
      const jsonData = JSON.stringify(data);
      this._localStorage.setItem(key, jsonData);
    } catch (error) {
      console.log(`Error storage service: setInfo: ${error}`);
      throw error;
    }
  }

  loadInfo(key: string) {
    try {
      const stringData = this._localStorage.getItem(key);
      const data = !!stringData ? JSON.parse(stringData) : null;
      return data;
    } catch (error) {
      console.log(`Error storage service: loadInfo: ${error}`);
      throw error;
    }
  }

  clearInfo(key: string) {
    this._localStorage.removeItem(key)
  }

  clearAllLocalStorage() {
    this._localStorage.clear();
  }
}
