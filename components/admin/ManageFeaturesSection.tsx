"use client";

/**
 * Admin section: lists all Features sheet rows (cols A, B, C) with upload/delete controls per row.
 * Clicking a row opens an inline media preview (image or video). Uses /api/features-media endpoints.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { getFeatureMediaUrl } from "@/lib/r2ImageHelper";
import type { FeatureAdminRow, FeaturesMediaResponse } from "@/types/featureAdmin";

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
const VIDEO_EXTS = /\.(mp4|webm|mov|ogg|m4v|avi|mkv)$/i;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

/** Strips any extension from a filename and appends the given one. */
function replaceExtension(filename: string, newExt: string): string {
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${base}.${newExt}`;
}

/**
 * Derives the target R2 filename from the row's col C value.
 * Videos are always saved as .mp4; images keep .jpg.
 * If col C is empty, falls back to the uploaded file's name.
 */
function resolveTargetFilename(row: FeatureAdminRow, file: File): string {
  const isVideo = file.type === "video/mp4";
  const colC = row.mediaFilename.trim();
  if (colC) {
    return isVideo ? replaceExtension(colC, "mp4") : replaceExtension(colC, "jpg");
  }
  return file.name;
}

type UploadState = "idle" | "uploading" | "success" | "error";
type DeleteState = "idle" | "deleting" | "error";

interface RowState {
  uploadState: UploadState;
  deleteState: DeleteState;
  errorMsg: string | null;
}

function buildDefaultRowState(): RowState {
  return { uploadState: "idle", deleteState: "idle", errorMsg: null };
}

function isVideoFile(filename: string): boolean {
  return VIDEO_EXTS.test(filename);
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTS.test(filename);
}

export default function ManageFeaturesSection() {
  const [rows, setRows] = useState<FeatureAdminRow[]>([]);
  const [r2Files, setR2Files] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchFeaturesData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/features-media");
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as FeaturesMediaResponse;
      setRows(data.rows);
      setR2Files(data.r2Files);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load features");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturesData();
  }, [fetchFeaturesData]);

  function updateRowState(key: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? buildDefaultRowState()), ...patch },
    }));
  }

  function getRowState(key: string): RowState {
    return rowStates[key] ?? buildDefaultRowState();
  }

  function handleRowClick(key: string) {
    setSelectedRowKey((prev) => (prev === key ? null : key));
  }

  function handleUploadClick(key: string) {
    fileInputRefs.current[key]?.click();
  }

  async function handleFileSelected(row: FeatureAdminRow, file: File) {
    const key = row.key;
    updateRowState(key, { uploadState: "uploading", errorMsg: null });

    const isVideo = file.type === "video/mp4";
    const isImage = file.type === "image/jpeg";

    if (!isImage && !isVideo) {
      updateRowState(key, {
        uploadState: "error",
        errorMsg: "Only JPG images or MP4 videos are accepted.",
      });
      return;
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      updateRowState(key, { uploadState: "error", errorMsg: "Image too large (max 10 MB)." });
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      updateRowState(key, { uploadState: "error", errorMsg: "Video too large (max 300 MB)." });
      return;
    }

    const targetFilename = resolveTargetFilename(row, file);

    try {
      const formData = new FormData();
      formData.append("filename", targetFilename);
      formData.append("file", file);

      const res = await fetch("/api/features-media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      updateRowState(key, { uploadState: "success", errorMsg: null });
      await fetchFeaturesData();
      setTimeout(() => updateRowState(key, { uploadState: "idle" }), 2000);
    } catch (err) {
      updateRowState(key, {
        uploadState: "error",
        errorMsg: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function handleDelete(row: FeatureAdminRow) {
    const key = row.key;
    const filename = row.mediaFilename;
    if (!filename) return;
    if (!window.confirm(`Delete "${filename}" from R2? This cannot be undone.`)) return;

    updateRowState(key, { deleteState: "deleting", errorMsg: null });
    try {
      const res = await fetch("/api/features-media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      updateRowState(key, { deleteState: "idle", errorMsg: null });
      await fetchFeaturesData();
    } catch (err) {
      updateRowState(key, {
        deleteState: "error",
        errorMsg: err instanceof Error ? err.message : "Delete failed",
      });
    }
  }

  const selectedRow = rows.find((r) => r.key === selectedRowKey) ?? null;
  const selectedMediaUrl = selectedRow?.mediaFilename
    ? getFeatureMediaUrl(selectedRow.mediaFilename)
    : null;
  const selectedExistsInR2 = Boolean(selectedRow?.mediaFilename && r2Files.includes(selectedRow.mediaFilename));

  return (
    <div id="divManageFeaturesSection" className="flex h-full flex-col overflow-hidden">

      {/* Top strip: instructions + preview side by side */}
      <div id="divManageFeaturesTopStrip" className="shrink-0 border-b border-green-100 p-3">
        <div className="flex items-start gap-3">

          {/* Instructions — Tamil, compact */}
          <div
            id="divManageFeaturesInstructions"
            className="min-w-0 flex-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-600 space-y-1"
          >
            <p className="font-semibold text-blue-800 text-xs">எப்படி use செய்வது</p>
            <ol className="list-decimal pl-4 space-y-0.5 leading-snug">
              <li>SunCatalogData-Google Sheet-ல் உள்ள feature rows-இங்கே உள்ளது. (Key, Label, Media name).</li>
              <li>Feature சேர்க்க/எடிட் செய்யவேண்டுமென்றால் GoogleSheet-ல் செய்துவிட்டு வரவும்.</li>
              <li><strong>Delete</strong> அழுத்தினால் CLoud R2 storage-ல் உள்ள file மட்டும் delete ஆகும்; Sheet row அப்படியே இருக்கும்.</li>
              <li><strong>Upload</strong> button அழுத்தி புதிய image (.jpg) அல்லது video (.mp4) select செய்யுங்கள் — file தானாகவே சரியான name-ல் save ஆகும்.</li>
              <li className="text-amber-700"><strong>Note:</strong> ஏற்கனவே உள்ள பைலை Delete செய்துவிட்டுதான், புது பைலை ஏற்றவேண்டும் என்பதில்லை. எந்த feature-ல் upload செய்கிறோமோ, அங்கே, பழைய file இருந்தால் அது அழிந்துவிட்டு, அதே பெயரில் புது பைல் Save ஆகிவிடும்.</li>
              <li>MP4 upload செய்த பிறகு, Google Sheet-ல் column C-ஐ புதிய name-போடனும் (எ.கா: <code className="rounded bg-blue-100 px-0.5">file.avi</code> → <code className="rounded bg-blue-100 px-0.5">file.mp4</code>).</li>
            </ol>
            <div className="flex gap-3 pt-0.5 text-[10px] text-slate-500">
              <span><span className="rounded-full bg-teal-100 text-teal-800 px-1 font-medium">✓</span> Online-ல் File உள்ளது</span>
              <span><span className="rounded-full bg-amber-100 text-amber-800 px-1 font-medium">!</span> Online-ல் File இல்லை</span>
            </div>
          </div>

          {/* Preview panel — same height as instructions, shows placeholder when nothing selected */}
          <div
            id="divManageFeaturesPreviewPanel"
            className="w-64 shrink-0 rounded-lg border border-green-200 bg-white/95 overflow-hidden"
          >
            {selectedRow && selectedMediaUrl && selectedExistsInR2 ? (
              <>
                <div className="flex items-center justify-between px-2 py-1 border-b border-green-100 bg-green-50">
                  <p className="text-[10px] text-slate-500 truncate max-w-[160px]" title={selectedRow.mediaFilename}>
                    {selectedRow.mediaFilename}
                  </p>
                  <button
                    type="button"
                    id="btnManageFeaturesClosePreview"
                    onClick={() => setSelectedRowKey(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 shrink-0 ml-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-1.5">
                  {isVideoFile(selectedRow.mediaFilename) ? (
                    <div className="space-y-1">
                      <video
                        key={selectedRowKey}
                        id="videoManageFeaturesPreview"
                        src={selectedMediaUrl}
                        controls
                        autoPlay
                        className="w-full max-h-40 rounded object-contain bg-black"
                      >
                        <p className="text-xs text-slate-500">
                          Browser இந்த format-ஐ play செய்ய முடியவில்லை.{" "}
                          <a href={selectedMediaUrl} target="_blank" rel="noopener noreferrer" download={selectedRow.mediaFilename} className="text-teal-600 underline">Download</a>
                        </p>
                      </video>
                      <a href={selectedMediaUrl} target="_blank" rel="noopener noreferrer" download={selectedRow.mediaFilename} className="block text-[10px] text-teal-600 underline">
                        Download / external player-ல் திற
                      </a>
                    </div>
                  ) : isImageFile(selectedRow.mediaFilename) ? (
                    <img
                      id="imgManageFeaturesPreview"
                      src={selectedMediaUrl}
                      alt={selectedRow.label}
                      className="w-full max-h-40 rounded object-contain bg-slate-50"
                    />
                  ) : (
                    <a href={selectedMediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 underline">
                      File-ஐ திற
                    </a>
                  )}
                </div>
              </>
            ) : selectedRow && !selectedExistsInR2 ? (
              <div id="divManageFeaturesPreviewNotInCloud" className="flex h-full min-h-[80px] flex-col items-center justify-center gap-1.5 p-3">
                <span className="text-lg">☁️</span>
                <p className="text-[10px] text-amber-700 text-center font-medium">This file does not exist in cloud.</p>
                <p className="text-[10px] text-slate-400 text-center">You can upload a new one.</p>
              </div>
            ) : (
              <div className="flex h-full min-h-[80px] items-center justify-center p-3">
                <p className="text-[10px] text-slate-400 text-center">ஒரு row-ஐ click செய்யுங்கள்</p>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            id="btnManageFeaturesRefresh"
            onClick={fetchFeaturesData}
            disabled={loading}
            className="shrink-0 self-start rounded-lg border border-green-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-green-50 disabled:opacity-50"
          >
            {loading ? "..." : "↺"}
          </button>
        </div>

        {fetchError && (
          <div
            id="divManageFeaturesError"
            className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
          >
            {fetchError}
          </div>
        )}
      </div>

      {/* Scrollable table list — only this area scrolls */}
      <div id="divManageFeaturesTableWrapper" className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!loading && rows.length === 0 && !fetchError && (
          <p className="text-sm text-slate-500">Sheet-ல் எந்த feature row-உம் இல்லை.</p>
        )}

        {rows.length > 0 && (
          <div
            id="divManageFeaturesTable"
            className="overflow-hidden rounded-xl border border-green-200 bg-white/95 shadow-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-100 bg-green-50">
                  <th className="px-2 py-2 text-center font-semibold text-slate-500 w-10 text-xs">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 w-80 text-xs">Key (A)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 w-80 text-xs">Label (B)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 text-xs">Media (C)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 w-44 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {rows.map((row) => {
                  const state = getRowState(row.key);
                  const isSelected = selectedRowKey === row.key;
                  const hasMedia = Boolean(row.mediaFilename);
                  const existsInR2 = hasMedia && r2Files.includes(row.mediaFilename);

                  return (
                    <tr
                      key={row.key}
                      id={`trManageFeature_${row.key}`}
                      onClick={() => handleRowClick(row.key)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-teal-50 hover:bg-teal-50" : "hover:bg-green-50"
                      }`}
                    >
                      <td className="px-2 py-2 text-center font-mono text-xs text-slate-400">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.key}</td>
                      <td className="px-3 py-2 text-xs text-slate-800">{row.label}</td>
                      <td className="px-3 py-2">
                        {hasMedia ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              existsInR2 ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {existsInR2 ? "✓" : "!"} {row.mediaFilename}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Hidden file input: jpg images or mp4 videos only */}
                          <input
                            type="file"
                            accept=".jpg,.mp4"
                            className="hidden"
                            ref={(el) => { fileInputRefs.current[row.key] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelected(row, file);
                              e.target.value = "";
                            }}
                          />

                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              id={`btnManageFeaturesUpload_${row.key}`}
                              onClick={() => handleUploadClick(row.key)}
                              disabled={state.uploadState === "uploading"}
                              className="rounded border border-teal-300 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                            >
                              {state.uploadState === "uploading" ? "Uploading…" : state.uploadState === "success" ? "Uploaded!" : "Upload"}
                            </button>
                          </div>

                          {hasMedia && (
                            <button
                              type="button"
                              id={`btnManageFeaturesDelete_${row.key}`}
                              onClick={() => handleDelete(row)}
                              disabled={state.deleteState === "deleting"}
                              className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              {state.deleteState === "deleting" ? "..." : "Delete"}
                            </button>
                          )}

                          {state.errorMsg && (
                            <span className="text-[10px] text-red-600" role="alert">{state.errorMsg}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
