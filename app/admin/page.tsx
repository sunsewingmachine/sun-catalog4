"use client";

/**
 * Admin page: login; then left sidebar with sections (Activation code, more later) and main content.
 * Activation code section: PC name input → generate code for another PC (validated by /api/validate-activation).
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { generateActivationCode, generateDateTimeBasedCode } from "@/lib/activationCodeGen";

const ADMIN_SESSION_KEY = "catalog_admin_logged_in";
const ALLOWED_ADMIN_PASSWORDS = ["salkal", "sxjllda"];

type AdminSectionId = "activation-code";
const ADMIN_SECTIONS: { id: AdminSectionId; label: string }[] = [
  { id: "activation-code", label: "Activation code" },
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<AdminSectionId>("activation-code");
  const [pcName, setPcName] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedDTBCCode, setGeneratedDTBCCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedDTBC, setCopiedDTBC] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    setAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
  }, [mounted]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const trimmed = (password ?? "").trim().toLowerCase();
    if (ALLOWED_ADMIN_PASSWORDS.includes(trimmed)) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      }
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError("Invalid password");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setAuthenticated(false);
    setGeneratedCode(null);
    setGeneratedDTBCCode(null);
    setPcName("");
  };

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (pcName ?? "").trim();
    if (name) {
      setGeneratedCode(generateActivationCode(name));
      setCopied(false);
    } else {
      setGeneratedCode(null);
    }
    setGeneratedDTBCCode(generateDateTimeBasedCode());
    setCopiedDTBC(false);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyDTBCCode = async () => {
    if (!generatedDTBCCode) return;
    try {
      await navigator.clipboard.writeText(generatedDTBCCode);
      setCopiedDTBC(true);
      setTimeout(() => setCopiedDTBC(false), 2000);
    } catch {
      setCopiedDTBC(false);
    }
  };

  if (!mounted) {
    return (
      <div id="divAdminRoot" className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div
        id="divAdminRoot"
        className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4"
      >
        <div
          id="divAdminLoginCard"
          className="w-full max-w-sm rounded-2xl border border-green-200 bg-white/95 p-6 shadow-md"
        >
          <h1 className="mb-2 text-xl font-semibold text-slate-800">Admin</h1>
          <p className="mb-4 text-sm text-slate-500">Enter password to continue.</p>
          <form onSubmit={handleAdminLogin}>
            <label htmlFor="inputAdminPassword" className="sr-only">
              Password
            </label>
            <input
              id="inputAdminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mb-4 w-full rounded-xl border border-green-200 bg-green-50/80 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              autoComplete="current-password"
            />
            {loginError && (
              <p className="mb-4 text-sm text-red-600" role="alert">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              Log in
            </button>
          </form>
        </div>
        <Link
          href="/catalog"
          className="mt-4 text-sm text-teal-600 hover:underline"
        >
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div
      id="divAdminRoot"
      className="flex min-h-screen flex-col bg-green-50 text-slate-800"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-green-200 bg-green-200 px-5 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Admin</h1>
        <div className="flex items-center gap-3">
          <Link href="/catalog" className="text-sm text-teal-700 hover:underline">
            ← Catalog
          </Link>
          <button
            type="button"
            id="btnAdminLogout"
            onClick={handleLogout}
            className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-green-50"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <aside
          id="divAdminSidebar"
          className="flex w-52 shrink-0 flex-col border-r border-green-200 bg-green-50/80 py-3"
          aria-label="Admin sections"
        >
          <nav className="flex flex-col gap-0.5 px-2">
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                id={`btnAdminSection_${section.id}`}
                onClick={() => setSelectedSection(section.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  selectedSection === section.id
                    ? "bg-teal-600 text-white"
                    : "text-slate-700 hover:bg-green-200"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <main
          id="divAdminMain"
          className="min-w-0 flex-1 overflow-auto p-6"
          aria-label="Admin content"
        >
          {selectedSection === "activation-code" && (
            <div id="divAdminCodeGen" className="max-w-2xl space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Activation code</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600" aria-label="Instructions">
                <li>Enter the PC name for the machine you want to activate (for PC-based code).</li>
                <li>Generate codes; give either code to the PC — entering either one will activate the app.</li>
                <li>Codes are valid for the current minute only.</li>
              </ul>

              <form onSubmit={handleGenerateCode}>
                <label htmlFor="inputAdminPcName" className="mb-1 block text-sm font-medium text-slate-700">
                  PC name (for PCBC only)
                </label>
                <div className="mb-4 flex gap-2">
                  <input
                    id="inputAdminPcName"
                    type="text"
                    value={pcName}
                    onChange={(e) => {
                      setPcName(e.target.value);
                      setGeneratedCode(null);
                    }}
                    placeholder="e.g. SHOWROOM-1"
                    className="min-w-0 flex-1 rounded-xl border border-green-200 bg-green-50/80 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    id="btnAdminGenerateCode"
                    className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
                  >
                    Generate both
                  </button>
                </div>
              </form>

              <div className="grid gap-6 sm:grid-cols-1">
                <div
                  id="divAdminPCBCCodeBox"
                  className="rounded-2xl border border-green-200 bg-white/95 p-5 shadow-md"
                >
                  <h3 className="mb-1 text-base font-semibold text-slate-900" title="PC-based code. Use when host name works.">
                    PCBC — PC-based code
                  </h3>
                  <p className="mb-3 text-xs text-slate-500">Use when host name works.</p>
                  {generatedCode ? (
                    <div className="flex flex-col gap-2">
                      <code
                        id="outputAdminCodePCBC"
                        className="break-all rounded bg-green-50 px-3 py-2 font-mono text-sm text-slate-800 select-all"
                      >
                        {generatedCode}
                      </code>
                      <button
                        type="button"
                        id="btnAdminCopyCodePCBC"
                        onClick={handleCopyCode}
                        className="self-start rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-green-100"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Enter PC name and click Generate both.</p>
                  )}
                </div>

                <div
                  id="divAdminDTBCCodeBox"
                  className="rounded-2xl border border-green-200 bg-white/95 p-5 shadow-md"
                >
                  <h3 className="mb-1 text-base font-semibold text-slate-900" title="Date-time based code. Use when host name may not work.">
                    DTBC — Date-time based code
                  </h3>
                  <p className="mb-3 text-xs text-slate-500">Use when host name may not work.</p>
                  {generatedDTBCCode ? (
                    <div className="flex flex-col gap-2">
                      <code
                        id="outputAdminCodeDTBC"
                        className="break-all rounded bg-green-50 px-3 py-2 font-mono text-sm text-slate-800 select-all"
                      >
                        {generatedDTBCCode}
                      </code>
                      <button
                        type="button"
                        id="btnAdminCopyCodeDTBC"
                        onClick={handleCopyDTBCCode}
                        className="self-start rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-green-100"
                      >
                        {copiedDTBC ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Click Generate both to create DTBC code.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
