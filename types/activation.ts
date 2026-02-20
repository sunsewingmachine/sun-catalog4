/**
 * Activation code validation types. No allowlist; validation is code format + time match only.
 */

export interface ActivationValidationResult {
  valid: boolean;
  decodedPcName?: string;
  error?: string;
}
