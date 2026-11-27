#!/usr/bin/env python3
"""
硅基流动（SiliconFlow）CosyVoice2-0.5B 生产级配音合成与音频母带流水线。

核心优化：
1. 全片锁定单一主声纹（默认 ljy-hook-clean），消除多声纹切换带来的环境/话筒割裂感；
2. 双轨文本（展示字幕保持原样，TTS 口播自动过 data/pronunciation-dict.json 发音词典）；
3. FFmpeg 单次防炸麦母带链（静音裁切 + 15ms 软淡入淡出 + 统一气口 + highpass + 柔和压缩 makeup=1 + loudnorm TP=-2.0 + alimiter）；
4. 自动输出 MP3、SRT 字幕、Remotion captions JSON 与分段 timeline JSON，可选混入轻 BGM。

用法示例：
  # 1. 查看账号云端已上传的声纹
  python3 scripts/tts-siliconflow.py --list-voices

  # 2. 单段文本合成
  python3 scripts/tts-siliconflow.py --text "这周 GitHub 榜单前三名真的太狠了！" --name demo

  # 3. 多段脚本（如 Top 10 榜单）无缝拼接合成
  python3 scripts/tts-siliconflow.py --segments-json data/script-sample.json --name week48
"""

import argparse
import json
import os
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

DEFAULT_MODEL = "FunAudioLLM/CosyVoice2-0.5B"
DEFAULT_VOICE_URI = "speech:your-voice-name:xxxx:yyyy"
DEFAULT_BASE_URL = "https://api.siliconflow.cn/v1"
DEFAULT_DICT_PATH = Path(__file__).resolve().parent.parent / "data" / "pronunciation-dict.json"


def load_env(repo_root: Path) -> dict[str, str]:
    env = dict(os.environ)
    env_file = repo_root / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip())
    return env


