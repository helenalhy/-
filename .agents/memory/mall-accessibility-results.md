---
name: 商場讀屏結果回饋
description: 商場操作結果和分區切換的跨平台讀屏回饋慣例
---

商場操作成功後，讓焦點移到可繼續操作的控制項，並由該控制項的可讀標籤說明這次結果；不要同時觸發另一個即時播報，以免 VoiceOver／TalkBack 重複聽到成功訊息。失敗時使用單一即時結果提示，保留重試與取消控制項。

分區切換提示依平台只用一種機制：iOS 使用系統公告；Android 與網頁使用 polite live region。只在使用者切換時更新，不公告程式定位，也不移動焦點。

**Why:** 成功結果若同時由 live region／announce 和焦點標籤播報，讀屏可能重複；失敗則需要留在原操作狀態，讓使用者可重試或取消。

**How to apply:** 商場內操作結果依成功／失敗規則回饋；分區切換跨 iOS、Android、網頁時，避免同時使用系統公告與 live region。

React Native Web 的 `accessibilityState.selected` 不會自動輸出分頁控制所需的 `aria-selected`。網頁上的 `tab` 應同時提供明確的 `aria-selected`，並以真實瀏覽器檢查產生的 DOM。

**Why:** 元件替身只能看到 React Native props，無法發現網頁平台映射後缺失的 ARIA 屬性。

**How to apply:** 新增或調整商場分頁語意時，同時驗證原生 accessibility state 與瀏覽器中的 `role`、`aria-selected`、`tabindex` 和實際焦點。
