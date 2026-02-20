"use client";

/**
 * Gate: if activated (sessionStorage), show children (catalog link or redirect); else show ActivationScreen.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActivationScreen from "./ActivationScreen";

const ACTIVATED_KEY = "catalog_activated";

export default function Gate() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    setActivated(
      typeof window !== "undefined" && window.sessionStorage?.getItem(ACTIVATED_KEY) === "1"
    );
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (activated) router.replace("/catalog");
  }, [mounted, activated, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }
  if (activated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-zinc-500">Redirecting to catalog…</p>
      </div>
    );
  }
  return <ActivationScreen />;
}
