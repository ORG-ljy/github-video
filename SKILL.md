---
name: github-weekly-paradigm
description: 每周 GitHub 热榜「像素侦探档案（FILE.00X）」短视频标准化生产范式（公私双仓分离：开源引擎留公开仓，品牌资产与每期成品全进私有仓 ORG-ljy/github-video-private）。
---
# GitHub 每周热榜「像素侦探档案」标准生产范式

> 完整作业流程见 [`docs/WEEKLY_SOP.md`](./docs/WEEKLY_SOP.md)，品牌与视觉系统见 [`docs/DESIGN.md`](./docs/DESIGN.md)，音视频防爆音底层铁律见 [`docs/HARD_RULES.md`](./docs/HARD_RULES.md)。

## 公私双仓红线（必须严格执行）
- **公开代码仓 `ORG-ljy/github-video`（Public）**：只存代码、Remotion 模板、自动化脚本、SOP 文档、`TEMPLATE.json`；**严禁提交**成片 MP4、封面 PNG、品牌头像、IP 原图、配音文件与私人声纹 URI（统一经 `.env` 注入）。
- **私有交付仓 `ORG-ljy/github-video-private`（Private）**：专门存放个人品牌资产（`brand/`）与每期 4 件套成品（`episodes/epXX/`）：
  1. `epXX-github-weekly-1080x1920.mp4`（`1080×1920` / 30fps / 48kHz / 80–105s / `clips=0`）
  2. `cover-epXX-3x4.png`（严格 **`1080×1440`** 抖音竖版 3:4 封面）
  3. `cover-epXX-4x3.png`（严格 **`1440×1080`** 抖音横版 4:3 封面）
  4. `PUBLISH_COPY.md`（标题严格 **≤30 字** + 简介 + 话题 + 置顶引流评论）

## 6 步标准化流水线（严禁跳步）
1. **抓榜选 3 强**：跑 `node scripts/fetch-github-weekly.mjs`，挑 3 个高视觉反差/有真 Demo 的项目（倒序 #03 → #02 → #01），绝不硬凑 10 个，绝不拿白底代码列表当主画面。
2. **填本期配置**：复制 `data/episodes/TEMPLATE.json` 到私有仓 `../github-video-private/episodes/epXX/epXX.json`，编写 5 幕自然整段口播（保留原生 `GitHub` 拼写，缩写/数字口语化）。
3. **5 幕整段配音 + ASR 门禁**：跑 `python3 scripts/build-episode-audio.py ../github-video-private/episodes/epXX/epXX.json`（强制 `.env` 声纹、`speed=1.0`、`gain=-6.0`、无损 `wav`、**禁用 `silenceremove`**、`SenseVoiceSmall` ASR 逐字校验、单次 `loudnorm` + `aresample=48000`、`clips=0`）。
4. **Remotion 两段渲染 + 静帧 QA**：先出关键帧核验 `FILE.00X` 期号/字幕（单行 ≤14 字、**禁止英文单词中间断行**、与大字互斥），再分两段 `--muted` 渲染并用 FFmpeg `-c:v copy` 无损拼接合流 48kHz 音频输出至私有仓 `../github-video-private/episodes/epXX/`。
5. **一键出双封面与文案**：跑 `python3 scripts/render-covers.py ../github-video-private/episodes/epXX/epXX.json`，默认直出私有仓 `3:4` + `4:3` 封面与 `≤30字` 校验通过的 `PUBLISH_COPY.md`，并肉眼核验零裁切/零重叠。
6. **交付与私有仓同步**：生成 ≤2MB 内嵌预览 HTML 给用户确认，**仅推送成品到私有仓 `ORG-ljy/github-video-private`**，给出本地一键拉取命令：
   `cd "E:\AI-工作目录\零散任务\灵枢AI\2.github-video\github-video-private"; git pull origin main`
