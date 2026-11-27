#!/usr/bin/env python3
"""
批量使用 Playwright 抓取 Top 10 GitHub 仓库的高清截图（用于 3D 空间画廊 & WebGL 鱼眼聚焦）
以及流畅 30fps 真实滚动录屏视频（用于 #10 -> #4 旋落实拍展示）。
"""
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

REPOS = [
    (10, "danielwh2/sprite-stacking"),
    (9, "Umbra9179/clipboard-history-manager-windows"),
    (8, "Indigo-0167/universal-game-mod-manager"),
    (7, "Avaneesh-Inamdar/Stream-Tube-Desktop"),
    (6, "qianyiai/KuroCat"),
    (5, "alesha-pro/llm.asm"),
    (4, "nexu-io/opengame"),
    (3, "os6/nospeaker"),
    (2, "EL4CTEO/fast-anything"),
    (1, "Marvisak/VIctory"),
]

ROOT = Path("/home/antigravity/ORG-ljy/github-video")
IMG_DIR = ROOT / "public/images/top10"
VID_DIR = ROOT / "public/videos/top10"
TMP_REC = Path("/tmp/pw_top10_rec")
IMG_DIR.mkdir(parents=True, exist_ok=True)
VID_DIR.mkdir(parents=True, exist_ok=True)
TMP_REC.mkdir(parents=True, exist_ok=True)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for rank, full_name in REPOS:
            url = f"https://github.com/{full_name}"
            img_out = IMG_DIR / f"rank-{rank}.png"
            vid_out = VID_DIR / f"rank-{rank}.mp4"
            need_vid = rank >= 4  # #10 -> #4 用真实滚动录屏，#3 -> #1 用 WebGL 鱼眼高清图 + 专项动画

            if img_out.exists() and (not need_vid or vid_out.exists()):
                print(f"[SKIP] #{rank} {full_name}")
                continue

            print(f"[CAPTURE] #{rank} {full_name} ...")
            ctx_kwargs = {
                "viewport": {"width": 1100, "height": 760},
                "ignore_https_errors": True,
            }
            if need_vid:
                ctx_kwargs["record_video_dir"] = str(TMP_REC)
                ctx_kwargs["record_video_size"] = {"width": 1100, "height": 760}
            else:
                ctx_kwargs["device_scale_factor"] = 2

            ctx = browser.new_context(**ctx_kwargs)
            page = ctx.new_page()
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(1400)
                page.screenshot(path=str(img_out), clip={"x": 0, "y": 40, "width": 1100, "height": 720})
                if need_vid:
                    for i in range(65):
                        page.evaluate(f"window.scrollTo({{top: {i * 11}, behavior: 'instant'}})")
                        page.wait_for_timeout(60)
                    page.wait_for_timeout(500)
            except Exception as exc:
                print(f"[WARN] #{rank} {full_name}: {exc}")
            video_path = page.video.path() if need_vid and page.video else None
            ctx.close()

            if need_vid and video_path and Path(video_path).exists():
                subprocess.check_call([
                    "ffmpeg", "-y", "-v", "error",
                    "-ss", "1.0", "-i", str(video_path),
                    "-t", "5.5", "-r", "30",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-an",
                    str(vid_out),
                ])
                print(f"  -> {img_out.name} & {vid_out.name} ({vid_out.stat().st_size // 1024} KB)")
            else:
                print(f"  -> {img_out.name} ({img_out.stat().st_size // 1024} KB)")
        browser.close()
    print("ALL TOP 10 MEDIA CAPTURED!")


if __name__ == "__main__":
    main()
