# Image cache plan: install-all, then sync on version change

Short plan for storing all images on device and fetching only when catalog version changes or an image is newer on the server.

---

## 1. First time (install / initial sync)

1. Fetch catalog from Google Sheet and get current **version**.
2. Get list of all **image filenames** from the catalog.
3. **Download every image** from the CDN/server.
4. **Save each image** on the device (e.g. IndexedDB), keyed by filename or URL.
5. For each saved image, store **when we saved it** (or the server’s **Last-Modified** from the response).
6. Save the **catalog data** and **version** in device storage.

Result: device has full catalog + all images; no need to hit server for images until version changes or an image is updated.

---

## 2. Every time the app opens (normal use)

1. **Check version only** (one small request to version endpoint or sheet).
2. **If version is the same**  
   - Load catalog and all images from device only.  
   - No Google Sheet fetch, no image downloads.
3. **If version changed**  
   - Go to step 3 below.

---

## 3. When version has changed

1. **Fetch new Google Sheet data** and save it on the device (replace existing catalog).
2. **For each image** in the new catalog:
   - **Compare dates:**  
     - **Server:** Use a **HEAD** request (or GET) to get **Last-Modified** for that image.  
     - **Local:** Read the stored “saved at” or “last-modified” for that image.  
   - **If** we don’t have the image locally **or** server’s Last-Modified is **newer** than local:
     - Download the image and save it (and store its Last-Modified / saved-at).
   - **Else** (local is same or newer):  
     - Skip; do not download again.

Filenames can stay the same; we decide “download or not” only by this date comparison.

---

## 4. Technical notes (for implementation)

| Item | Detail |
|------|--------|
| **Storage** | IndexedDB (e.g. existing `imageCache` store): key = image URL or filename, value = `{ blob, lastModified or savedAt }`. |
| **Version check** | Use current version checker; only run full sync when version changes. |
| **Server date** | HTTP **Last-Modified** header from HEAD or GET for each image URL. |
| **Local date** | Store when saving the image (or copy of Last-Modified). Compare before re-downloading. |
| **Optional** | Request **persistent storage** (`navigator.storage.persist()`) so the browser is less likely to evict data. |

---

## 5. Summary (3 steps)

1. **Install:** Download full catalog → all image filenames → download every image → save all on device with version and per-image date.
2. **Every open:** Check version only. Same version → use device only. New version → fetch new sheet, then for each image compare server Last-Modified with local date; if server is newer or missing locally, download and save; else skip.
3. **Compare by date:** Yes — server gives Last-Modified, we store it (or “saved at”) locally and only re-fetch when server is newer or image is missing. Same filename is fine.
