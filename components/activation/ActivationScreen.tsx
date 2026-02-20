"use client";

/**
 * Single code input; validates prefix (PC name) + time code and sets activated flag. No PC dropdown.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateActivationCode } from "@/lib/activationValidator";

const ACTIVATED_KEY = "catalog_activated";

export default function ActivationScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = validateActivationCode(code);
    setSubmitting(false);
    if (result.valid) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(ACTIVATED_KEY, "1");
      }
      router.push("/catalog");
      router.refresh();
    } else {
      setError(result.error ?? "Invalid code");
    }
  };

  return (
    <div
      id="divActivationContainer"
      className="flex min-h-screen items-center justify-center bg-zinc-100 p-4"
    >
      <div
        id="divActivationCard"
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-2 text-xl font-semibold text-zinc-800">
          Product Catalog
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Enter the activation code to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="inputActivationCode" className="sr-only">
            Activation code
          </label>
          <input
            id="inputActivationCode"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Activate"}
          </button>
        </form>
      </div>
    </div>
  );
}
