
const BackupManager = {
  exportKeys: [
    "bodyTrackWorkouts",
    "bodyTrackMeasurements",
    "bodyTrackProfile"
  ],

  dbName: "BodyTrackPhotos",
  storeName: "photos",

  openDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not supported."));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true
          });

          store.createIndex("date", "date", {
            unique: false
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(
        new Error("Database upgrade is blocked.")
      );
    });
  },

  async getPhotos() {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      let transaction;

      try {
        transaction = db.transaction(this.storeName, "readonly");
        const request = transaction.objectStore(this.storeName).getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error);
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  },

  async photoToBlob(photo) {
    if (photo.image instanceof Blob) {
      return photo.image;
    }

    if (photo.imageBytes instanceof ArrayBuffer) {
      return new Blob(
        [photo.imageBytes],
        { type: photo.imageType || "image/jpeg" }
      );
    }

    if (ArrayBuffer.isView(photo.imageBytes)) {
      return new Blob(
        [photo.imageBytes],
        { type: photo.imageType || "image/jpeg" }
      );
    }

    if (typeof photo.imageData === "string") {
      return this.dataURLToBlob(photo.imageData);
    }

    throw new Error("تصویر ذخیره‌شده معتبر نیست.");
  },

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      if (!(blob instanceof Blob)) {
        reject(new Error("Invalid image data."));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(blob);
    });
  },

  dataURLToBlob(dataURL) {
    if (typeof dataURL !== "string") {
      throw new Error("Invalid image format.");
    }

    const match = dataURL.match(
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/
    );

    if (!match) {
      throw new Error("Unsupported image format.");
    }

    const mime = match[1];
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  },

  async exportData() {
    try {
      const localData = {};

      this.exportKeys.forEach(key => {
        const value = localStorage.getItem(key);

        if (value !== null) {
          localData[key] = JSON.parse(value);
        }
      });

      const storedPhotos = await this.getPhotos();

      const photos = await Promise.all(
        storedPhotos.map(async photo => {
          const blob = await this.photoToBlob(photo);

          return {
            id: photo.id,
            date: photo.date,
            note: photo.note || "",
            createdAt: photo.createdAt || "",
            image: await this.blobToDataURL(blob)
          };
        })
      );

      const backup = {
        app: "BODY TRACK",
        version: "1.4.0",
        exportedAt: new Date().toISOString(),
        localData,
        photos
      };

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `body-track-backup-${new Date().toISOString().slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1500);

      alert("نسخه پشتیبان اطلاعات و تصاویر آماده شد.");
    } catch (error) {
      console.error("Backup export error:", error);
      alert("ساخت نسخه پشتیبان انجام نشد. دوباره تلاش کن.");
    }
  },

  validateBackup(backup) {
    if (
      !backup ||
      typeof backup !== "object" ||
      backup.app !== "BODY TRACK" ||
      !backup.localData ||
      typeof backup.localData !== "object" ||
      Array.isArray(backup.localData)
    ) {
      throw new Error("Invalid backup structure.");
    }

    this.exportKeys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(backup.localData, key)) {
        const value = backup.localData[key];

        if (value === null || typeof value !== "object") {
          throw new Error("Invalid local data.");
        }
      }
    });

    if (
      backup.photos !== undefined &&
      !Array.isArray(backup.photos)
    ) {
      throw new Error("Invalid photos list.");
    }

    const photos = backup.photos || [];
    const ids = new Set();

    photos.forEach(photo => {
      if (
        !photo ||
        !Number.isSafeInteger(photo.id) ||
        photo.id < 1 ||
        typeof photo.date !== "string" ||
        typeof photo.image !== "string" ||
        ids.has(photo.id)
      ) {
        throw new Error("Invalid photo record.");
      }

      ids.add(photo.id);
      this.dataURLToBlob(photo.image);
    });

    return true;
  },

  async replacePhotoRecords(records) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      let transaction;

      try {
        transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);

        store.clear();

        records.forEach(photo => {
          const record = {
            id: photo.id,
            date: photo.date,
            note: photo.note || "",
            createdAt: photo.createdAt || new Date().toISOString()
          };

          if (photo.imageBytes instanceof ArrayBuffer) {
            record.imageBytes = photo.imageBytes;
            record.imageType = photo.imageType || "image/jpeg";
          } else if (ArrayBuffer.isView(photo.imageBytes)) {
            record.imageBytes = photo.imageBytes.buffer.slice(
              photo.imageBytes.byteOffset,
              photo.imageBytes.byteOffset + photo.imageBytes.byteLength
            );
            record.imageType = photo.imageType || "image/jpeg";
          } else if (photo.image instanceof Blob) {
            record.imageBytes = null;
            record.image = photo.image;
          } else if (typeof photo.imageData === "string") {
            const blob = this.dataURLToBlob(photo.imageData);
            record.imageBytes = null;
            record.image = blob;
          } else {
            throw new Error("Invalid photo record.");
          }

          store.add(record);
        });

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };

        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };

        transaction.onabort = () => {
          db.close();
          reject(transaction.error || new Error("Restore aborted."));
        };
      } catch (error) {
        if (transaction) {
          try {
            transaction.abort();
          } catch (_) {}
        }

        db.close();
        reject(error);
      }
    });
  },

  async restorePhotos(photos) {
    const records = (photos || []).map(photo => {
      const blob = this.dataURLToBlob(photo.image);

      return {
        id: photo.id,
        date: photo.date,
        note: photo.note || "",
        createdAt: photo.createdAt || new Date().toISOString(),
        imageBytes: null,
        image: blob
      };
    });

    // Convert images to ArrayBuffer before saving.
    for (const record of records) {
      const buffer = await record.image.arrayBuffer();

      record.imageBytes = buffer;
      record.imageType = record.image.type;
      delete record.image;
    }

    return this.replacePhotoRecords(records);
  },

  async importData(file) {
    try {
      if (
        !file ||
        !file.name.toLowerCase().endsWith(".json")
      ) {
        throw new Error("Please select a JSON backup file.");
      }

      if (file.size > 150 * 1024 * 1024) {
        throw new Error("Backup file is too large.");
      }

      const text = await file.text();
      const backup = JSON.parse(text);

      this.validateBackup(backup);

      const confirmed = confirm(
        "با بازیابی نسخه پشتیبان، اطلاعات فعلی جایگزین می‌شوند. ادامه می‌دهی؟"
      );

      if (!confirmed) return;

      const oldLocalData = {};

      this.exportKeys.forEach(key => {
        oldLocalData[key] = localStorage.getItem(key);
      });

      const oldPhotos = await this.getPhotos();

      try {
        if (Array.isArray(backup.photos)) {
          await this.restorePhotos(backup.photos);
        }

        this.exportKeys.forEach(key => {
          if (
            Object.prototype.hasOwnProperty.call(
              backup.localData,
              key
            )
          ) {
            localStorage.setItem(
              key,
              JSON.stringify(backup.localData[key])
            );
          } else {
            localStorage.removeItem(key);
          }
        });

      } catch (restoreError) {
        try {
          await this.replacePhotoRecords(oldPhotos);
        } catch (rollbackError) {
          console.error("Photo rollback error:", rollbackError);
        }

        this.exportKeys.forEach(key => {
          try {
            if (oldLocalData[key] === null) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, oldLocalData[key]);
            }
          } catch (storageError) {
            console.error("Storage rollback error:", storageError);
          }
        });

        throw restoreError;
      }

      alert("اطلاعات و تصاویر با موفقیت بازیابی شدند.");
      location.reload();

    } catch (error) {
      console.error("Backup import error:", error);
      alert("فایل انتخاب‌شده معتبر نیست یا بازیابی آن انجام نشد.");
    }
  },

  render() {
    return `
      <div class="section-heading">
        <div>
          <span class="eyebrow">DATA MANAGEMENT</span>
          <h3>پشتیبان‌گیری اطلاعات</h3>
        </div>
      </div>

      <section class="backup-card">
        <div class="backup-icon">↓</div>
        <h3>دریافت نسخه پشتیبان</h3>
        <p>
          یک فایل شامل اطلاعات تمرین، اندازه‌های بدن،
          پروفایل و تصاویر گالری خود دریافت کن.
        </p>

        <button class="primary-btn" data-backup-export>
          دریافت فایل پشتیبان
        </button>
      </section>

      <section class="backup-card">
        <div class="backup-icon">↑</div>
        <h3>بازیابی اطلاعات</h3>
        <p>
          اگر قبلاً از اطلاعاتت نسخه پشتیبان گرفته‌ای،
          می‌توانی آن را از این قسمت بازیابی کنی.
        </p>

        <label class="backup-file-label">
          انتخاب فایل پشتیبان
          <input
            type="file"
            id="backup-file"
            accept=".json,application/json"
          />
        </label>

        <button class="secondary-btn" data-backup-import>
          بازیابی اطلاعات
        </button>
      </section>

      <p class="backup-warning">
        اطلاعات BODY TRACK روی همین دستگاه و مرورگر ذخیره می‌شوند.
        برای جلوگیری از ازدست‌رفتن آن‌ها، مرتباً نسخه پشتیبان بگیر.
      </p>
    `;
  },

  handleImport() {
    const input = document.getElementById("backup-file");
    const file = input?.files?.[0];

    if (!file) {
      alert("ابتدا فایل پشتیبان را انتخاب کن.");
      return;
    }

    this.importData(file);
  }
};

document.addEventListener("click", event => {
  if (event.target.closest("[data-backup-export]")) {
    BackupManager.exportData();
  }

  if (event.target.closest("[data-backup-import]")) {
    BackupManager.handleImport();
  }
});
