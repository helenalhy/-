---
name: Cosmetics try-on visuals
description: Visual requirements and verification expectations for the cosmetics try-on screen.
---

The try-on portrait should show a large, straight-on face through the shoulders, close to the original preview size. Lipstick and eyeshadow must follow each guest's actual lip and eyelid positions; the eight portraits differ in vertical placement, so they need individual anchors. Each eye needs its own curved shadow path: positive bend follows a downward arc, negative bend follows an upward arch, and tilt handles sloped lids. Avoid opaque shapes that cover pupils or extend onto cheeks.

**Why:** The user reported repeated preview failures: the earlier side-angled portraits and opaque overlays made makeup look misplaced even though code and type checks passed.

**How to apply:** Keep all eight portraits front-facing, measure each eye/lip anchor against that exact source image (a 10-unit coordinate grid helps), tune both eye curves independently, and check the rendered, unlocked mobile screen; contact-sheet estimates, source tests, and compilation alone are not visual confirmation.
