# MongoDB Database Investigation Report
## Makseb Statistique - idCRM=2264 (POKE DOKE) Analysis

Generated: March 12, 2026

---

## EXECUTIVE SUMMARY

**THE PROBLEM**: `/get-tickets` returns empty for idCRM=2264, but `/get-sales-summary` shows data with "EtatTiquer: Encaiser: 737"

**ROOT CAUSE**: Individual ticket records are **missing** from the `Tiquer` collection for this store, even though aggregated summaries exist in `livestats` collection.

---

## DATABASE COLLECTIONS

### Complete Collection List (5 total):

| # | Collection | Purpose | Total Docs | Docs for 2264 |
|---|-----------|---------|-----------|--------------|
| 1 | **Message** | Messages | 1 | 0 |
| 2 | **Tiquer** | Individual Tickets | 75,259 | **0 ❌** |
| 3 | **user** | Store Credentials | 77 | 1 ✅ |
| 4 | **TempsReels** | Real-time Data | 572 | 0 |
| 5 | **livestats** | Aggregated Summaries | 7,605 | 70 ✅ |

---

## DATA FOR idCRM=2264 (POKE DOKE)

### ✅ FOUND IN `livestats` (70 documents)
- **Purpose**: Aggregated daily sales summaries
- **Date Range**: 20251210 to recent dates
- **Key Field**: `EtatTiquer` object with status counts
- **Sample Document**:
  ```json
  {
    "_id": "693d3b0efba51e4799b4d3f7",
    "IdCRM": "2264",
    "date": "20251210",
    "EtatTiquer": {
      "Encaiser": 39,
      "Rembourser": 0,
      "Annuler": 0
    },
    "ChiffreAffaire": {
      "Total_HT": 9.73,
      "TVA": 40.62,
      "Total_TTC": 21.69
    },
    "ProduitDetailler": { /* product sales breakdown */ }
  }
  ```

### ❌ MISSING FROM `Tiquer` (0 documents)
- **Should contain**: Individual ticket details with menu items, amounts, payment methods
- **Field name**: `idCRM` (note: lowercase 'id', different from livestats)
- **What this means**: No granular ticket-level data exists for this store
- **Comparison**: Store 2435 has 39,525 individual tickets in this collection

### ✅ FOUND IN `user` (1 document)
- **Store Name**: POKE DOKE
- **Status**: Activer (Active)
- **Login**: POKEDOKE
- **Licence**: Enable
- **Last Interaction**: 2026-03-12T10:15:33.027Z

---

## ENDPOINT MAPPING

### /get-sales-summary
- **Route**: GET `/get-sales-summary?idCRM=2264&date1=YYYYMMDD&date2=YYYYMMDD`
- **Function**: `getLivestatByIdandDate()`
- **Queries**: `livestats` collection
- **Status**: ✅ **WORKS** - Returns 70 aggregated records
- **Result**: Shows daily summaries with `EtatTiquer` counts

### /get-tickets
- **Route**: GET `/get-tickets?idCRM=2264&date1=YYYYMMDD&date2=YYYYMMDD`
- **Function**: `getTiquerId()`
- **Queries**: `Tiquer` collection
- **Status**: ❌ **EMPTY** - Returns 0 records
- **Result**: No individual ticket data available

### /get-detailed-sales-summary (secondary)
- **Route**: GET `/get-detailed-sales-summary?idCRM=2264&date1=YYYYMMDD&date2=YYYYMMDD`
- **Function**: `getLivestatByIdandDate2()`
- **Queries**: `TempsReels` collection
- **Status**: ❌ **EMPTY** - Returns 0 records

### /get-payment-statistics
- **Route**: GET `/get-payment-statistics?idCRM=2264&date1=YYYYMMDD&date2=YYYYMMDD`
- **Function**: `getPaymentStatistics()`
- **Queries**: `Tiquer` collection
- **Status**: ❌ **FAILS** - No payment data (queries empty Tiquer collection)

---

## DATA STRUCTURE ANALYSIS

### Tiquer Collection (Individual Tickets)
**Sample Document Structure:**
```json
{
  "_id": ObjectId,
  "idCRM": "2435",              // Store ID (STRING - varies in format!)
  "IdCRM": 2435,                // Alternative field (NUMBER)
  "Date": "20250704",           // Ticket date (YYYYMMDD)
  "idTiquer": "152291",         // Ticket ID
  "HeureTicket": "11:49",       // Ticket time
  "TTC": 82.66,                 // Total TTC
  "ModeConsomation": "Sur place",
  "ChiffreAffaire": {           // Sales breakdown
    "Total_TTC": 23,
    "Total_Ht": 50.16,
    "Total_TVA": 65.61
  },
  "Menu": [                     // Menu items
    {
      "NameProduct": "Poke Bowl",
      "TTC": 15.50,
      "QtyProduct": 1
    }
  ],
  "ModePaiement": [             // Payment methods
    {
      "ModePaimeent": "CARTE BANCAIRE",
      "totalwithMode": 82.66
    }
  ],
  // ... more fields
}
```

