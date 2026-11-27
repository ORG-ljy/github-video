# github-video

个人视频制作底座（聚焦「GitHub 一周主要工具排行」与创意编程动效视频），参考抖音 **浙大猫学长** [`@vibe-motion`](https://github.com/vibe-motion) 开源生态（`create-vibe-motion`、`remotion-starter`、`auto-motion`、`sound`）的工程架构与工作流搭建。

## 技术栈与已安装工具

- **视频动画引擎**：Node.js 22 + TypeScript + Remotion 4 + Tailwind CSS v4 + Zod + Lucide Icons
- **音视频后期**：FFmpeg / FFprobe
- **中文配音与字幕**：Python 3.12 + `edge-tts`（一键生成 MP3 + SRT + 帧级 JSON 字幕）
- **数据抓取与素材**：`gh` CLI / GitHub API、`httpx`、Playwright + Google Chrome、Noto Sans CJK 中文字体

## 目录结构（三层架构）

```text
├── src/
│   ├── kit/                 # L1 共享引擎层：主题 token、确定性动效工具、通用组件
│   ├── compositions/        # L2 出片编排层：WeeklyRanking（支持 9:16 竖屏 & 16:9 横屏）
│   ├── schema/              # Zod 数据校验 Schema
│   ├── Root.tsx             # Remotion Composition 注册与动态时长计算
│   └── index.ts
├── data/                    # L3 榜单数据 JSON（如 weekly-sample.json）
├── public/                  # 静态资源（audio/ 配音、sfx/ 音效、images/ 截图）
├── scripts/
│   ├── fetch-github-weekly.mjs  # 抓取本周 GitHub 热门项目
│   ├── generate-tts.py          # 中文配音 + SRT/JSON 字幕生成
│   └── qa-stills.mjs            # 批量静帧 QA 抽帧
└── docs/
    ├── HARD_RULES.md        # Remotion 确定性渲染硬规则
    └── WORKFLOW.md          # 端到端出片流程指南
```

## 常用命令

```bash
# 1. 类型检查
pnpm typecheck

# 2. 抓取本周 GitHub 热门项目到 data/weekly-latest.json
pnpm fetch:weekly

# 3. 生成中文配音与字幕
python3 scripts/generate-tts.py --text "你好，欢迎收看本周 GitHub 热门工具排行" --name demo

# 4. 抽帧静帧 QA（输出到 out/qa/）
pnpm qa:stills

# 5. 渲染竖屏（9:16 抖音/小红书）或横屏（16:9 B站）成片
pnpm render:vertical
pnpm render:landscape

# 6. 启动 Remotion Studio 可视化预览
pnpm dev
```
