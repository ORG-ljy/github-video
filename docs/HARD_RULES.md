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

## 音频与硅基流动 TTS 硬规则（防爆音铁律）

以下规则基于波形级实测定位，所有配音与混音脚本必须严格遵守：

1. **硅基流动 API 必须传 `gain: -6.0`（防 16-bit 整数溢出回绕爆音）**：
   - 实测 `FunAudioLLM/CosyVoice2-0.5B` 在默认 `gain: 0.0` 下，对高能量参考声纹（如 `ljy-hook-clean`）会在服务端 float → int16 量化时发生**符号翻转回绕**（相邻采样跳变达 `65,000+`），产生无法靠后期消除的刺耳爆音。
   - 请求 `/v1/audio/speech` 时**强制传入 `"gain": -6.0`**（范围 `-4.0 ~ -8.0`），并优先拉取无损 `response_format: "wav"`，可将溢出尖峰降为 **0**，再由本地 FFmpeg 统一拉升到标准响度。
2. **FFmpeg `loudnorm` 后必须接 `aresample=48000`**：
   - `loudnorm` 滤镜内部会自动升频至 `192kHz`（导出 AAC 时被截断为 `96kHz`），与 `44.1kHz` BGM 混音会导致杂音与音频提前截断。
   - 必须在 `loudnorm` 之后显式追加 `aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo`（或 `mono`），输出统一为标准 **`48kHz` AAC**，并在 `amix` 中设置 `normalize=0`。
3. **单主声纹 + 无情绪指令 + 单次母带**：
   - 全片锁定单一主声纹（通过 `.env` 中的 `SILICONFLOW_VOICE_URI` 注入，禁止把私人克隆声纹 URI 写死在公开仓库代码里），不叠加 `<|endofprompt|>` 情绪指令（防止语气变形与能量过载）。
   - 压缩器 `acompressor` 的 `makeup` 必须设为 `1`（线性 0dB 增益，严禁设 `2` 造成 +6dB 过载），仅在整轨拼接完成后执行**单次** `loudnorm=I=-16:TP=-2.0:LRA=11` + `alimiter=limit=-1.5dB:level=false`。
4. **双轨发音词典（展示与口播分离）**：
   - 画面与字幕保留原词，送入 TTS 前统一过 [data/pronunciation-dict.json](../data/pronunciation-dict.json)（实测固化：**`GitHub` 必须保留原拼写透传，禁止改成 `get hub` / `Git Hub` / `Github`**；`Cursor → curser`、`DevTools → Dev Tools`、`一行 → 一航` 等）。
5. **禁止使用高能量低频合成音效**：
   - 严禁叠加未过滤的低频正弦波重击（如 `boom.wav`），以免在手机/笔记本扬声器上听感类似噗麦爆音；切镜音效音量控制在 `0.14–0.15` 以内，BGM 控制在 `-24dB ~ -22dB`。
6. **防吞字与连贯度铁律（实测血泪教训）**：
   - **必须严格使用原速 `speed: 1.0`**（实测 `1.08×` 会在 CosyVoice2 服务端造成严重吞音与韵律崩坏）。
   - **按幕整段一次合成（每段 15–25 秒自然长句），严禁把脚本切碎成十几段 2–3 秒短句硬拼**，彻底消除起音语调割裂。
   - **禁止使用暴力 `silenceremove` 裁切静音**（仅首尾加 `10ms` 淡入淡出），并强制用 `SenseVoiceSmall` ASR 逐字校验无吞字后再进入视频渲染。


