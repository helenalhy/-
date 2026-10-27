---
name: Nested screen-reader labels
description: Ensure informative content inside a labeled interactive control remains available to screen readers.
---

When an interactive parent has an explicit `accessibilityLabel`, do not assume a nested child's own `accessibilityLabel` will be announced separately. Put essential state and reward information in the parent's label, and test the actual interactive element's accessible name.

**Why:** Native screen readers often expose an explicitly labeled parent as one accessibility element, suppressing nested content. A child label can exist in the rendered tree but remain unheard.

**How to apply:** For goal cards and other grouped controls, build labels from current state and test both the available-information case and states where that information must disappear.
