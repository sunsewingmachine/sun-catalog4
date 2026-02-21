/**
 * Column indices for exchange price (from ItmGroup sheet header list). All indices are 0-based.
 * Rule: 0-based index = sheet column (1-based) − 1. Update if columns are inserted in the sheet.
 */

/** 0-based column index for ItmGroupName (sheet column 1). */
export const COL_ITM_GROUP_NAME = 0;

/** 0-based column index for R (sheet column 18); discount = S − R. */
export const COL_R = 17;

/** 0-based column index for MRP (sheet column 19, column S). */
export const COL_MRP = 18;

/**
 * 0-based column index for each menu's FinalExchangePrice (Less column). Index = sheet col − 1.
 */
export const COL_FINAL_EXCHANGE_PRICE_BY_MENU: Record<string, number> = {
  "C1:Sv": 84,   // sheet col 85 → 85−1
  "C2:Sv": 90,   // sheet col 91 → 91−1
  "C3:Sv": 96,   // sheet col 97 → 97−1 (was 95, wrong)
  "C4:Sv": 102,  // sheet col 103 → 103−1
  "C1:Ta1": 108, // sheet col 109
  "C2:Ta1": 113, // sheet col 115
  "C3:Ta1": 118, // sheet col 121
  "C4:Ta1": 126, // sheet col 127
  "C1:Mot": 132, // sheet col 133
  "C2:Mot": 138, // sheet col 139
  "C3:Mot": 144, // sheet col 145
  "C4:Mot": 150, // sheet col 151
  // UI uses "Motor" but sheet header is "Mot"
  "C1:Motor": 132,
  "C2:Motor": 138,
  "C3:Motor": 144,
  "C4:Motor": 150,
};
