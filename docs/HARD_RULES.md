# Remotion 确定性渲染硬规则（参考 @vibe-motion/remotion-starter）

为确保 AI 协作或后续扩写新镜头时画面稳定、无闪烁、无错位，所有视频组件必须遵守以下红线：

1. **纯帧驱动（Frame-Driven）**：所有动画必须由 `useCurrentFrame()`、`spring()`、`interpolate()` 驱动，**禁止**使用 CSS `transition`、`@keyframes`、`animation`、`setTimeout` 或 `requestAnimationFrame`。
2. **插值必须 Clamp**：所有 `interpolate()` 调用必须显式设置 `extrapolateLeft: 'clamp'` 和 `extrapolateRight: 'clamp'`（统一复用 `src/kit/motion.ts` 中的 `clampInterpolate`）。
3. **禁止非确定性随机**：Remotion 会并发乱序渲染帧，**禁止**在组件内调用 `Math.random()` 或 `Date.now()`；如需随机效果，使用 Remotion 提供的 `random(seed)`。
4. **静态资源走 `staticFile()`**：音视频、字体、截图素材统一放在 `public/` 目录下，通过 `staticFile('audio/xxx.mp3')` 引用。
5. **先静帧 QA，再渲染全片**：修改动效或排版后，先执行 `pnpm qa:stills` 或 `pnpm still:vertical` 检查关键帧构图与字号，再渲染完整 MP4。
6. **三层架构分离**：
   - `src/kit/`（L1 共享引擎层）：主题 token、动效函数、通用组件。
   - `src/compositions/`（L2 出片编排层）：只做场景组装与时间线编排。
   - `data/` + `public/`（L3 数据与素材层）：榜单 JSON、配音 MP3、SRT 字幕、音效素材。
