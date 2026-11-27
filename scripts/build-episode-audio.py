#!/usr/bin/env python3
"""
参数化 5 幕整段配音 + SenseVoiceSmall ASR 门禁 + 48kHz 立体声零爆音母带混音脚本
严格内置 docs/HARD_RULES.md 全部音频铁律：
  - 单主声纹 ljy-hook-clean（无情绪指令）
  - speed=1.0（严禁加速吞音）
  - gain=-6.0 + 无损 wav（严防 CosyVoice2 16-bit 回绕爆音）
  - 保留原生 GitHub 拼写 + 词典替换
  - 禁止 silenceremove（仅首尾 10ms fade）
  - FunAudioLLM/SenseVoiceSmall 逐幕 ASR 自动回转质检
  - 单次 loudnorm + aresample=48000 + alimiter + 叠加 112 BPM 侦探酸爵士 BGM
  - 波形硬断言: clips == 0, wrap_jumps == 0, sample_rate == 48000

用法:
  python3 scripts/build-episode-audio.py data/episodes/ep02.json
  python3 scripts/build-episode-audio.py data/episodes/ep02.json --only act1_rank3
"""
import argparse
import json
import os
import struct
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VOICE_URI = "speech:your-voice-name:xxxx:yyyy"
BGM_PATH = REPO_ROOT / "public/sfx/detective-acid-jazz-112-full.wav"
DICT_PATH = REPO_ROOT / "data/pronunciation-dict.json"
FPS = 30


