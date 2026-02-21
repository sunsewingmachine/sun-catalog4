/**
 * Feature lookup: key (col A from Features sheet) and label (col B) for display in product features box.
 */

export interface FeatureRecord {
  /** Feature key from sheet column A; matched against product EY segments. */
  key: string;
  /** Display text from sheet column B; shown in the features box. */
  label: string;
}
