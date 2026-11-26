# Cotton Ledger

**An offline Android app for yarn and cotton ball sellers.** Save your products, paste an order message, review the matches, and generate a bill with your business records updated automatically.

[Download Android APK](https://github.com/Lzefron/cotton-ledger/raw/refs/heads/main/downloads/Cotton-Ledger.apk) · [Product CSV template](products-template.csv) · [Verification notes](TESTING.md)

## Features

- Product catalog with complete variant names, selling prices, buying costs and editable grams per unit. Yarn defaults to **100 gm per ball**.
- CSV catalog import and English/Bangla nicknames for product matching.
- Local parsing of pasted order messages, including English/Bangla customer details and digits.
- Quantities from `6*80`, `6 balls`, `15 pis`, `600 gm` or `1.5 kg`. Weight uses each product's saved grams: **600 gm ÷ 100 gm = 6 balls**.
- Editable preview with flags for unmatched products, ambiguous variants, missing quantities and inconsistent totals.
- Product bills with Android sharing and Print / Save as PDF. Customer bills exclude costs, profit and delivery.
- Customer history by normalized Bangladesh mobile number: order count, product spend, outstanding product balance and gross profit.
- Monthly sales/profit, separate yarn-ball/accessory counts, grams, top products and six-month growth charts.
- JSON backup/restore and monthly order CSV export.

**No account, API key, server, cloud database, analytics or internet permission is required.** Records stay on the device. Parsing uses local rules and catalog matching, not an external AI service.

## Install on Android

1. Tap **[Download Android APK](https://github.com/Lzefron/cotton-ledger/raw/refs/heads/main/downloads/Cotton-Ledger.apk)** on the phone. If downloading on a computer, transfer `Cotton-Ledger.apk` to the phone.
2. Open the APK from **Files / Downloads**.
3. If Android asks, allow installation from the browser/file manager you used, then tap **Install**.
4. Open **Cotton Ledger**. A fresh installation starts with an empty catalog and no orders.

**Requires Android 8.0+ and an up-to-date Android System WebView.** This is a locally signed APK, not a Play Store listing.

For updates, **export a backup first**, then install the new APK over the existing app. Do not uninstall to update. Updates must use the same signing key to retain the existing installation and its records.

## Set up products

### Add manually

Open **Products → Add product**:

| Field | What to enter |
| --- | --- |
| Product name | Complete variant, e.g. `Summer yarn medium thickness white color`. No separate category hierarchy is needed. |
| Selling price | Taka per ball or piece. |
| Buying cost | Your actual cost per ball or piece, used for gross profit. |
| Unit | Ball for yarn; Piece / accessory for needles and similar items. |
| Grams per unit | Defaults to 100. Set the actual weight. Accessories may use 0 if weight is not tracked. |
| Nicknames | Other message spellings, one per line, including Bangla aliases. |

Use a separate product for every color, thickness and needle size you want to distinguish.

### Import CSV

1. Download [products-template.csv](products-template.csv) using GitHub's **Download raw file** option.
2. Open it in a spreadsheet editor and replace the example catalog/prices with your own.
3. Fill in actual buying costs and check all weights.
4. Save as **CSV UTF-8**.
5. Open **Products → Import CSV**, select the file, check the import counts and confirm.

```csv
name,sellPrice,buyPrice,weight,unit,aliases
Summer yarn medium thickness white color,80,,100,ball,Summer white|সামার সাদা
Circular knitting needle 80cm 3.5mm,145,,0,piece,3.5mm needle
```

- `name`, `sellPrice` and `buyPrice` headers are required. The template's costs are intentionally blank; enter your own costs.
- Blank weight defaults to 100 gm; yarn balls require weight greater than zero.
- Unit is `ball` or `piece`; blank defaults to `ball`. Separate CSV aliases with `|`.
- Matching an existing full product name updates the catalog entry. Duplicate names in one CSV are rejected.
- Blank buying costs can be imported, but must be filled before saving an order containing that product.

## Paste an order and generate a bill

1. Open **New order** and paste **one customer's message**: name, address, mobile number, then products.
2. Tap **Review order**.
3. Check customer details, product matches, quantities, selling prices and costs.
4. Choose a saved product for each unmatched line, or use **Create product** from the preview.
5. Confirm each flagged line after checking its product, quantity, weight and price.
6. Choose the order date and payment status, then tap **Save order & bill**.

Example using sample customer details:

```text
Name: Sample Customer
Address: Sample Road, Dhaka
Mobile: 01700000001

Order Summary
Summer yarn
Medium thickness
White color 600 gm
6*80=480 tk

Delivery charge 80 tk
Total 560 tk due
```

With the matching 100 gm product saved, this becomes **6 balls, 600 gm and a product bill of ৳480**. Delivery is excluded from bills and accounting.

An explicit message price is used when available; otherwise the catalog selling price is used. Differences from the catalog are flagged. Buying cost comes from the catalog and can be corrected in review.

For `15 pis` followed by `135*15`, the piece count helps recognize reversed multiplication. The result is flagged for you to verify **15 × ৳135 = ৳2,025**.

Review is part of the workflow because messages vary. Nicknames improve matching. Use **Start manually** when a message is unclear. Fractional ball quantities must be corrected to whole numbers before saving.

## Bills, payments and corrections

- Open an order to see its bill and private cost/profit summary.
- **Share bill** opens Android's share sheet; sending happens only when you choose an app/recipient.
- **Print / PDF** opens Android printing. Choose **Save as PDF** where available.
- Customer bills omit buying costs, profit and delivery charges.
- **Mark paid / Mark due** changes payment status.
- **Edit order** corrects customer details, items, date, costs and status. Choose **Cancelled** to exclude it from reports.
- **Delete** permanently removes an order after confirmation.
- Matching phone/date/products/quantities/prices trigger a possible duplicate warning before another copy is saved.

## Reports and accounting

| Metric | Meaning |
| --- | --- |
| Product sales | Sum of quantity × selling price; delivery excluded. |
| Buying cost | Sum of quantity × buying cost per unit. |
| Gross profit | Product sales minus buying cost, before other business expenses. |
| Customer spend | Product value ordered, including paid and due orders. |
| Outstanding balance | Product value of orders marked Due. |
| Balls / accessory pieces | Separate counts based on the saved product unit. |
| Grams sold | Sum of quantity × configured grams per unit. |

Open **Home** and choose the report month to see totals, top products, recent orders and six months of sales/profit. Expand **View chart values** for the graph's numbers in a table.

Paid and due orders count toward sales and gross profit. **Cancelled orders are excluded** from dashboard/customer totals. Gross profit is not net profit or cash received.

Dates default to the current date in **Asia/Dhaka** and can be backdated. Catalog changes apply to future orders. Saved orders retain snapshots of selling prices, buying costs, weights and units. Explicitly editing an order updates its historical report.

**Backup & data → Export CSV** exports the month selected on Home, including order status, sales, cost, profit, units and grams. Cancelled orders remain in this export with their status for audit; exclude them when calculating your own totals.

## Backup, restore and moving phones

### Export

1. Open **Backup & data → Export JSON**.
2. Choose a save location with Android's file picker.
3. Keep a copy separate from the app's storage.

Backups contain products and orders, including customer information and cost snapshots. Customer history and reports are calculated from those records.

### Restore / transfer

1. Install the app on the destination phone and transfer the exported JSON backup to it.
2. Open **Backup & data → Restore JSON** and choose the file.
3. Check the product/order counts and confirm replacement.

**Restore replaces current records; it does not merge them.** Export existing records first if you need to retain them.

Uninstalling, clearing app storage, losing the phone or clearing the browser preview's site data removes the local records. There is no automatic cloud sync or Android cloud backup. Regular JSON exports are the recovery method. Backups contain customer information and buying costs; keep them private.

## Run the browser preview

Install Node.js 22+ and Git:

```powershell
git clone https://github.com/Lzefron/cotton-ledger.git
cd cotton-ledger
node tools/preview.mjs
```

Open **http://127.0.0.1:4173**. Stop with **Ctrl+C**. No `npm install` is needed.

This optional loopback server serves static files for development; it has no API or database. Browser records are stored in that browser and are separate from Android records. Use JSON backup/restore to transfer them. The Android APK bundles all assets and needs no server.

## Tests and verification

```powershell
node --test tests/core.test.mjs
node --check web/app.mjs
node --check web/core.mjs
```

The 18 regression tests cover all four message formats, reversed multiplication, custom weights, kilograms/Bangla digits, ambiguity, missing costs, phone normalization, cancellations, historical prices, CSV and backup validation. GitHub Actions runs the tests on Node.js 22 and 24.

Sample product totals are **৳3,150, ৳2,025, ৳700 and ৳1,630**. Public sample names, phone numbers and street addresses have been replaced with sample values.

See [TESTING.md](TESTING.md) for browser checks and remaining device checks. APK compilation and v2/v3 signatures verify. It has **not yet been tested on a physical Android phone** because the local emulator image was incomplete. Native file import/export, sharing and printing still need a phone check.

## Build the APK

The build uses Windows PowerShell, a JDK and Android SDK tools directly, without npm dependencies or Gradle downloads.

Install or locate:

- Android platform **35** (`platforms/android-35/android.jar`).
- Android SDK build tools **36.0.0** (`aapt2`, `d8`, `zipalign`, `apksigner`).
- A JDK that compiles Java 8 source. The included APK was built using JDK 25.

From the repository root, substitute your own SDK/JDK paths:

```powershell
.\tools\build-android.ps1 -Sdk 'E:\Android tools\Sdk' -Jdk 'C:\Program Files\Microsoft\jdk-25.0.1.8-hotspot'
```

Intermediate/temporary files go into `build/`; the verified APK goes to `releases/Cotton-Ledger.apk`. Defaults match the original development computer at `E:\CottonLedger`; override parameters elsewhere. Other operating systems need an equivalent script.

### Signing and updates

The first local build creates `signing/cotton-ledger-local.jks`, alias `cottonledger`, using development password `android`. The key is **not in GitHub**. The downloadable APK uses the original developer's local key.

- Keep your key private and backed up. Updates need that same key to replace an existing installation in place.
- A fresh clone creates a different key and cannot update the downloadable APK in place. Export records before switching signing identities.
- Increment the version code/name in the build script for subsequent distributed versions.
- Establish protected release signing for wider distribution; the supplied script is a local development build process.

## Project structure

```text
android/                 Android shell, manifest and icon
web/                     Bundled offline UI and business logic
  core.mjs               Parsing, matching, accounting, CSV/backup validation
  app.mjs                Products, review, bills, customers, reports and storage
  samples.mjs            Sample order formats with sample customer data
tests/                   Regression tests and CSV fixture
tools/                   Preview and Android build scripts
downloads/               Installable APK and SHA-256 checksum
.github/workflows/       Automated Node.js checks
products-template.csv    Catalog template; enter actual costs and weights
TESTING.md               Verification evidence and remaining checks
```

Build output, signing keys, private keys and backup files are excluded from Git. Android requests no network or broad storage permission; file import/export uses the system document picker.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Installation blocked | Use the APK from this repository and a browser/file manager allowed to install apps. |
| “App not installed” | Check Android 8+ support, free storage and whether an existing installation has a different signing key. Export its data before any uninstall. |
| Blank screen on an older phone | Update Android System WebView and reopen the app. |
| Product unmatched | Check the full catalog name, add message spellings as nicknames, or select/create the product in review. |
| Wrong ball quantity | Check grams per unit, piece count and multiplication. Correct the preview. |
| Order cannot save | Enter name, address, valid Bangladesh mobile, product matches, positive whole quantities, costs and flagged confirmations. |
| CSV import fails | Use UTF-8 CSV with required headers and valid numeric values. |
| Historical amounts changed | Catalog edits retain snapshots; check whether the order itself was edited. |
| Records disappeared | Restore an exported JSON backup. There is no server copy. |
| Port 4173 is busy | Stop an earlier preview before starting another. |
