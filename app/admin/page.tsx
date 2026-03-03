"use client";

/**
 * Admin page: login; then left sidebar with sections (Activation code, Manage media) and main content.
 * Activation code section: PC name input → generate code for another PC.
 * Manage media section: toggle to enable media management mode on the main catalog page.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateActivationCode, generateDateTimeBasedCode } from "@/lib/activationCodeGen";
import ManageFeaturesSection from "@/components/admin/ManageFeaturesSection";

const ADMIN_SESSION_KEY = "catalog_admin_logged_in";
const ALLOWED_ADMIN_PASSWORDS = ["salkal", "sxjllda", "redpin", ""];
export const MANAGE_MEDIA_MODE_KEY = "catalog_manage_media_mode";

type AdminSectionId = "activation-code" | "manage-media" | "manage-features";
const ADMIN_SECTIONS: { id: AdminSectionId; label: string }[] = [
  { id: "activation-code", label: "Activation code" },
  { id: "manage-media", label: "Manage images" },
  { id: "manage-features", label: "Manage features" },
];

export default function AdminPage() {
  const router = useRouter();
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
  const [manageMediaEnabled, setManageMediaEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    setAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
    setManageMediaEnabled(window.localStorage.getItem(MANAGE_MEDIA_MODE_KEY) === "1");
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
      window.localStorage.removeItem(MANAGE_MEDIA_MODE_KEY);
    }
    setAuthenticated(false);
    setManageMediaEnabled(false);
    setGeneratedCode(null);
    setGeneratedDTBCCode(null);
    setPcName("");
  };

  const handleToggleManageMedia = () => {
    const next = !manageMediaEnabled;
    setManageMediaEnabled(next);
    if (typeof window !== "undefined") {
      if (next) {
        window.localStorage.setItem(MANAGE_MEDIA_MODE_KEY, "1");
      } else {
        window.localStorage.removeItem(MANAGE_MEDIA_MODE_KEY);
      }
    }
    if (next) {
      router.push("/catalog");
    }
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
              autoFocus
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
      className="flex h-screen flex-col bg-green-50 text-slate-800 overflow-hidden"
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
          className={`min-w-0 flex-1 ${selectedSection === "manage-features" ? "overflow-hidden" : "overflow-auto p-6"}`}
          aria-label="Admin content"
        >
          {selectedSection === "manage-media" && (
            <div id="divAdminManageMedia" className="max-w-xl space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Manage media</h2>
              <p className="text-sm text-slate-500">
                Enable media management mode to add or delete images directly on the catalog page.
                When turned on, you will be taken to the catalog to manage images.
              </p>
              <div
                id="divManageMediaToggleRow"
                className="flex items-center justify-between rounded-2xl border border-green-200 bg-white/95 p-5 shadow-md"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">Media management mode</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {manageMediaEnabled
                      ? "Active — go to catalog to add/delete images."
                      : "Off — catalog is in normal view mode."}
                  </p>
                </div>
                <button
                  type="button"
                  id="btnToggleManageMedia"
                  role="switch"
                  aria-checked={manageMediaEnabled}
                  onClick={handleToggleManageMedia}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    manageMediaEnabled
                      ? "border-teal-600 bg-teal-600"
                      : "border-slate-300 bg-slate-200"
                  }`}
                >
                  <span className="sr-only">Toggle media management mode</span>
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      manageMediaEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {manageMediaEnabled && (
                <div
                  id="divManageMediaActiveNotice"
                  className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800"
                >
                  <svg className="h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  <span>
                    Media mode is active.{" "}
                    <Link href="/catalog" className="font-medium underline hover:text-teal-900">
                      Go to catalog →
                    </Link>
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedSection === "manage-features" && (
            <ManageFeaturesSection />
          )}

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
