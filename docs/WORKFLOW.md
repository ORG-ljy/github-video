# 个人视频制作标准流程（参考抖音浙大猫学长 @vibe-motion 工作流）

## 端到端出片链路

1. **选题与数据抓取**
   - 运行 `pnpm fetch:weekly`（基于 `gh api` / GitHub Search API）自动拉取本周 Star 增长最快的项目，写入 `data/weekly-latest.json`。
   - 人工或让 AI 润色每个项目的中文一句话定位（`tagline`）、简介（`description`）和 2–4 条亮点（`highlights`）。

2. **口播文案、配音与 SRT 字幕生成**
   - 运行 `python3 scripts/generate-tts.py --text "..." --name week48` 生成：
     - `public/audio/week48.mp3`（中文神经语音配音）
     - `public/audio/week48.srt`（标准 SRT 字幕）
     - `public/audio/week48.captions.json`（Remotion 帧级字幕数据）
   - 将 `audioSrc: "audio/week48.mp3"` 与 `captions` 填入数据 JSON。

3. **动效编排与静帧自检（QA）**
   - 开发预览：`pnpm dev` 启动 Remotion Studio。
   - 快速抽帧自检：`pnpm qa:stills` 生成多时间点 PNG 到 `out/qa/`，检查中文排版、安全区与对比度。

4. **成片渲染与后期合成**
   - 渲染竖屏（抖音/小红书 9:16 1080×1920）：`pnpm render:vertical`
   - 渲染横屏（B 站/YouTube 16:9 1920×1080）：`pnpm render:landscape`
   - 如需指定自定义 JSON 数据渲染：
     ```bash
     pnpm exec remotion render WeeklyRankingVertical out/week48.mp4 --props=data/weekly-latest.json
     ```
   - 如需用 FFmpeg 混入 BGM / 音效并做响度标准化，可直接调用系统已装好的 `ffmpeg`。

## 后续可扩展模块（对齐 @vibe-motion 生态）

- **网页真实录屏/截图**：环境已预装 `playwright` + `google-chrome`，后续可一键抓取 GitHub 仓库主页或 Demo 演示图嵌入卡片。
- **音效检索与混音**：可参考 `vibe-motion/sound` 接入 Freesound 音效（卡片切入 whoosh、数字跳动 pop 等）放入 `public/sfx/`。
- **创意编程单镜头**：可在 `src/compositions/` 中新增 Canvas 2D / Three.js / SVG 路径动画镜头。