### livestats Collection (Aggregated Summaries)
**Sample Document Structure:**
```json
{
  "_id": ObjectId,
  "IdCRM": "2264",              // Store ID (STRING)
  "date": "20251210",           // Summary date (YYYYMMDD)
  "EtatTiquer": {               // Status counts - THIS IS WHERE "Encaiser: 737" COMES FROM
    "Encaiser": 39,             // Tickets encashed/paid
    "Rembourser": 0,            // Refunded tickets
    "Annuler": 0                // Cancelled tickets
  },
  "ChiffreAffaire": {           // Revenue summary
    "Total_HT": 9.73,
    "TVA": 40.62,
    "Total_TTC": 21.69
  },
  "ChiffreAffaireDetailler": {  // VAT rate breakdown
    "Taux10": {
      "Taux": "10",
      "TTC": 42.43,
      "HT": 28.81,
      "TVA": 92.7
    },
    "Taux0": { /* ... */ }
  },
  "ProduitDetailler": {         // Product sales
    "FORMULES": { "Somme": 256, "Qty": 17 },
    "DESSERT": { "Somme": 59.6, "Qty": 5 },
    // ... more products
  },
  "modePaiement": [ /* payment breakdown */ ],
  "modeConsomation": [ /* consumption mode breakdown */ ],
  "devise": "€"
}
```

---

## KEY FIELD NAMES BY COLLECTION

| Collection | Store ID Field | Date Field | Notes |
|-----------|----------------|-----------|-------|
| **Tiquer** | `idCRM` (string) | `Date` | Individual tickets - 0 docs for 2264 ❌ |
| **livestats** | `IdCRM` (string) | `date` | Aggregated summaries - 70 docs for 2264 ✅ |
| **TempsReels** | `IdCRM` (string) | `date` | Real-time data - 0 docs for 2264 ❌ |
| **user** | `idCRM` (string) | N/A | Store credentials - 1 doc for 2264 ✅ |

---

## COMPARISON: idCRM=2264 vs idCRM=2435

| Store | Status | livestats | Tiquer | TempsReels | user |
|-------|--------|-----------|--------|-----------|------|
| **2264** (POKE DOKE) | Active | 70 ✅ | 0 ❌ | 0 ❌ | 1 ✅ |
| **2435** (other store) | - | 37 ✅ | 39,525 ✅ | 7 ✅ | 1+ ✅ |

**Conclusion**: Store 2435 has complete data pipeline (livestats → TempsReels → Tiquer), but store 2264 only has livestats aggregates.

---

## DISTINCT idCRM VALUES IN Tiquer COLLECTION

**All distinct values**: 2435, 1001, 2000, 3000, 5000, 50215294, 5555, 6000, 8888, 9999, C001

**Status**: **2264 NOT FOUND** ❌

This means:
- Individual tickets for store 2264 were NEVER sent to the Tiquer collection
- Only store 2435 has extensive ticket history in the system
- Store 2264's data only exists in the aggregated `livestats` form

---

## RECOMMENDATIONS

### Immediate Actions:
1. **Check the data pipeline**: How does data get from POS system to `livestats` vs `Tiquer`?
2. **Verify API upload endpoint**: Is the store uploading individual tickets or just summaries?
3. **Check UpdateTiquer function**: Verify if `/update-ticket` endpoint is being called for store 2264
4. **Review logs**: Check if there are errors when store 2264 tries to send individual ticket data

### Root Cause Questions:
1. Are individual ticket records being generated at the POS for store 2264?
2. Is there a filter that prevents store 2264 from uploading to Tiquer collection?
3. Is the store sending pre-aggregated data instead of raw tickets?
4. Are there firewall/network restrictions for this store?

### To Fix:
1. Ensure UpdateTiquer endpoint receives raw ticket data for store 2264
2. Verify database insert permissions are correct
3. Check if the POS software is configured to send individual tickets
4. Review the data migration/upload process for this store

---

## QUERY REFERENCE

### Check current state:
```javascript
// In MongoDB shell or via Node.js:

// Count tickets for 2264
db.Tiquer.find({ idCRM: '2264' }).count()  // Currently returns 0

// View livestats for 2264
db.livestats.find({ IdCRM: '2264' }).limit(1)

// View all distinct stores in Tiquer
db.Tiquer.distinct('idCRM')
```

---

## Files Created for Investigation
- `debug_collections.js` - Lists all collections and checks for idCRM data
- `debug_date_ranges.js` - Analyzes date ranges and document counts
- `debug_tiquer.js` - Deep dive into Tiquer collection structure

