# 每周 GitHub 热榜短视频标准作业范式（WEEKLY SOP v2.0）

> 本范式沉淀自 **FILE.001（第 1 期）** 全流程实战打磨成果。后续第 2 期、第 3 期 …… 每周更新严格按以下 **6 个标准化阶段 + 硬门禁** 执行，确保**质量不波动、音画零翻车、30 分钟内完成全套交付**。

---

## 范式总览（单期标准交付物）

每期编号递增（`ep02` / `FILE.002` / `第 02 期`），最终全部归档在 `releases/epXX/`：

| 交付文件 | 规格要求 | 自动生成脚本 |
|---|---|---|
| `releases/epXX/epXX-github-weekly-1080x1920.mp4` | `1080×1920` / 30fps / 48kHz 立体声 / 80–105s / `clips=0` | Remotion 两段渲染 + FFmpeg 合流 |
| `releases/epXX/cover-epXX-3x4.png` | 严格 **`1080×1440`（3:4）** 抖音竖版封面 | `scripts/render-covers.py` |
| `releases/epXX/cover-epXX-4x3.png` | 严格 **`1440×1080`（4:3）** 抖音横版封面 | `scripts/render-covers.py` |
| `releases/epXX/PUBLISH_COPY.md` | 3 个备选标题（**严格 ≤30 字**）+ 简介 + 话题 + 置顶引流话术 | `scripts/render-covers.py` |

---

## 阶段 1：抓榜与 3 强选题过滤（宁缺毋滥，绝不硬凑 10 个）

1. **抓取本周 GitHub Trending / 飙升榜 Top 25**：
   ```bash
   node scripts/fetch-github-weekly.mjs
   ```
2. **严格按 4 条爆款筛子选出 Top 3（倒序排列：#03 → #02 → #01）**：
   - **反常识/奇观度**：一句话就能让普通人停下来（例：拔掉音箱触控板唱歌、PC 强行跑 GTA 6）。
   - **视觉可呈现度**：优先选 README 自带真实 GIF/WebP/MP4 实机演示的项目；次选能用直观动画讲清原理的硬核项目。**淘汰纯代码库、纯命令行无视觉演示的项目。**
   - **受众情绪价值**：3 个项目最好覆盖「趣味黑科技 + 桌面/AI 实用效率 + 圈内重磅炸弹（榜首）」，情绪逐级推高。
   - **事实核查**：核实真实仓库名 `owner/repo`、本周新增星标或总星标、开源协议与核心卖点（禁止编造数据）。
3. **提取真实 Demo 素材**：
   - 把 README 里的 GIF / WebP 动画下载到 `public/demos/epXX/`，统一用 `ffmpeg` 转成 30fps H.264 MP4（Remotion `<OffthreadVideo>` 零卡顿）。

---

## 阶段 2：编写本期配置 `data/episodes/epXX.json`（5 幕口播范式）

复制 [`data/episodes/TEMPLATE.json`](../data/episodes/TEMPLATE.json) 为 `data/episodes/epXX.json`。

### 固定 5 幕结构（全片 85–100 秒黄金完播时长）
| 幕次 | 建议时长 | 职责与节奏要求 |
|---|---|---|
| **Act 0 · 黄金开场（3 秒抓人）** | `10–13s` | 报期号/本周热榜 → 一句话高速预告 3 个反常识看点 → 亮出「全部免费开源，档案开启！」 |
| **Act 1 · #03 号项目** | `20–24s` | 设悬念案名 → 抛反常识奇观 → 一句大白话拆解原理 → 亮项目名与星标 |
| **Act 2 · #02 号项目** | `22–26s` | 痛点切入 → 真机 Demo 展示 + 反转彩蛋 → 硬件/性能细节拉满 → 亮项目名 |
| **Act 3 · #01 全球榜首** | `22–25s` | 亮本周星标暴涨数据 → 行业矛盾冲突 → 硬核技术破局点 → 亮榜首项目名 |
| **Act 4 · 收尾与互动转化** | `8–11s` | 提示三项清单在屏幕可截图收藏 → 引导关注追更下周 GitHub 开源档案 → 招牌口号「结案！」 |

### 口播文案写作铁律（防 TTS 翻车）
- **保留原生 `GitHub` 拼写**：绝对不要写成 `get hub`、`Git Hub`、`Github`（实测原生 `GitHub` 发音最自然）。
- **生僻缩写与数字口语化**：例如 `GTA 6` 在口播轨写成 `G T A 六`（画面字幕仍显示 `GTA 6`），`3D` 写成 `3 D`，`2.4MB` 写成 `两兆多`；高频易错词统一维护在 [`data/pronunciation-dict.json`](../data/pronunciation-dict.json)。
- **绝不拆碎短句**：每一幕就是一段自然连贯的完整中文段落，靠标点自然呼吸，不要人为切碎成十几条 2 秒小音频。

---

