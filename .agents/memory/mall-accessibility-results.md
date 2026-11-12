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

網頁上的操作結果需透過 React Native Web 的 DOM `ref.focus()` 移動焦點；不可在 web 呼叫 `findNodeHandle` 或原生 `AccessibilityInfo.setAccessibilityFocus`。原生平台仍使用原生輔助使用焦點。

**Why:** React Native Web 的 `findNodeHandle` 會直接丟出執行期錯誤；這類錯誤只在商場移動或存倉等成功結果後觸發，單純載入頁面不一定會重現。

**How to apply:** 商場焦點回饋改動時，分別測試網頁上的搬動與存倉成功路徑，並保持 iOS／Android 的原生焦點行為。

窄版網頁分區標籤列移動焦點時，應以標籤與實際捲動容器的邊界計算 DOM `scrollLeft`，不要只依賴 React Native Web 的 `ScrollView.scrollTo` 或通用 `scrollIntoView`。

**Why:** Chromium 回歸測試中，焦點與 aria-selected 已更新，但上述捲動呼叫仍讓目前標籤留在可視範圍外；直接更新實際捲動容器的 `scrollLeft` 才能可靠顯示目標。

**How to apply:** 新增或修改網頁上的水平分頁列時，在窄視窗真實瀏覽器中同時檢查焦點、選取狀態、單一 Tab 停駐點及標籤邊界是否落在捲動容器內。

Playwright 的 WebKit 執行結果代表 Safari 使用的瀏覽器引擎行為，不等同於在 macOS 或 iOS 上驗證 Safari 應用程式。

**Why:** Safari 應用程式不能在 Linux 測試環境直接啟動；WebKit 版本及系統函式庫亦可能與 Safari 實際版本不同。

**How to apply:** 報告跨瀏覽器結果時，將 Firefox 與 WebKit 引擎分開列示；若需求是 Safari 實機驗證，另行安排 Apple 裝置或 macOS 測試。
