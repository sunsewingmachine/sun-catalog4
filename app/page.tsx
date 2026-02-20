/**
 * Gate: show ActivationScreen if not activated, else redirect to catalog.
 */

import Gate from "@/components/activation/Gate";

export default function HomePage() {
  return <Gate />;
}
