"use client";

/**
 * Single code input; validates via API (env codes APP_ACTIVATION_CODE1/2 or time-based code) and sets activated flag (persisted in localStorage).
 * Shows exact device/PC name from server (os.hostname()), fake QR, and Tamil instruction to send photo to E2.
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

const ACTIVATED_KEY = "catalog_activated";
const API_VALIDATE_ACTIVATION = "/api/validate-activation";
const API_DEVICE_NAME = "/api/device-name";

function formatDateTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(undefined, { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${day}/${month}/${year} ${time}`;
}

/** Fake QR-style grid (decorative only): 13x13 cells; pattern changes with seed (e.g. time). */
function FakeQRCode({ seed }: { seed: number }) {
  const size = 13;
  const cellPx = 10;
  const cells = useMemo(() => {
    const out: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        const v = ((seed >>> 0) * (r * size + c + 1)) % 37;
        row.push(v < 18);
      }
      out.push(row);
    }
    return out;
  }, [seed]);

  return (
    <div
      id="divActivationFakeQR"
      className="inline-grid border-2 border-slate-300 bg-white p-0.5"
      style={{
        gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
      }}
      aria-hidden
    >
      {cells.flatMap((row, r) =>
        row.map((on, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: cellPx,
              height: cellPx,
              backgroundColor: on ? "#111" : "#fff",
            }}
          />
        ))
      )}
    </div>
  );
}

interface ValidateActivationResponse {
  valid: boolean;
  error?: string;
  decodedPcName?: string;
}

async function validateActivationViaApi(enteredCode: string): Promise<ValidateActivationResponse> {
  const res = await fetch(API_VALIDATE_ACTIVATION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: enteredCode }),
  });
  const data = (await res.json()) as ValidateActivationResponse;
  if (!res.ok) return { valid: false, error: data.error ?? "Validation failed" };
  return data;
}

export default function ActivationScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pcName, setPcName] = useState<string>("");
  const [clock, setClock] = useState<Date>(() => new Date());

  const seconds = clock.getSeconds();
  const showQR = seconds >= 1 && seconds <= 20;
  const countdown = showQR ? 21 - seconds : (seconds >= 21 ? 61 - seconds : 0);
  const dateTime = formatDateTime(clock);

  useEffect(() => {
    let cancelled = false;
    fetch(API_DEVICE_NAME)
      .then((res) => res.json())
      .then((data: { deviceName?: string }) => {
        if (!cancelled && data.deviceName != null) {
          setPcName(String(data.deviceName).trim() || "PC");
        }
      })
      .catch(() => {
        if (!cancelled) setPcName("PC");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await validateActivationViaApi(code);
      if (result.valid) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACTIVATED_KEY, "1");
        }
        router.push("/catalog");
        router.refresh();
      } else {
        setError(result.error ?? "Invalid code");
      }
    } catch {
      setError("Could not verify code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="divActivationContainer"
      className="flex min-h-screen items-center justify-center bg-green-50 p-4"
    >
      <div
        id="divActivationCard"
        className="w-full max-w-md rounded-2xl border border-green-200 bg-white/95 p-8 shadow-md"
      >
        <h1 className="mb-2 rounded-lg bg-teal-100 py-2 text-center text-xl font-semibold text-slate-800">
          Product Catalog
        </h1>
        <p id="pActivationPcName" className="mb-2 text-center text-2xl font-semibold tracking-wide text-slate-800">
          {pcName || "…"}
        </p>
        {showQR ? (
          <div className="mb-2 flex justify-center">
            <FakeQRCode seed={Math.floor(clock.getTime() / 60000)} />
          </div>
        ) : (
          <p id="pActivationQRWait" className="mb-2 whitespace-pre-line text-center text-sm text-slate-600" lang="ta">
            {"E2 Code கொடுத்திருந்தால், அதை இங்கே paste செய்யவும்.\n\nஅல்லது புது QR வேண்டுமென்றால்,\nQR generate ஆகும்வரை காத்திருக்கவும். வந்தவுடன், கடை தெரியும்படி போட்டோ எடுத்து E2-க்கு அனுப்பவும்."}
          </p>
        )}
        <p id="pActivationDateTime" className="mb-3 text-center text-sm text-slate-600 tabular-nums">
          {dateTime}
        </p>
        {showQR && (
          <ol id="olActivationSteps" className="mb-6 list-inside list-decimal text-left text-sm text-slate-600" lang="ta">
            <li className="mb-1">கடை தெரியும்படி, இதை E2-வுக்கு உடனே போட்டோ அனுப்பவும்</li>
            <li>E2 தரும் நம்பரை, 10 வினாடிக்குள் இங்கே paste செய்யவும்.</li>
          </ol>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="inputActivationCode" className="sr-only">
            Activation code
          </label>
          <div className="relative mb-4">
            <input
              id="inputActivationCode"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onContextMenu={(e) => e.stopPropagation()}
              placeholder="Enter code"
              className="w-full rounded-xl border border-green-200 bg-green-50/80 py-2.5 pl-4 pr-10 text-slate-800 placeholder-slate-400 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              autoComplete="one-time-code"
              disabled={submitting}
            />
            {code.length > 0 && (
              <button
                type="button"
                id="btnActivationCodeClear"
                aria-label="Clear code"
                onClick={() => {
                  setCode("");
                  setError(null);
                }}
                disabled={submitting}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 disabled:opacity-50"
              >
                <span aria-hidden>×</span>
              </button>
            )}
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Activate"}
          </button>
        </form>
        {showQR && countdown > 0 && (
          <div id="divActivationCountdown" className="mt-4 flex justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-600 text-4xl font-bold tabular-nums text-white">
              {countdown}
            </span>
          </div>
        )}
        {!showQR && (
          <div id="divActivationCountdownHidden" className="mt-4 flex justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-500 text-4xl font-bold tabular-nums text-white">
              {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
