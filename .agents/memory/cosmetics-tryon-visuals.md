---
name: Cosmetics try-on visuals
description: Visual requirements and verification expectations for the cosmetics try-on screen.
---

The try-on portrait should show a large face through the shoulders, close to the original preview size. Lipstick and eyeshadow must be clearly visible on each selected guest's lips and eyelids. Compilation and source-level tests do not prove this visual behavior.

**Why:** The user reported more than once that the portrait crop and makeup positions still looked wrong in the preview.

**How to apply:** When changing portrait crops, preview dimensions, or makeup anchors, inspect the rendered, unlocked try-on screen on mobile and check each guest; do not treat a passing typecheck as visual confirmation.
