# Verification

Verified on 26 November 2026.

- 18 Node regression tests pass, including all four supplied order examples, custom ball weights, kg/Bangla digits, ambiguous matching, reversed multiplication, missing costs, phone normalization, cancellations, historical price snapshots, CSV input and backup validation.
- JavaScript syntax checks pass.
- Browser UI checked at phone size (390 × 844): catalog entry, message parsing, order review, saving a bill, private profit, customer history, monthly totals, and persistence after reload.
- Browser CSV import verified with a real local file and confirmation. Catalog updated with the correct price, cost, weight and alias.
- Browser JSON backup exported, restored with confirmation, and verified to retain two products, one order and the correct sales/profit totals. No console errors observed.
- APK compiled with the existing Android SDK. Android package inspected: Android 8+ minimum, target SDK 35, launch activity present, no network/storage permissions requested. APK v2/v3 signatures verified.

Android runtime verification remains outstanding. The existing Android 35 emulator references a missing image, and the Android 36 image folder contains only installer metadata (no kernel or system image). A separate test emulator was attempted without changing the user's existing AVDs; it could not boot. No system image was downloaded. Test installation on an actual phone is still required, particularly native file import/export, Android share sheet and Print / Save as PDF.

The browser preview's test records are separate from the Android package. A new APK installation starts with an empty catalog and no orders.
