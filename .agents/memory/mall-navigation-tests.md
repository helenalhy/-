---
name: Mall navigation regression tests
description: Constraints for exercising Expo Router screen transitions in the lightweight React Native test harness.
---

When testing mall navigation, drive the same route entry modules and route stack as the user flow, and explicitly render nested function components that the lightweight test harness does not mount automatically.

**Why:** The harness creates React element records rather than using a native renderer, so merely logging a router push or inspecting a parent tree can miss route wiring and nested scene interactions.

**How to apply:** For mall-to-today flows, push the today route, render its route module, pop the stack, and render the mall route again; assert retained UI state and persisted domain data separately.