## 阶段 3：一键合成 5 幕语音 + ASR 逐字门禁 + 48kHz 母带混音

运行参数化脚本：
```bash
python3 scripts/build-episode-audio.py data/episodes/epXX.json
```

脚本内置并强制校验以下全部硬铁律（详见 [`docs/HARD_RULES.md`](./HARD_RULES.md)）：
1. **声纹锁定**：`ljy-hook-clean`（`speech:your-voice-name:xxxx:yyyy`），不加情绪指令。
2. **防吞音与防爆音参数**：`speed=1.0`（严禁加速）、`gain=-6.0`（防 16-bit 回绕爆音）、拉取无损 `wav`。
3. **禁用 `silenceremove`**：只加首尾 `10ms` 淡入淡出，保持真人自然呼吸节奏。
4. **ASR 门禁（`FunAudioLLM/SenseVoiceSmall`）**：每生成一幕自动回转文字并与原稿核对；发现吞字/分音错误立即单幕重生成，不通过不进渲染。
5. **48kHz 立体声零爆音母带**：
   - 人声单次 `loudnorm=I=-16:TP=-2.0:LRA=11` + `aresample=48000` + `alimiter=limit=-1.5dB:level=false`；
   - 混入常驻 112 BPM 原创侦探酸爵士 BGM（[`public/sfx/detective-acid-jazz-112-full.wav`](../public/sfx/detective-acid-jazz-112-full.wav)，`-23dB`）；
   - 波形断言：`clips == 0`、`wrap_jumps == 0`、`sample_rate == 48000`；
   - 自动输出各幕精确帧时间戳 `public/audio/epXX/timeline.json` 供 Remotion 零误差对齐！

---

## 阶段 4：Remotion 分段渲染 + 静帧 QA 验收

1. **先静帧 QA（必做）**：渲染开场、3 个项目核心卡、结尾清单至少 5 张静帧，肉眼检查：
   - 期号是否为本期 `FILE.00X` / `第 0X 期`（杜绝残留上期编号！）；
   - 字幕是否单行 ≤14 字、无英文词中间撕裂、未与满屏大字重叠；
   - 是否完全避开抖音顶部/右侧/底部遮挡区。
2. **两段无声渲染 + FFmpeg 零损耗合流**（彻底避开单次渲染 10 分钟超时）：
   ```bash
   # 示例：总帧数 N，中点 M = N // 2
   npx remotion render src/index.ts WeeklyDetectiveFull out/part1.mp4 --frames=0-M --muted
   npx remotion render src/index.ts WeeklyDetectiveFull out/part2.mp4 --frames=(M+1)-(N-1) --muted
   # 无损拼接 + 混入 48kHz 立体声母带
   ffmpeg -y -f concat -safe 0 -i out/concat.txt -i public/audio/epXX/master-48k.wav \
     -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
     releases/epXX/epXX-github-weekly-1080x1920.mp4
   ```
3. **成片音画终检**：用 `ffprobe` + Python 检查成片时长、音画同步误差 `< 0.1s`、`clips == 0`，并导出 ≤2 MB 预览 HTML 供发片前试看听音。

---

## 阶段 5：一键生成 3:4 & 4:3 双封面 + ≤30 字抖音文案包

运行参数化脚本：
```bash
python3 scripts/render-covers.py data/episodes/epXX.json
```
自动完成：
1. 生成 **`releases/epXX/cover-epXX-3x4.png`**（严格 `1080×1440`）与 **`releases/epXX/cover-epXX-4x3.png`**（严格 `1440×1080`）；
2. 自动人工/AI 视觉检查两张 PNG，确认无文字溢出、无遮挡、无错别字；
3. 自动生成 **`releases/epXX/PUBLISH_COPY.md`**，内置硬断言检查：**所有备选标题严格 ≤ 30 字**（每个英文字母与标点均按 1 字计）。

---

## 阶段 6：Git 推送与本地一键同步发片

1. 推送成品包到 GitHub `main`：
   ```bash
   git add data/episodes/epXX.json releases/epXX/
   git commit -m "release(epXX): FILE.0XX GitHub weekly episode, 3:4 & 4:3 covers, and publish copy"
   git push origin main
   ```
2. 本地 Windows PowerShell 一行拉取（发片目录直接就绪）：
   ```powershell
   cd "E:\AI-工作目录\零散任务\灵枢AI\2.github-video\github-video"; git pull origin main
   ```
3. **抖音发布标准动作**：
   - 上传 `releases/epXX/epXX-github-weekly-1080x1920.mp4`；
   - 勾选加入合集 **「GitHub开源神作档案」**；
   - 封面分别上传 `cover-epXX-3x4.png`（竖版 3:4）与 `cover-epXX-4x3.png`（横版 4:3）；
   - 复制 `PUBLISH_COPY.md` 中的 ≤30 字标题与简介发布；
   - 发布后 **1 分钟内** 自评置顶「三个项目完整仓库名 + 互动提问」。
