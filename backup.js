
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
    });
  },

  getPhotos() {
    return this.openDB().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).getAll();

      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };

      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    }));
  },

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(blob);
    });
  },

  dataURLToBlob(dataURL) {
    const parts = dataURL.split(",");
    const mime = parts[0].match(/:(.*?);/)[1];
    const binary = atob(parts[1]);
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
        storedPhotos.map(async photo => ({
          id: photo.id,
          date: photo.date,
          note: photo.note,
          createdAt: photo.createdAt,
          image: await this.blobToDataURL(photo.image)
        }))
      );

      const backup = {
        app: "BODY TRACK",
        version: "1.1.0",
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

      URL.revokeObjectURL(url);

      alert("نسخه پشتیبان اطلاعات و تصاویر آماده شد.");
    } catch (error) {
      console.error(error);
      alert("ساخت نسخه پشتیبان انجام نشد.");
    }
  },

  async restorePhotos(photos) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);

      store.clear();

      photos.forEach(photo => {
        store.add({
          id: photo.id,
          date: photo.date,
          note: photo.note || "",
          createdAt: photo.createdAt || new Date().toISOString(),
          image: this.dataURLToBlob(photo.image)
        });
      });

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  },

  async importData(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (
        backup.app !== "BODY TRACK" ||
        !backup.localData ||
        typeof backup.localData !== "object"
      ) {
        throw new Error("Invalid backup");
      }

      if (!confirm(
        "با بازیابی نسخه پشتیبان، اطلاعات فعلی جایگزین می‌شوند. ادامه می‌دهی؟"
      )) {
        return;
      }

      this.exportKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(backup.localData, key)) {
          localStorage.setItem(
            key,
            JSON.stringify(backup.localData[key])
          );
        }
      });

      if (Array.isArray(backup.photos)) {
        await this.restorePhotos(backup.photos);
      }

      alert("اطلاعات و تصاویر با موفقیت بازیابی شدند.");
      location.reload();

    } catch (error) {
      console.error(error);
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
