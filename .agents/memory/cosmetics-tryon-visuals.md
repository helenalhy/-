---
name: Cosmetics try-on visuals
description: Visual requirements and verification expectations for the cosmetics try-on screen.
---

The try-on portrait should show a large, straight-on face through the shoulders, close to the original preview size. Lipstick and eyeshadow must follow each guest's actual lip and eyelid positions; the eight portraits differ in vertical placement, so they need individual anchors. Avoid opaque shapes that cover pupils or extend onto cheeks.

**Why:** The user reported repeated preview failures: the earlier side-angled portraits and opaque overlays made makeup look misplaced even though code and type checks passed.

**How to apply:** Keep all eight portraits front-facing, inspect each guest's overlays on mobile, and verify the rendered, unlocked try-on screen; source tests and compilation alone are not visual confirmation.
