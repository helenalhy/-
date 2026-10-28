---
name: Mall read failures
description: Preserve user data when persisted mall data cannot be parsed or validated.
---

Do not normalize unreadable mall data into default empty values and continue as if it loaded. Validate persisted data before migration or any write; on failure, preserve the raw value, show a clear load error instead of the empty mall, and pause local mutations that mirror mall data and cloud synchronization until reload after repair.

**Why:** A fallback empty state can be mistaken for a real empty mall, then overwrite ownership, coins, positions, or the corresponding cloud snapshot.

**How to apply:** When adding fields or migrations to saved mall data, update validation and test parse errors, shape mismatches, write preservation, and recovery after repaired data is reloaded.