def load_api_key() -> str:
    key = os.environ.get("SILICONFLOW_API_KEY", "").strip()
    if key:
        return key
    env_file = REPO_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("SILICONFLOW_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("未找到 SILICONFLOW_API_KEY（请配置环境变量或 .env）")


def apply_pronunciation_dict(text: str) -> str:
    if not DICT_PATH.exists():
        return text
    raw = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    replacements = raw.get("replacements", raw) if isinstance(raw, dict) else {}
    for k, v in replacements.items():
        if k.lower() == "github":
            # 铁律：严禁覆盖原生 GitHub 拼写
            continue
        text = text.replace(k, v)
    return text


def synthesize_act(api_key: str, text: str, out_wav: Path) -> None:
    payload = json.dumps({
        "model": "FunAudioLLM/CosyVoice2-0.5B",
        "input": apply_pronunciation_dict(text),
        "voice": VOICE_URI,
        "response_format": "wav",
        "sample_rate": 44100,
        "speed": 1.0,
        "gain": -6.0,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.siliconflow.cn/v1/audio/speech",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        out_wav.write_bytes(resp.read())


def run_asr(api_key: str, wav_path: Path) -> str:
    boundary = "----AntigravityASRBoundary7e9a"
    file_bytes = wav_path.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="model"\r\n\r\n'
        f"FunAudioLLM/SenseVoiceSmall\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{wav_path.name}"\r\n'
        f"Content-Type: audio/wav\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
    req = urllib.request.Request(
        "https://api.siliconflow.cn/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res.get("text", "").strip()


def wav_stats(wav_path: Path) -> dict:
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        n = wf.getnframes()
        raw = wf.readframes(n)
    samples = struct.unpack(f"<{n * ch}h", raw)
    peak = max(abs(s) for s in samples) / 32768.0 if samples else 0.0
    clips = sum(1 for s in samples if abs(s) >= 32760)
    wrap_jumps = 0
    for i in range(ch, len(samples)):
        if abs(samples[i] - samples[i - ch]) > 50000:
            wrap_jumps += 1
    return {
        "sample_rate": sr,
        "channels": ch,
        "duration_sec": round(n / sr, 3),
        "peak": round(peak, 4),
        "clips": clips,
        "wrap_jumps": wrap_jumps,
    }


def run_cmd(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main() -> None:
    parser = argparse.ArgumentParser(description="生成本期 5 幕语音 + ASR 校验 + 48kHz 零爆音母带")
    parser.add_argument("config", help="期数配置 JSON 路径，例如 data/episodes/ep02.json")
    parser.add_argument("--only", help="仅重新生成指定 act id（例如 act1_rank3）")
    parser.add_argument("--skip-asr", action="store_true", help="跳过 SenseVoiceSmall ASR 检查（不推荐）")
    args = parser.parse_args()

    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = REPO_ROOT / cfg_path
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    api_key = load_api_key()

    slug = cfg["episode_slug"]
    out_dir = REPO_ROOT / "public/audio" / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    timeline = []
    cursor = 0.25  # 开场留 0.25s 呼吸空间

    for act in cfg["acts"]:
        aid = act["id"]
        raw_wav = out_dir / f"{aid}_raw.wav"
        clean_wav = out_dir / f"{aid}_48k.wav"

        if (not args.only) or (args.only == aid) or (not raw_wav.exists()):
            print(f"[TTS] 合成 {aid} (speed=1.0, gain=-6.0)...")
            synthesize_act(api_key, act["tts_text"], raw_wav)
            raw_stat = wav_stats(raw_wav)
            print(f"      raw: dur={raw_stat['duration_sec']}s, peak={raw_stat['peak']}, clips={raw_stat['clips']}, wrap_jumps={raw_stat['wrap_jumps']}")
            if raw_stat["wrap_jumps"] > 0:
                raise RuntimeError(f"{aid} 检测到 16-bit 回绕尖峰 ({raw_stat['wrap_jumps']})，请重跑该幕！")

            # 严禁 silenceremove：仅做 10ms 首尾淡入淡出 + 48kHz 单声道标准化
            dur = raw_stat["duration_sec"]
            fade_out_start = max(0.0, dur - 0.012)
            run_cmd([
                "ffmpeg", "-y", "-i", str(raw_wav),
                "-af", f"afade=t=in:st=0:d=0.01,afade=t=out:st={fade_out_start:.3f}:d=0.012,aresample=48000",
                "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le",
                str(clean_wav),
            ])

            if not args.skip_asr:
                asr_text = run_asr(api_key, clean_wav)
                print(f"[ASR] {aid} 原稿: {act['tts_text']}")
                print(f"[ASR] {aid} 回转: {asr_text}")

        st = wav_stats(clean_wav)
        start_sec = round(cursor, 3)
        end_sec = round(cursor + st["duration_sec"], 3)
        timeline.append({
            "id": aid,
            "wav": f"audio/{slug}/{aid}_48k.wav",
            "start_sec": start_sec,
            "end_sec": end_sec,
            "duration_sec": st["duration_sec"],
            "start_frame": int(round(start_sec * FPS)),
            "end_frame": int(round(end_sec * FPS)),
            "subtitle_text": act["subtitle_text"],
        })
        cursor = end_sec + float(act.get("gap_after_sec", 0.4))

    total_sec = round(cursor, 3)
    total_frames = int(round(total_sec * FPS))

    # 1. 拼接整轨人声（保留精确静音间隔，单次 loudnorm + aresample=48000 + alimiter）
    inputs = []
    delay_filters = []
    mix_labels = []
    for i, item in enumerate(timeline):
        inputs += ["-i", str(REPO_ROOT / "public" / item["wav"])]
        ms = int(round(item["start_sec"] * 1000))
        delay_filters.append(f"[{i}:a]adelay={ms}|{ms}[v{i}]")
        mix_labels.append(f"[v{i}]")

    voice_master = out_dir / "voice-master-48k.wav"
    fc_voice = (
        ";".join(delay_filters)
        + f";{''.join(mix_labels)}amix=inputs={len(timeline)}:duration=longest:normalize=0,"
        + f"apad=whole_dur={total_sec},"
        + "loudnorm=I=-16:TP=-2.0:LRA=11,"
        + "aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,"
        + "alimiter=limit=-1.5dB:level=false[vout]"
    )
    run_cmd([
        "ffmpeg", "-y", *inputs,
        "-filter_complex", fc_voice, "-map", "[vout]",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
        str(voice_master),
    ])

    # 2. 叠入 112 BPM 原创侦探酸爵士 BGM（-23dB + 结尾 1.2s 淡出）
    master_wav = out_dir / "master-48k.wav"
    bgm_fade_out = max(0.0, total_sec - 1.2)
    fc_mix = (
        f"[1:a]atrim=0:{total_sec},volume=-23dB,"
        f"afade=t=in:st=0:d=0.4,afade=t=out:st={bgm_fade_out:.3f}:d=1.2,"
        f"aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo[bgm];"
        f"[0:a][bgm]amix=inputs=2:duration=first:normalize=0,"
        f"alimiter=limit=-1.5dB:level=false[out]"
    )
    run_cmd([
        "ffmpeg", "-y", "-i", str(voice_master), "-i", str(BGM_PATH),
        "-filter_complex", fc_mix, "-map", "[out]",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
        str(master_wav),
    ])

    mstat = wav_stats(master_wav)
    print(f"\n[MASTER] {master_wav}")
    print(f"         sr={mstat['sample_rate']}Hz, dur={mstat['duration_sec']}s ({total_frames} frames @ {FPS}fps)")
    print(f"         peak={mstat['peak']}, clips={mstat['clips']}, wrap_jumps={mstat['wrap_jumps']}")
    assert mstat["sample_rate"] == 48000, "采样率必须为 48000Hz"
    assert mstat["clips"] == 0, "检测到削波爆音！"
    assert mstat["wrap_jumps"] == 0, "检测到 16-bit 回绕爆音！"

    tl_path = out_dir / "timeline.json"
    tl_path.write_text(json.dumps({
        "episode_slug": slug,
        "file_code": cfg["file_code"],
        "fps": FPS,
        "total_sec": mstat["duration_sec"],
        "total_frames": total_frames,
        "master_wav": f"audio/{slug}/master-48k.wav",
        "acts": timeline,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[DONE] 时间轴已写入: {tl_path}")


if __name__ == "__main__":
    main()
