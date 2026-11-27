---
name: github-weekly-paradigm
description: 每周 GitHub 热榜「像素侦探档案（FILE.00X）」短视频标准化生产范式。覆盖抓榜筛选 Top 3、5 幕连贯口播、ljy-hook-clean + SenseVoiceSmall ASR 零爆音配音、Remotion 分段渲染、3:4(1080x1440) & 4:3(1440x1080) 双封面、≤30字抖音发布文案与本地仓库同步。
---
# GitHub 每周热榜「像素侦探档案」标准生产范式

> 完整作业流程见 [`docs/WEEKLY_SOP.md`](./docs/WEEKLY_SOP.md)，品牌与视觉系统见 [`docs/DESIGN.md`](./docs/DESIGN.md)，音视频防爆音底层铁律见 [`docs/HARD_RULES.md`](./docs/HARD_RULES.md)。

## 品牌与画幅铁律（全系列永久锁定）
- **连载编号**：`FILE.001` / `第 01 期` → `FILE.002` / `第 02 期` 递增，严禁残留上期编号。
- **专属原创 IP**：Remix A 像素侦探少年（[`public/images/ip/remix-a-hero.jpg`](./public/images/ip/remix-a-hero.jpg)），配色锁定午夜蓝黑 `#080C16` + 档案朱红 `#E12D39` + 闪电金 `#FFD147` + 证物白 `#F5F3EA`。
- **常驻原创 BGM**：[`public/sfx/detective-acid-jazz-112-full.wav`](./public/sfx/detective-acid-jazz-112-full.wav)（112 BPM 侦探酸爵士，零版权风险）。
- **每期 4 件套标准交付（全部位于 `releases/epXX/`）**：
  1. `epXX-github-weekly-1080x1920.mp4`（`1080×1920` / 30fps / 48kHz / 80–105s / `clips=0`）
  2. `cover-epXX-3x4.png`（严格 **`1080×1440`** 抖音竖版 3:4 封面）
  3. `cover-epXX-4x3.png`（严格 **`1440×1080`** 抖音横版 4:3 封面）
  4. `PUBLISH_COPY.md`（标题严格 **≤30 字** + 简介 + 话题 + 置顶引流评论）

## 6 步标准化流水线（严禁跳步）
1. **抓榜选 3 强**：跑 `node scripts/fetch-github-weekly.mjs`，挑 3 个高视觉反差/有真 Demo 的项目（倒序 #03 → #02 → #01），绝不硬凑 10 个，绝不拿白底代码列表当主画面。
2. **填本期配置**：复制 `data/episodes/TEMPLATE.json` → `data/episodes/epXX.json`，编写 5 幕自然整段口播（保留原生 `GitHub` 拼写，缩写/数字口语化）。
3. **5 幕整段配音 + ASR 门禁**：跑 `python3 scripts/build-episode-audio.py data/episodes/epXX.json`（强制 `ljy-hook-clean`、`speed=1.0`、`gain=-6.0`、无损 `wav`、**禁用 `silenceremove`**、`SenseVoiceSmall` ASR 逐字校验、单次 `loudnorm` + `aresample=48000`、`clips=0`）。
4. **Remotion 两段渲染 + 静帧 QA**：先出关键帧核验期号/字幕（单行 ≤14 字、**禁止英文单词中间断行**、与大字互斥），再分两段 `--muted` 渲染并用 FFmpeg `-c:v copy` 无损拼接合流 48kHz 音频。
5. **一键出双封面与文案**：跑 `python3 scripts/render-covers.py data/episodes/epXX.json`，自动输出 `3:4` + `4:3` 封面与 `≤30字` 校验通过的 `PUBLISH_COPY.md`，并肉眼核验封面零裁切/零重叠。
6. **交付与本地同步**：生成 ≤2MB 内嵌预览 HTML 给用户确认，推送 `origin main`，给出本地一键拉取命令：
   `cd "E:\AI-工作目录\零散任务\灵枢AI\2.github-video\github-video"; git pull origin main`
