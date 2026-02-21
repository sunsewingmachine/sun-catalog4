"use client";

/**
 * Single code input; validates via API (env codes APP_ACTIVATION_CODE1/2 or time-based code) and sets activated flag (persisted in localStorage).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACTIVATED_KEY = "catalog_activated";
const API_VALIDATE_ACTIVATION = "/api/validate-activation";

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
        <h1 className="mb-2 text-xl font-semibold text-slate-800">
          Product Catalog
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter the activation code to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="inputActivationCode" className="sr-only">
            Activation code
          </label>
          <input
            id="inputActivationCode"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="mb-4 w-full rounded-xl border border-green-200 bg-green-50/80 px-4 py-2.5 text-slate-800 placeholder-slate-400 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            autoComplete="one-time-code"
            disabled={submitting}
          />
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
      </div>
    </div>
  );
}
