# NAV Fetching — Same-Day NAV Integration

## Current State (Mock)

NAV values are currently hardcoded in `frontend/src/views/admin/research-dashboard/variables/mockData.js` as the `navByIsin` export:

```javascript
export const navByIsin = {
  "INF090I01JS8": 155,  // Franklin India ELSS Tax Saver
  "INF769K01DM9": 200,  // Mirae Asset ELSS Tax Saver (DM9)
  "INF769K01DK3": 175,  // Mirae Asset ELSS Tax Saver (DK3)
  "INF209K01108": 180,  // Aditya Birla Sun Life ELSS Tax Saver
  "INF194K01W62": 90,   // BANDHAN Flexi Cap Fund
  // ... etc
};
```

Each recommendation object also has a `nav` field populated from this lookup during the mapping step.

## Target State (API Integration)

### Data Source
AMFI (Association of Mutual Funds in India) publishes daily NAV data at:
- **URL:** `https://www.amfiindia.com/spages/NAVAll.txt`
- **Format:** Pipe-delimited text file, updated daily by ~11 PM IST
- **Fields:** Scheme Code | ISIN Div Payout/Growth | ISIN Div Reinvestment | Scheme Name | Net Asset Value | Date

### Backend API
```
GET /api/nav?isin=INF090I01JS8
GET /api/nav/bulk?isins=INF090I01JS8,INF769K01DM9,...
```

**Response:**
```json
{
  "INF090I01JS8": {
    "nav": 155.42,
    "date": "2026-04-15",
    "schemeName": "Franklin India ELSS Tax Saver Fund - Growth"
  }
}
```

### Implementation Plan

1. **Backend: NAV Ingestion Service**
   - Cron job: fetch AMFI NAV file daily at 11:30 PM IST
   - Parse pipe-delimited text → store in `fund_navs` table
   - Schema: `isin VARCHAR(20) PK, nav DECIMAL(12,4), nav_date DATE, scheme_name TEXT, updated_at TIMESTAMPTZ`
   - Index on `(isin, nav_date)` for lookups

2. **Backend: NAV API Endpoint**
   - `GET /api/nav/bulk` — accepts comma-separated ISINs, returns latest NAV per ISIN
   - Cache layer: Redis with 24h TTL (NAV changes once per day)
   - Fallback: if today's NAV not yet available, return previous business day's NAV

3. **Frontend: NAV Context / Hook**
   - Replace `navByIsin` static export with a `useNAV(isins: string[])` hook
   - Hook fetches from `/api/nav/bulk` on mount, caches in React state
   - Returns `{ navByIsin: Record<string, number>, isLoading: boolean }`
   - Used by: RecommendationsTable (passes to modal), RecommendationDetailModal (displays NAV)

4. **Frontend: Modal Integration**
   - Left panel: "Current Day NAV" stat line with date (e.g., "₹155.42 (15 Apr 2026)")
   - Right panel: when Qty changes → helper text shows `Amount = Qty × NAV`
   - When Amount changes → helper text shows `Qty = Amount / NAV`

### Database Table

```sql
CREATE TABLE fund_navs (
    isin            VARCHAR(20) NOT NULL,
    nav_date        DATE NOT NULL,
    nav             DECIMAL(12, 4) NOT NULL,
    scheme_name     TEXT,
    scheme_code     VARCHAR(20),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (isin, nav_date)
);

CREATE INDEX idx_fund_navs_latest ON fund_navs (isin, nav_date DESC);
```

### Edge Cases
- **Holiday / weekend:** No new NAV published. Use most recent available date.
- **New fund listing:** ISIN not yet in the table. Return null, UI shows "NAV unavailable".
- **Mid-day requests:** NAV is published end-of-day. During market hours, previous day's NAV is used.
- **Multiple ISINs for same fund:** Some funds have separate ISINs for growth/dividend options. Match on the growth ISIN (Div Payout/Growth column in AMFI data).
