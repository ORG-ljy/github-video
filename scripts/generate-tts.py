#!/usr/bin/env python3
"""
使用 edge-tts 生成中文配音 MP3、SRT 字幕与 Remotion 可直接读取的 captions JSON，
并用 ffprobe 测量音频精确时长。

用法示例：
  python3 scripts/generate-tts.py \
    --text "这周 GitHub 又出了几个超好用的开源工具，30 秒带你看 Top 3！" \
    --voice zh-CN-YunxiNeural \
    --out-dir public/audio \
    --name weekly-demo
"""

import argparse
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts


def parse_srt_time_to_ms(ts: str) -> int:
    hms, ms = ts.strip().split(",")
    h, m, s = [int(x) for x in hms.split(":")]
    return ((h * 3600 + m * 60 + s) * 1000) + int(ms)


def srt_to_captions_json(srt_path: Path) -> list[dict]:
    cues = []
    blocks = srt_path.read_text(encoding="utf-8").strip().split("\n\n")
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(lines) >= 3 and "-->" in lines[1]:
            start_str, end_str = lines[1].split("-->")
            cues.append(
                {
                    "startMs": parse_srt_time_to_ms(start_str),
                    "endMs": parse_srt_time_to_ms(end_str),
                    "text": " ".join(lines[2:]),
                }
            )
    return cues


def probe_duration_sec(audio_path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        text=True,
    ).strip()
    return float(out)


async def synthesize(text: str, voice: str, rate: str, mp3_path: Path, srt_path: Path):
    communicate = edge_tts.Communicate(text, voice=voice, rate=rate)
    submaker = edge_tts.SubMaker()
    with mp3_path.open("wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                submaker.feed(chunk)
    srt_path.write_text(submaker.get_srt(), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="生成中文配音 MP3 + SRT + captions JSON")
    parser.add_argument("--text", help="直接传入口播文案")
    parser.add_argument("--text-file", help="从文本文件读取口播文案")
    parser.add_argument("--voice", default="zh-CN-YunxiNeural", help="edge-tts 音色")
    parser.add_argument("--rate", default="+5%", help="语速调节，如 +0%, +10%")
    parser.add_argument("--out-dir", default="public/audio", help="输出目录")
    parser.add_argument("--name", default="narration", help="输出文件名前缀")
    args = parser.parse_args()

    if args.text_file:
        text = Path(args.text_file).read_text(encoding="utf-8").strip()
    elif args.text:
        text = args.text.strip()
    else:
        raise SystemExit("请通过 --text 或 --text-file 提供口播文案")

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    mp3_path = out_dir / f"{args.name}.mp3"
    srt_path = out_dir / f"{args.name}.srt"
    json_path = out_dir / f"{args.name}.captions.json"

    asyncio.run(synthesize(text, args.voice, args.rate, mp3_path, srt_path))
    captions = srt_to_captions_json(srt_path)
    json_path.write_text(
        json.dumps(captions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    duration = probe_duration_sec(mp3_path)

    print(f"音频: {mp3_path} ({duration:.2f}s)")
    print(f"SRT : {srt_path}")
    print(f"JSON: {json_path} ({len(captions)} 条字幕)")


if __name__ == "__main__":
    main()
