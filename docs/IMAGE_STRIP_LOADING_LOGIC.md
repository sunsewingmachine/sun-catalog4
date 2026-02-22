# Image Strip Loading Logic (ETC, CAT, GEN)

This document describes how the three image rows below the main product viewer are loaded and when they update. The behavior is tuned so the app opens quickly and list selection feels snappy.

---

## Row overview

| Row | Label | Purpose | When it loads / updates |
|-----|--------|--------|--------------------------|
| 1   | **ETC** | Extra/additional images for the selected product (e.g. `ItmGroupName (1).jpg`, `(2).jpg`) | **Every time** the main list selection changes. Populated with a short delay (~120ms) so the list click stays instant. |
| 2   | **CAT** | Category images (ForGroup): images for the **category** of the selected item (e.g. Sv, Ta1) | **Only when the category changes.** If the user clicks another item in the same category (e.g. Sv.Happy.Export after Sv.Sun.Tm), CAT row does not reload. When the user selects an item from a different category (e.g. Ta1.Happy.Metro), CAT row loads that category’s images. Update is deferred (~120ms) when category does change. |
| 3   | **GEN** | General/common images (ForAll): shared across all products | **Once**, when the app loads. Not tied to item selection. Fetched after 5 seconds so the app shell and main content appear first (GEN is not critical initially). |

---

## Implementation summary

- **GEN (ForAll)**  
  - Fetched via `/api/bar-images` once on mount.  
  - The request is delayed by `DELAY_MS_BAR_FETCH` (200ms) so the initial render is fast.  
  - The same API response also provides the full ForGroup list used for CAT; only the **display** of CAT is driven by the selected item’s category.

- **CAT (ForGroup)**  
  - Full list of ForGroup filenames comes from the same bar-images fetch (one-time).  
  - Category is derived from the selected product’s `itmGroupName` (e.g. `Sv.Happy.1st` → `Sv`).  
  - The strip shows only filenames whose prefix matches the **deferred** category.  
  - `deferredCategoryPrefix` is updated ~120ms after `categoryPrefix` changes, so:  
    - Same category → no change → no reload.  
    - New category → after delay, CAT row shows the new category’s images.

- **ETC (Additional)**  
  - Row is driven by the **deferred** selected product (`deferredProduct`).  
  - `deferredProduct` is set ~120ms after `selectedProduct` changes, so the main list responds immediately and ETC thumbnails update shortly after.

---

## Delays (constants in `CatalogLayout.tsx`)

- **`DELAY_MS_BAR_FETCH`** (5s): Delay before calling `/api/bar-images`. GEN is not critical initially; app opens fast and GEN/CAT list load after 5 seconds.  
- **`DELAY_MS_STRIP`** (120ms): Delay for updating `deferredProduct` (ETC) and `deferredCategoryPrefix` (CAT). Keeps list clicking fast; strip rows update a moment after selection.

---

## For you and the codebase

- **GEN**: Load once on app load (with delay). Common for all; never reload on item change.  
- **CAT**: Load only when the selected item’s **category** changes; same category → no reload; small delay when category does change.  
- **ETC**: Reload on every main list change, with a small delay so the list stays snappy.

All three use short, deliberate delays so the app feels responsive while still loading the strip rows promptly.
