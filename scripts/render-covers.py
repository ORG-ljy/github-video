#!/usr/bin/env python3
"""
参数化抖音双封面（3:4 1080x1440 & 4:3 1440x1080）+ PUBLISH_COPY.md 一键生成器
用法:
  python3 scripts/render-covers.py data/episodes/ep02.json
  python3 scripts/render-covers.py data/episodes/ep01.json --dry-run
"""
import argparse
import base64
import html
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent


def b64_img(path: Path) -> str:
    ext = path.suffix.lower().lstrip(".")
    mime = "jpeg" if ext in ("jpg", "jpeg") else ext
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/{mime};base64,{data}"


def validate_config(cfg: dict) -> None:
    for item in cfg["publish"]["titles"]:
        t = item["text"]
        if len(t) > 30:
            raise ValueError(
                f"抖音标题超限（严格 <=30 字）: [{len(t)}字] {t}"
            )
    if len(cfg["projects"]) != 3:
        raise ValueError(f"每期必须精选 3 个项目，当前为 {len(cfg['projects'])} 个")


def build_3x4_html(cfg: dict, hero_uri: str) -> str:
    c = cfg["cover"]
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px; height: 1440px; overflow: hidden;
    background: #080c16;
    font-family: "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Zen Hei", "PingFang SC", sans-serif;
    position: relative;
  }}
  .grid {{
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 48px 48px;
  }}
  .hero {{
    position: absolute;
    left: 50%; top: 53%;
    transform: translate(-50%, -44%);
    width: 1040px; height: 1180px;
    object-fit: cover; object-position: center 45%;
    opacity: 0.96;
  }}
  .shade {{
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(8,12,22,0.84) 0%, rgba(8,12,22,0.12) 32%, rgba(8,12,22,0.05) 70%, rgba(8,12,22,0.92) 100%);
  }}
  .wrap {{
    position: relative; z-index: 2;
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-between;
    padding: 58px 52px 62px;
  }}
  .top {{ display: flex; flex-direction: column; align-items: center; gap: 26px; }}
  .pill {{
    background: #e12d39; color: #fff;
    font-size: 34px; font-weight: 900; letter-spacing: 5px;
    padding: 14px 36px;
  }}
  .title {{
    text-align: center; line-height: 1.06;
    filter: drop-shadow(0 8px 0 #05070d) drop-shadow(0 0 28px rgba(0,0,0,0.9));
  }}
  .l1 {{ display: block; color: #fff; font-size: 132px; font-weight: 900; letter-spacing: 4px; }}
  .l2 {{ display: block; color: #ffd147; font-size: 132px; font-weight: 900; letter-spacing: 4px; }}
  .bottom {{ display: flex; flex-direction: column; align-items: center; gap: 24px; width: 100%; }}
  .strip {{
    background: #f5f3ea; color: #0b0f17;
    border: 4px solid #0b0f17;
    box-shadow: 10px 10px 0 #e12d39;
    padding: 22px 42px;
    font-size: 46px; font-weight: 900; letter-spacing: 2px;
    white-space: nowrap; max-width: 96%; text-align: center;
  }}
  .badges {{ display: flex; gap: 22px; }}
  .b-red {{
    background: #e12d39; color: #fff;
    font-size: 34px; font-weight: 800; padding: 14px 30px; letter-spacing: 2px;
  }}
  .b-gold {{
    background: rgba(8,12,22,0.92); color: #ffd147;
    border: 3px solid #ffd147;
    font-size: 34px; font-weight: 800; padding: 12px 30px; letter-spacing: 2px;
  }}
</style>
</head>
<body>
  <div class="grid"></div>
  <img class="hero" src="{hero_uri}" />
  <div class="shade"></div>
  <div class="wrap">
    <div class="top">
      <div class="pill">{html.escape(c['top_tag_3x4'])}</div>
      <div class="title">
        <span class="l1">{html.escape(c['title_line1'])}</span>
        <span class="l2">{html.escape(c['title_line2'])}</span>
      </div>
    </div>
    <div class="bottom">
      <div class="strip">{html.escape(c['strip_3x4'])}</div>
      <div class="badges">
        <span class="b-red">{html.escape(c['badge_left_3x4'])}</span>
        <span class="b-gold">{html.escape(c['badge_right_3x4'])}</span>
      </div>
    </div>
  </div>
</body>
</html>"""


def build_4x3_html(cfg: dict, hero_uri: str) -> str:
    c = cfg["cover"]
    projects_sorted = sorted(cfg["projects"], key=lambda x: x["rank"])
    cards = []
    for p in projects_sorted:
        is_top1 = p["rank"] == 1
        card_cls = "card top1" if is_top1 else "card"
        right_html = f'<div class="star-badge {"gold" if is_top1 else "red"}">{html.escape(p["stars_badge"])}</div>'
        if p.get("thumb_path"):
            tp = REPO_ROOT / p["thumb_path"]
            if tp.exists():
                right_html = f'<img class="thumb" src="{b64_img(tp)}" />'
        cards.append(f"""
        <div class="{card_cls}">
          <div class="c-left">
            <div class="c-meta">TOP #{p['rank']:02d} · {html.escape(p['repo'])}</div>
            <div class="c-head">{html.escape(p['headline_4x3'])}</div>
          </div>
          {right_html}
        </div>""")

    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1440px; height: 1080px; overflow: hidden;
    background: #080c16;
    font-family: "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Zen Hei", "PingFang SC", sans-serif;
    position: relative;
  }}
  .grid {{
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
  }}
  .hero {{
    position: absolute; left: -30px; top: 0;
    width: 630px; height: 1080px;
    object-fit: cover; object-position: center 45%;
    mask-image: linear-gradient(90deg, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%);
    -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%);
  }}
  .keyhole-tag {{
    position: absolute; left: 42px; top: 44px; z-index: 3;
    border: 3px solid #e12d39; background: rgba(8,12,22,0.88);
    padding: 12px 22px; display: flex; flex-direction: column; gap: 4px;
  }}
  .kt1 {{ color: #e12d39; font-family: monospace; font-size: 30px; font-weight: 900; letter-spacing: 3px; }}
  .kt2 {{ color: #cbd5e1; font-family: monospace; font-size: 16px; letter-spacing: 2px; }}

  .right {{
    position: absolute; left: 588px; right: 52px; top: 54px; bottom: 52px;
    z-index: 3; display: flex; flex-direction: column; justify-content: space-between;
  }}
  .r-top {{ display: flex; flex-direction: column; align-items: flex-start; gap: 22px; }}
  .pill {{
    background: #e12d39; color: #fff;
    font-size: 30px; font-weight: 900; letter-spacing: 5px;
    padding: 10px 26px;
  }}
  .big-title {{
    font-size: 94px; font-weight: 900; line-height: 1.05; white-space: nowrap;
    filter: drop-shadow(0 6px 0 #05070d);
  }}
  .big-title .w {{ color: #fff; }}
  .big-title .y {{ color: #ffd147; }}

  .cards {{ display: flex; flex-direction: column; gap: 22px; }}
  .card {{
    display: flex; align-items: center; justify-content: space-between;
    background: #f5f3ea; color: #0b0f17;
    border: 4px solid #0b0f17;
    box-shadow: 9px 9px 0 #e12d39;
    padding: 20px 28px;
  }}
  .card.top1 {{
    background: #0d1628; color: #fff;
    border: 4px solid #ffd147;
    box-shadow: 9px 9px 0 #e12d39;
  }}
  .c-meta {{
    font-family: monospace; font-size: 22px; font-weight: 800;
    color: #e12d39; margin-bottom: 8px; letter-spacing: 1px;
  }}
  .card.top1 .c-meta {{ color: #ffd147; }}
  .c-head {{ font-size: 40px; font-weight: 900; letter-spacing: 1px; }}
  .star-badge {{
    font-family: monospace; font-size: 28px; font-weight: 900;
    padding: 12px 20px; border: 3px solid #0b0f17; white-space: nowrap;
  }}
  .star-badge.gold {{ background: #ffd147; color: #0b0f17; }}
  .star-badge.red {{ background: #e12d39; color: #fff; }}
  .thumb {{ width: 88px; height: 88px; object-fit: cover; border-radius: 6px; border: 2px solid #0b0f17; }}

  .r-foot {{ display: flex; justify-content: space-between; align-items: center; }}
  .foot-tag {{
    background: #ffd147; color: #0b0f17;
    font-size: 32px; font-weight: 900;
    padding: 14px 28px; box-shadow: 7px 7px 0 #e12d39;
  }}
  .case-num {{ font-family: monospace; color: #94a3b8; font-size: 24px; letter-spacing: 3px; }}
</style>
</head>
<body>
  <div class="grid"></div>
  <img class="hero" src="{hero_uri}" />
  <div class="keyhole-tag">
    <span class="kt1">{html.escape(cfg['file_code'])}</span>
    <span class="kt2">GITHUB WEEKLY</span>
  </div>
  <div class="right">
    <div class="r-top">
      <div class="pill">{html.escape(c['top_tag_4x3'])}</div>
      <div class="big-title"><span class="w">{html.escape(c['title_line1'])}</span><span class="y">{html.escape(c['title_line2'])}</span></div>
    </div>
    <div class="cards">
      {''.join(cards)}
    </div>
    <div class="r-foot">
      <div class="foot-tag">{html.escape(c['footer_4x3'])}</div>
      <div class="case-num">CASE // {cfg['episode_num']:03d}</div>
    </div>
  </div>
</body>
</html>"""


def write_publish_copy(cfg: dict, out_dir: Path) -> Path:
    slug = cfg["episode_slug"]
    titles_md = []
    for idx, t in enumerate(cfg["publish"]["titles"], 1):
        txt = t["text"]
        titles_md.append(f"{idx}. **{t['label']}（{len(txt)}字）**：\n   `{txt}`")

    desc_lines = [
        f"档案编号 {cfg['file_code']}｜GitHub 飙升榜{cfg['cn_label']}，本周三大开源神作全部免费开源，建议先收藏防走丢👇",
        "",
        "🔍 本期清单：",
    ]
    for p in sorted(cfg["projects"], key=lambda x: x["rank"], reverse=True):
        desc_lines.append(f"• #{p['rank']:02d} {p['repo']}（{p['stars_text']}）：{p['one_liner']}")
    desc_lines += [
        "",
        "📌 下期想看哪类开源/AI神器，直接扣在评论区！",
        "",
        cfg["publish"]["hashtags"],
    ]

    pinned_lines = ["三个项目的 GitHub 仓库名都在这里，直接去搜就能免费下载👇"]
    nums = {1: "1️⃣", 2: "2️⃣", 3: "3️⃣"}
    for p in sorted(cfg["projects"], key=lambda x: x["rank"]):
        pinned_lines.append(f"{nums[p['rank']]} {p['repo']}（{p['pinned_note']}）")
    pinned_lines.append(cfg["publish"]["pinned_cta"])

    content = f"""# {cfg['file_code']}（{cfg['cn_label']}）· GitHub 飙升榜三大开源神作 发布资料包

## 包含文件（全部位于 `releases/{slug}/`）
- `{slug}-github-weekly-1080x1920.mp4`：1080×1920 竖屏高清母版（30fps / 48kHz 立体声零爆音）
- `cover-{slug}-3x4.png`：1080×1440 竖版 3:4 封面（抖音个人主页 / 小红书 / 视频号标准竖版封面）
- `cover-{slug}-4x3.png`：1440×1080 横版 4:3 封面（抖音横版封面 / 图文横封）

---

## 一、推荐主题 / 标题（3 选 1，均严格 ≤30 字）
{chr(10).join(titles_md)}

---

## 二、视频描述文案（直接复制）
```text
{chr(10).join(desc_lines)}
```

---

## 三、评论区置顶引流话术（发后 1 分钟内自评置顶）
```text
{chr(10).join(pinned_lines)}
```
"""
    md_path = out_dir / "PUBLISH_COPY.md"
    md_path.write_text(content, encoding="utf-8")
    return md_path


def main() -> None:
    parser = argparse.ArgumentParser(description="生成本期 3:4 & 4:3 抖音封面及合规发布文案")
    parser.add_argument("config", help="期数配置 JSON 路径，例如 data/episodes/ep02.json")
    parser.add_argument("--dry-run", action="store_true", help="仅校验 JSON 与标题字数，不写文件")
    args = parser.parse_args()

    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = REPO_ROOT / cfg_path
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    validate_config(cfg)

    print(f"[OK] 配置校验通过: {cfg['file_code']} ({cfg['episode_slug']})")
    for t in cfg["publish"]["titles"]:
        print(f"  - 标题 [{len(t['text'])}/30字]: {t['text']}")
    if args.dry_run:
        return

    slug = cfg["episode_slug"]
    out_dir = REPO_ROOT / "releases" / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    hero_uri = b64_img(REPO_ROOT / "public/images/ip/remix-a-hero.jpg")
    p_3x4 = out_dir / f"cover-{slug}-3x4.png"
    p_4x3 = out_dir / f"cover-{slug}-4x3.png"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1440}, device_scale_factor=1)
        page.set_content(build_3x4_html(cfg, hero_uri), wait_until="load")
        page.screenshot(path=str(p_3x4), type="png")

        page.set_viewport_size({"width": 1440, "height": 1080})
        page.set_content(build_4x3_html(cfg, hero_uri), wait_until="load")
        page.screenshot(path=str(p_4x3), type="png")
        browser.close()

    md_path = write_publish_copy(cfg, out_dir)
    print(f"[DONE] 3:4 封面: {p_3x4} ({p_3x4.stat().st_size/1024:.1f} KB)")
    print(f"[DONE] 4:3 封面: {p_4x3} ({p_4x3.stat().st_size/1024:.1f} KB)")
    print(f"[DONE] 文案包:  {md_path}")


if __name__ == "__main__":
    main()