def list_voices(api_key: str, base_url: str) -> None:
    req = urllib.request.Request(
        f"{base_url}/audio/voice/list",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    for item in data.get("result", []):
        print(f"- {item.get('customName')} | {item.get('model')} | {item.get('uri')}")


def load_pronunciation_dict(dict_path: Path) -> dict:
    if not dict_path.exists():
        return {"terms": {}, "acronyms": {}, "polyphones": {}}
    return json.loads(dict_path.read_text(encoding="utf-8"))


def normalize_for_tts(text: str, pdict: dict) -> str:
    """将展示文本转为更适合 CosyVoice2-0.5B 发音的口播文本（不修改原展示文本）。"""
    out = text

    # 1. 版本号口语化：v2.4 / v0.5.1 -> 2点4版本
    def _ver_repl(m: re.Match) -> str:
        ver = m.group(1).replace(".", "点")
        return f"{ver}版本"

    out = re.sub(r"\bv(\d+(?:\.\d+)+)\b", _ver_repl, out, flags=re.IGNORECASE)

    # 2. 专有名词（按长度降序，大小写不敏感匹配整词）
    terms = pdict.get("terms", {})
    for src in sorted(terms.keys(), key=len, reverse=True):
        dst = terms[src]
        pattern = r"(?<![A-Za-z0-9_])" + re.escape(src) + r"(?![A-Za-z0-9_])"
        out = re.sub(pattern, dst, out, flags=re.IGNORECASE)

    # 3. 纯大写技术缩写（区分大小写，避免误伤普通英文单词）
    acronyms = pdict.get("acronyms", {})
    for src in sorted(acronyms.keys(), key=len, reverse=True):
        dst = acronyms[src]
        pattern = r"(?<![A-Za-z0-9_])" + re.escape(src) + r"(?![A-Za-z0-9_])"
        out = re.sub(pattern, dst, out)

    # 4. 中文多音字短语替换
    polyphones = pdict.get("polyphones", {})
    for src in sorted(polyphones.keys(), key=len, reverse=True):
        out = out.replace(src, polyphones[src])

    return out


def synthesize_segment(
    api_key: str,
    base_url: str,
    model: str,
    voice_uri: str,
    text: str,
    out_audio: Path,
    speed: float = 1.0,
    gain: float = -6.0,
) -> None:
    """调用硅基流动 TTS 接口。必须默认设置 gain=-6.0，防止服务端 float->int16 溢出回绕爆音。"""
    payload = json.dumps(
        {
            "model": model,
            "input": text,
            "voice": voice_uri,
            "response_format": "wav",
            "sample_rate": 44100,
            "speed": speed,
            "gain": gain,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/audio/speech",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        out_audio.write_bytes(resp.read())


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


def trim_and_fade_segment(in_mp3: Path, out_wav: Path, fade_sec: float = 0.008) -> float:
    """裁切首尾死静音并加极短淡入淡出（阈值 -55dB，防止 -6dB 留空音频被误切轻辅音导致吞字）。"""
    tmp_wav = out_wav.with_suffix(".tmp.wav")
    trim_af = (
        "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-55dB,"
        "areverse,"
        "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-55dB,"
        "areverse,"
        "aformat=sample_rates=48000:channel_layouts=mono"
    )
    subprocess.check_call(
        ["ffmpeg", "-y", "-v", "error", "-i", str(in_mp3), "-af", trim_af, "-c:a", "pcm_s16le", str(tmp_wav)]
    )
    dur = probe_duration_sec(tmp_wav)
    fade_out_start = max(0.0, dur - fade_sec)
    fade_af = f"afade=t=in:st=0:d={fade_sec:.3f},afade=t=out:st={fade_out_start:.3f}:d={fade_sec:.3f}"
    subprocess.check_call(
        ["ffmpeg", "-y", "-v", "error", "-i", str(tmp_wav), "-af", fade_af, "-c:a", "pcm_s16le", str(out_wav)]
    )
    tmp_wav.unlink(missing_ok=True)
    return probe_duration_sec(out_wav)


def master_full_track(concat_wav: Path, out_mp3: Path, bgm_path: Path | None = None, bgm_db: float = -24.0) -> None:
    """整条音轨单次母带处理：高通 + 柔和压缩(makeup=1) + EBU R128 响度统一(TP=-2.0) + 峰值限制(-1.5dB)。"""
    master_af = (
        "highpass=f=90,"
        "acompressor=threshold=-18dB:ratio=2:attack=15:release=150:makeup=1,"
        "loudnorm=I=-16:TP=-2.0:LRA=11,"
        "aresample=48000,aformat=sample_rates=48000:channel_layouts=mono,"
        "alimiter=limit=-1.5dB:level=false"
    )
    if bgm_path is None:
        subprocess.check_call(
            [
                "ffmpeg", "-y", "-v", "error",
                "-i", str(concat_wav),
                "-af", master_af,
                "-ac", "1", "-ar", "48000", "-b:a", "128k",
                str(out_mp3),
            ]
        )
    else:
        voice_dur = probe_duration_sec(concat_wav)
        fade_out_st = max(0.0, voice_dur - 1.2)
        filter_complex = (
            f"[0:a]{master_af}[v];"
            f"[1:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=mono,"
            f"volume={bgm_db}dB,afade=t=in:st=0:d=0.6,afade=t=out:st={fade_out_st:.2f}:d=1.2[b];"
            f"[v][b]amix=inputs=2:duration=first:normalize=0,alimiter=limit=-1.5dB:level=false[out]"
        )
        subprocess.check_call(
            [
                "ffmpeg", "-y", "-v", "error",
                "-i", str(concat_wav),
                "-stream_loop", "-1", "-i", str(bgm_path),
                "-filter_complex", filter_complex,
                "-map", "[out]",
                "-ac", "1", "-ar", "48000", "-b:a", "128k",
                str(out_mp3),
            ]
        )


def ms_to_srt_ts(ms: int) -> str:
    h = ms // 3_600_000
    ms %= 3_600_000
    m = ms // 60_000
    ms %= 60_000
    s = ms // 1_000
    rem = ms % 1_000
    return f"{h:02d}:{m:02d}:{s:02d},{rem:03d}"


def build_srt(captions: list[dict]) -> str:
    blocks = []
    for idx, cue in enumerate(captions, start=1):
        blocks.append(f"{idx}\n{ms_to_srt_ts(cue['startMs'])} --> {ms_to_srt_ts(cue['endMs'])}\n{cue['text']}")
    return "\n\n".join(blocks) + "\n"


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    env = load_env(repo_root)

    parser = argparse.ArgumentParser(description="硅基流动 CosyVoice2 单主声纹配音与无缝母带拼接")
    parser.add_argument("--list-voices", action="store_true", help="列出云端已有自定义声纹")
    parser.add_argument("--text", help="单段口播文案")
    parser.add_argument("--segments-json", help="多段脚本 JSON 文件（数组，每项含 text，可选 id/ttsText/gapAfterMs）")
    parser.add_argument("--voice", default=DEFAULT_VOICE_URI, help=f"声纹 URI（默认 {DEFAULT_VOICE_URI}）")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"模型名称（默认 {DEFAULT_MODEL}）")
    parser.add_argument("--speed", type=float, default=1.0, help="语速倍率（默认 1.0）")
    parser.add_argument("--gain", type=float, default=-6.0, help="硅基流动服务端增益 dB（默认 -6.0，防止 int16 溢出回绕爆音）")
    parser.add_argument("--gap-ms", type=int, default=260, help="段间默认气口毫秒数（默认 260）")
    parser.add_argument("--dict", default=str(DEFAULT_DICT_PATH), help="发音词典 JSON 路径")
    parser.add_argument("--bgm", help="可选：背景音乐文件路径（MP3/WAV）")
    parser.add_argument("--bgm-db", type=float, default=-24.0, help="BGM 音量 dB（默认 -24.0）")
    parser.add_argument("--out-dir", default="public/audio", help="输出目录（默认 public/audio）")
    parser.add_argument("--name", default="narration", help="输出文件名前缀")
    args = parser.parse_args()

    api_key = env.get("SILICONFLOW_API_KEY")
    base_url = env.get("SILICONFLOW_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    if not api_key:
        raise SystemExit("缺少 SILICONFLOW_API_KEY，请在 .env 或环境变量中配置。")

    if args.list_voices:
        list_voices(api_key, base_url)
        return

    if args.segments_json:
        segments = json.loads(Path(args.segments_json).read_text(encoding="utf-8"))
        if not isinstance(segments, list) or not segments:
            raise SystemExit("segments-json 必须是非空 JSON 数组")
    elif args.text:
        segments = [{"id": "seg-1", "text": args.text.strip()}]
    else:
        raise SystemExit("请提供 --text、--segments-json 或 --list-voices")

    pdict = load_pronunciation_dict(Path(args.dict))
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="sf_tts_") as tmpdir:
        tmp = Path(tmpdir)
        concat_inputs: list[Path] = []
        timeline: list[dict] = []
        captions: list[dict] = []
        cursor_ms = 0

        for idx, seg in enumerate(segments):
            seg_id = seg.get("id") or f"seg-{idx + 1}"
            display_text = seg["text"].strip()
            tts_text = seg.get("ttsText") or normalize_for_tts(display_text, pdict)
            gap_after_ms = int(seg.get("gapAfterMs", args.gap_ms))

            raw_wav = tmp / f"{idx:03d}_raw.wav"
            trim_wav = tmp / f"{idx:03d}_trim.wav"

            print(f"[{idx + 1}/{len(segments)}] 合成 {seg_id}: {tts_text}")
            synthesize_segment(
                api_key, base_url, args.model, args.voice, tts_text, raw_wav, speed=args.speed, gain=args.gain
            )
            dur_sec = trim_and_fade_segment(raw_wav, trim_wav)
            dur_ms = int(round(dur_sec * 1000))

            start_ms = cursor_ms
            end_ms = cursor_ms + dur_ms
            timeline.append(
                {
                    "id": seg_id,
                    "startMs": start_ms,
                    "endMs": end_ms,
                    "durationMs": dur_ms,
                    "text": display_text,
                    "ttsText": tts_text,
                }
            )
            captions.append({"startMs": start_ms, "endMs": end_ms, "text": display_text})
            concat_inputs.append(trim_wav)
            cursor_ms = end_ms

            if idx < len(segments) - 1 and gap_after_ms > 0:
                gap_wav = tmp / f"{idx:03d}_gap.wav"
                subprocess.check_call(
                    [
                        "ffmpeg", "-y", "-v", "error",
                        "-f", "lavfi", "-t", f"{gap_after_ms / 1000.0:.3f}",
                        "-i", "anullsrc=r=48000:cl=mono",
                        "-c:a", "pcm_s16le", str(gap_wav),
                    ]
                )
                concat_inputs.append(gap_wav)
                cursor_ms += gap_after_ms

        concat_list = tmp / "concat.txt"
        concat_list.write_text(
            "\n".join(f"file '{p.as_posix()}'" for p in concat_inputs) + "\n",
            encoding="utf-8",
        )
        concat_wav = tmp / "full_concat.wav"
        subprocess.check_call(
            [
                "ffmpeg", "-y", "-v", "error",
                "-f", "concat", "-safe", "0",
                "-i", str(concat_list),
                "-c", "copy", str(concat_wav),
            ]
        )

        mp3_path = out_dir / f"{args.name}.mp3"
        srt_path = out_dir / f"{args.name}.srt"
        captions_path = out_dir / f"{args.name}.captions.json"
        timeline_path = out_dir / f"{args.name}.timeline.json"

        bgm_path = Path(args.bgm) if args.bgm else None
        master_full_track(concat_wav, mp3_path, bgm_path=bgm_path, bgm_db=args.bgm_db)

        srt_path.write_text(build_srt(captions), encoding="utf-8")
        captions_path.write_text(json.dumps(captions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        timeline_path.write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        final_dur = probe_duration_sec(mp3_path)
        print(f"\n完成！总时长: {final_dur:.2f}s")
        print(f"音频   : {mp3_path}")
        print(f"SRT    : {srt_path}")
        print(f"字幕   : {captions_path}")
        print(f"时间轴 : {timeline_path}")


if __name__ == "__main__":
    main()
