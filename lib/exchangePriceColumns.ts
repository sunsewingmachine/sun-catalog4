/**
 * Column indices for exchange price (from ItmGroup sheet header list). All indices are 0-based.
 * Update these if columns are inserted in the sheet. Item names = col 1, MRP = col 19, FinalExchangePrice per menu.
 */

/** 0-based column index for ItmGroupName (sheet column 1). */
export const COL_ITM_GROUP_NAME = 0;

/** 0-based column index for MRP (sheet column 19). */
export const COL_MRP = 18;

/**
 * 0-based column index for each menu's FinalExchangePrice (Less column).
 * Key = menu key as used in UI (e.g. C1:Sv, C1:Motor). Sheet uses C1:Mot for Motor; both map to same column.
 */
export const COL_FINAL_EXCHANGE_PRICE_BY_MENU: Record<string, number> = {
  "C1:Sv": 84,   // sheet col 85
  "C2:Sv": 90,   // sheet col 91
  "C3:Sv": 95,   // sheet col 97
  "C4:Sv": 102,  // sheet col 103
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
