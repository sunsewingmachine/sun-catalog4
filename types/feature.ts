/**
 * Feature lookup: key (col A), label (col B), url (col C) for optional media in main viewer.
 */

export interface FeatureRecord {
  /** Feature key from sheet column A; matched against product EY segments. */
  key: string;
  /** Display text from sheet column B; shown in the features box. */
  label: string;
  /** Optional media URL/filename from sheet column C; shown in main area when feature is clicked (image or video). */
  url?: string;
}
