---
name: Bundled images in generated SVG
description: Cross-platform Expo image URIs and string compatibility for generated SVG previews and downloads.
---

When generated SVG content embeds bundled images, resolve the static asset through `Asset.fromModule()` from `expo-asset`. Do not rely on `Image.resolveAssetSource()` in React Native Web. Use regular-expression replacement for XML escaping instead of `String.replaceAll()` so the code also runs in Hermes.

**Why:** React Native Web's `Image` component does not expose the native asset resolver, and the app's Hermes runtime may not implement `replaceAll`; either can break the whole screen when the SVG is built.

**How to apply:** Use `Asset.fromModule(require(...)).uri` for bundled art included in SVG, and verify both the web preview and exported image.
