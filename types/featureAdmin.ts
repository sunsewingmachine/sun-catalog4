/**
 * Types for the admin "Manage features" section.
 * Represents rows from the Features Google Sheet and the combined API response
 * that also includes existing R2 filenames in CatelogPicturesVideos/.
 */

/** A single row from the Features sheet with cols A (key), B (label), C (mediaFilename). */
export interface FeatureAdminRow {
  /** 1-based Google Sheet row number (accounts for header rows). */
  rowNumber: number;
  /** Column A: feature key, matched against product EY segments. */
  key: string;
  /** Column B: display label shown in the features box. */
  label: string;
  /** Column C: media filename in R2 CatelogPicturesVideos/ folder (may be empty). */
  mediaFilename: string;
}

/** Response from GET /api/features-media */
export interface FeaturesMediaResponse {
  rows: FeatureAdminRow[];
  /** Filenames currently present in R2 CatelogPicturesVideos/ folder. */
  r2Files: string[];
}
