---
name: Check-in and coin atomicity
description: Preserve consistency when one check-in updates completion history and the earned-coin balance.
---

When a single goal completion updates both check-in history and the coin balance, do not treat writes to separate local-storage keys as an atomic operation. Persist one recovery record first, regard it as the commit point, then mirror both values and remove the record only after both mirrors succeed. On startup and before later mutations, replay any pending record so a partial write cannot be overwritten by stale state.

**Why:** Local key-value storage does not guarantee that separate writes succeed or fail together. A partial write can otherwise leave a goal completed without its reward, or award coins without preserving the completion that earned them.

**How to apply:** Keep future changes to check-in rewards, reward claims, and their persistence on the same recoverable transaction path. Test failure of each mirror separately, failure before the recovery record is committed, and reload while a record is pending.
