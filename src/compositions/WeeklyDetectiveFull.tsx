import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Lock, VolumeX } from 'lucide-react';
import timelineData from '../../public/audio/weekly-detective-full.timeline.json';
import { clampInterpolate } from '../kit/motion';
import { theme } from '../kit/theme';
import { FisheyeCanvas } from '../kit/fisheye/FisheyeCanvas';

const segMap = Object.fromEntries(
  timelineData.map((s) => {
    const startF = Math.round((s.startMs / 1000) * 30);
    const endF = Math.round((s.endMs / 1000) * 30);
    return [s.id, { startF, endF, dur: Math.max(1, endF - startF) }];
  })
);

export const WEEKLY_DETECTIVE_FULL_FRAMES =
  Math.ceil((timelineData[timelineData.length - 1].endMs / 1000) * 30) + 24;

// Strict DESIGN.md palette
const BG = '#080C16';
const CRIMSON = '#E63946';
const GOLD = '#FFD166';
const WHITE = '#F8FAFC';
const MUTED = '#94A3B8';

interface SubtitleCue {
  startFrame: number;
  endFrame: number;
  text: string;
}

/** 按标点把口播切为 <= 14 字的单行像素粗黑字幕，杜绝单字折行 */
function buildSubtitleCues(): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  // Segments where full-screen Crimson Kinetic Typography is shown -> hide bottom subtitle!
  const hiddenIds = new Set(['a1_c3_punch', 'a3_c1_punch']);

  for (const seg of timelineData) {
    if (hiddenIds.has(seg.id)) continue;

    // Special case for a0_punch: first half is crimson kinetic -> hide; second half shows IP reveal subtitle
    if (seg.id === 'a0_punch') {
      const sF = Math.round((seg.startMs / 1000) * 30);
      const eF = Math.round((seg.endMs / 1000) * 30);
      const midF = sF + Math.round((eF - sF) * 0.5);
      cues.push({ startFrame: midF, endFrame: eF, text: '档案开启，马上揭晓！' });
      continue;
    }

    const clean = seg.text
      .replace(/G T A 六/g, 'GTA 6')
      .replace(/no speaker/g, 'nospeaker')
      .replace(/3 D /g, '3D ');
    const parts = clean
      .split(/(?<=[。！？；，：])/)
      .map((s) => s.trim())
      .filter(Boolean);

    const lines: string[] = [];
    for (const part of parts) {
      const stripped = part.replace(/[。，；：]+$/, '');
      if (stripped.length <= 14) {
        if (lines.length > 0 && lines[lines.length - 1].length + stripped.length <= 13) {
          lines[lines.length - 1] += '，' + stripped;
        } else {
          lines.push(stripped);
        }
      } else {
        // Split cleanly in half WITHOUT cutting inside an ASCII/English word (e.g. GitHub, KuroCat)
        let mid = Math.ceil(stripped.length / 2);
        while (mid > 2 && /[A-Za-z0-9]/.test(stripped[mid - 1]) && /[A-Za-z0-9]/.test(stripped[mid])) {
          mid--;
        }
        lines.push(stripped.slice(0, mid).trim());
        lines.push(stripped.slice(mid).trim());
      }
    }

    const totalChars = lines.reduce((acc, s) => acc + Math.max(1, s.length), 0);
    const startF = Math.round((seg.startMs / 1000) * 30);
    const endF = Math.round((seg.endMs / 1000) * 30);
    let cursor = startF;

    lines.forEach((line, idx) => {
      const dur = idx === lines.length - 1 ? endF - cursor : Math.max(12, Math.round(((line.length / totalChars) * (endF - startF))));
      cues.push({ startFrame: cursor, endFrame: cursor + dur, text: line });
      cursor += dur;
    });
  }
  return cues;
}

const DetectiveGridBg: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: BG,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
      backgroundSize: '36px 36px',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 50% 42%, rgba(230,57,70,0.06) 0%, rgba(8,12,22,0) 58%, rgba(4,6,12,0.8) 100%)',
      }}
    />
  </AbsoluteFill>
);

const DetectiveHud: React.FC<{ frame: number; tag: string; hideBadge?: boolean }> = ({
  frame,
  tag,
  hideBadge = false,
}) => {
  const progress = Math.min(1, frame / WEEKLY_DETECTIVE_FULL_FRAMES);
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 60 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: CRIMSON, boxShadow: `0 0 12px ${CRIMSON}` }} />
      </div>
      {!hideBadge ? (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 44,
            zIndex: 55,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            backgroundColor: 'rgba(8, 12, 22, 0.9)',
            border: `2px solid ${CRIMSON}`,
            boxShadow: '4px 4px 0 rgba(0,0,0,0.9)',
          }}
        >
          <svg width="24" height="30" viewBox="0 0 24 30">
            <circle cx="12" cy="10" r="7" fill={CRIMSON} />
            <polygon points="8,15 16,15 19,28 5,28" fill={CRIMSON} />
          </svg>
          <div style={{ fontFamily: theme.fonts.mono, lineHeight: 1.15 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: CRIMSON, letterSpacing: 2 }}>FILE.048</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1 }}>{tag}</div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const PixelSubtitleBar: React.FC<{ cues: SubtitleCue[]; frame: number }> = ({ cues, frame }) => {
  const cue = cues.find((c) => frame >= c.startFrame && frame <= c.endFrame);
  if (!cue) return null;
  const local = frame - cue.startFrame;
  const opacity = clampInterpolate(local, [0, 4], [0, 1]);
  const ty = clampInterpolate(local, [0, 5], [10, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 110,
        top: 1500,
        zIndex: 55,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${ty}px)`,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: 46,
          fontWeight: 900,
          color: WHITE,
          textAlign: 'center',
          letterSpacing: 1,
          whiteSpace: 'nowrap',
          textShadow: '4px 4px 0 #000000, -2px -2px 0 #000000, 2px -2px 0 #000000, -2px 2px 0 #000000',
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

/** 复用组件：朱红高反差满屏大字撞击（自动隐藏底部字幕） */
const CrimsonKineticShot: React.FC<{ badge: string; line1: string; line2?: string }> = ({
  badge,
  line1,
  line2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p1 = spring({ frame, fps, config: { damping: 12, stiffness: 280 } });
  const p2 = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 12, stiffness: 280 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CRIMSON,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 64px',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.16) 2px, transparent 2px)',
        backgroundSize: '18px 18px',
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: 30,
          fontWeight: 900,
          color: BG,
          letterSpacing: 5,
          padding: '10px 24px',
          backgroundColor: GOLD,
          boxShadow: `6px 6px 0 ${BG}`,
        }}
      >
        {badge}
      </div>
      <div
        style={{
          marginTop: 34,
          fontFamily: theme.fonts.sans,
          fontSize: line2 ? 88 : 108,
          fontWeight: 900,
          color: WHITE,
          textAlign: 'center',
          lineHeight: 1.15,
          textShadow: `9px 9px 0 ${BG}`,
          transform: `scale(${clampInterpolate(p1, [0, 1], [0.65, 1])})`,
        }}
      >
        {line1}
      </div>
      {line2 ? (
        <div
          style={{
            marginTop: 26,
            fontFamily: theme.fonts.sans,
            fontSize: 80,
            fontWeight: 900,
            color: GOLD,
            textAlign: 'center',
            lineHeight: 1.18,
            textShadow: `7px 7px 0 ${BG}`,
            transform: `translateY(${clampInterpolate(p2, [0, 1], [36, 0])}px)`,
            opacity: clampInterpolate(p2, [0, 1], [0, 1]),
          }}
        >
          {line2}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 复用组件：魔改版 A 极客耳机少年闪电亮相 */
const HeroIpFlashShot: React.FC<{ label?: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const scale = clampInterpolate(frame, [0, 6, 44], [1.14, 1.0, 1.04]);
  const flash = clampInterpolate(frame, [0, 6], [0.95, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Img
        src={staticFile('images/ip/remix-a-hero.jpg')}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
      />
      <div
        style={{
          position: 'absolute',
          top: 170,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: theme.fonts.mono,
          fontSize: 48,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: 5,
          textShadow: '4px 4px 0 #000',
        }}
      >
        FILE.048
      </div>
      {label ? (
        <div
          style={{
            position: 'absolute',
            bottom: 310,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: theme.fonts.sans,
            fontSize: 64,
            fontWeight: 900,
            color: WHITE,
            textShadow: `0 0 28px ${GOLD}, 5px 5px 0 #000`,
          }}
        >
          {label}
        </div>
      ) : null}
      <AbsoluteFill style={{ backgroundColor: '#FFFFFF', opacity: flash, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

/** 复用组件：严格 2.8–4.2s WebGL 鱼眼侦探证物审阅镜头 */
const FisheyeVerifiedShot: React.FC<{
  repo: string;
  imageSrc: string;
  stars: number;
  stamp: string;
  summary: string;
  caseNum: string;
}> = ({ repo, imageSrc, stars, stamp, summary, caseNum }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const focusP = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 22, stiffness: 90 } });
  const zoom = clampInterpolate(focusP, [0, 1], [1.08, 1.56]);
  const mask1 = clampInterpolate(frame, [24, 52], [0, 1]);
  const starRoll = Math.round(clampInterpolate(frame, [4, 42], [0, stars]));
  const stampPop = spring({ frame: Math.max(0, frame - 42), fps, config: { damping: 12, stiffness: 260 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div
        style={{
          position: 'absolute',
          top: 165,
          left: 44,
          right: 105,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 25,
        }}
      >
        <div>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: CRIMSON, letterSpacing: 2 }}>
            GITHUB ARCHIVE // VERIFIED
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: theme.fonts.mono,
              fontSize: repo.length > 15 ? 48 : 58,
              fontWeight: 900,
              color: WHITE,
              textShadow: '5px 5px 0 #000',
            }}
          >
            {repo}
          </div>
        </div>
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#111827',
            border: `3px solid ${GOLD}`,
            boxShadow: '5px 5px 0 #000',
            fontFamily: theme.fonts.mono,
            fontSize: 32,
            fontWeight: 900,
            color: GOLD,
          }}
        >
          ★ {starRoll.toLocaleString()}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 335,
          left: 44,
          right: 100,
          height: 750,
          border: `5px solid ${GOLD}`,
          boxShadow: '10px 10px 0 #000, 0 0 38px rgba(255,209,102,0.22)',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        <FisheyeCanvas
          imageSrc={imageSrc}
          focus={{ x: clampInterpolate(focusP, [0, 1], [0.52, 0.72]), y: 0.36 }}
          zoom={zoom}
          strength={1.38}
          moire={{ intensity: 0.24, scale: 820, angle: 0.05 }}
          vignette={{ amount: 0.75, radius: 0.72, softness: 0.42 }}
          rects={[
            { x: 0.67, y: 0.295, w: 0.29, h: 0.085, color: '#ffe200', opacity: 0.94, blend: 'multiply', mask: mask1 },
          ]}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            right: 28,
            padding: '10px 22px',
            border: `4px solid ${CRIMSON}`,
            backgroundColor: 'rgba(8, 12, 22, 0.92)',
            color: CRIMSON,
            fontFamily: theme.fonts.mono,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 2,
            transform: `rotate(-6deg) scale(${clampInterpolate(stampPop, [0, 1], [2.0, 1])})`,
            opacity: clampInterpolate(stampPop, [0, 1], [0, 1]),
          }}
        >
          {stamp}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1140,
          left: 44,
          right: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 26px',
          backgroundColor: 'rgba(17, 24, 39, 0.94)',
          borderLeft: `8px solid ${CRIMSON}`,
          boxShadow: '6px 6px 0 #000',
        }}
      >
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 32, fontWeight: 900, color: WHITE }}>{summary}</div>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 900, color: GOLD }}>{caseNum}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ================= ACT 0: 黄金开场 (0 - 369) ================= */
const Act0Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const keyholeZoom = clampInterpolate(frame, [14, 28], [1, 16]);
  const keyholeOpacity = clampInterpolate(frame, [20, 28], [1, 0]);
  const filePop = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 14, stiffness: 260 } });
  const cases = [
    { rank: 'CASE #03', name: 'nospeaker', tag: '触控板开口唱歌', stars: '+1,982★', beat: 46 },
    { rank: 'CASE #02', name: 'KuroCat', tag: '桌面打字小黑猫', stars: '+1,735★', beat: 64 },
    { rank: 'CASE #01', name: 'VIctory', tag: 'PC 强跑 GTA 6', stars: '+13,672★', beat: 82 },
  ];

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 190, left: 44, right: 110 }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 900, letterSpacing: 3, boxShadow: '5px 5px 0 #000' }}>
          2026 W48 // TOP 3 ARCHIVE
        </div>
        <div style={{ marginTop: 18, fontFamily: theme.fonts.sans, fontSize: 78, fontWeight: 900, color: WHITE, lineHeight: 1.12, textShadow: '6px 6px 0 #000' }}>
          GitHub 本周<br /><span style={{ color: GOLD }}>三大离谱神作</span>
        </div>
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {cases.map((c, idx) => {
            const p = spring({ frame: Math.max(0, frame - c.beat), fps, config: { damping: 13, stiffness: 240 } });
            const isTop1 = idx === 2;
            return (
              <div
                key={c.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '28px 30px',
                  backgroundColor: isTop1 ? '#171219' : '#101726',
                  border: `4px solid ${isTop1 ? CRIMSON : '#334155'}`,
                  borderLeft: `12px solid ${isTop1 ? GOLD : CRIMSON}`,
                  boxShadow: '8px 8px 0 #000',
                  transform: `translateX(${clampInterpolate(p, [0, 1], [-120, 0])}px)`,
                  opacity: clampInterpolate(p, [0, 1], [0, 1]),
                }}
              >
                <div>
                  <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: isTop1 ? GOLD : CRIMSON }}>
                    {c.rank} · {c.name}
                  </div>
                  <div style={{ marginTop: 6, fontFamily: theme.fonts.sans, fontSize: 40, fontWeight: 900, color: WHITE }}>{c.tag}</div>
                </div>
                <div style={{ fontFamily: theme.fonts.mono, fontSize: 30, fontWeight: 900, color: GOLD, padding: '8px 16px', backgroundColor: 'rgba(8,12,22,0.85)', border: `2px solid ${GOLD}` }}>
                  {c.stars}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {frame < 29 ? (
        <AbsoluteFill style={{ backgroundColor: '#05070D', opacity: keyholeOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${keyholeZoom})`, zIndex: 45 }}>
          <svg width="460" height="560" viewBox="0 0 230 280">
            <g fill="#8B2635" stroke="#05070D" strokeWidth="3">
              <rect x="45" y="10" width="140" height="24" /><rect x="25" y="34" width="180" height="24" /><rect x="15" y="58" width="200" height="24" /><rect x="15" y="82" width="200" height="24" /><rect x="25" y="106" width="180" height="24" /><rect x="40" y="130" width="150" height="24" /><rect x="35" y="154" width="160" height="24" /><rect x="30" y="178" width="170" height="24" /><rect x="25" y="202" width="180" height="24" /><rect x="20" y="226" width="190" height="24" />
            </g>
            <circle cx="115" cy="94" r="52" fill="#05070D" />
            <polygon points="88,132 142,132 162,252 68,252" fill="#05070D" />
            <circle cx="115" cy="94" r="52" fill="none" stroke={CRIMSON} strokeWidth="4" />
          </svg>
          <div style={{ position: 'absolute', fontFamily: theme.fonts.mono, fontSize: 54, fontWeight: 900, color: GOLD, letterSpacing: 6, textShadow: '4px 4px 0 #000', transform: `scale(${clampInterpolate(filePop, [0, 1], [0.5, 1])})` }}>
            FILE.048
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ================= ACT 1: CASE #03 nospeaker (369 - 1100) ================= */
const Act1Case3LaptopHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const burst = frame >= 105;
  const burstSpring = spring({ frame: Math.max(0, frame - 105), fps, config: { damping: 12, stiffness: 220 } });
  const laptopFloat = Math.sin(frame * 0.12) * 5;

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 205, left: 44, right: 110, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '10px 26px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.sans, fontSize: 34, fontWeight: 900, letterSpacing: 3, boxShadow: '6px 6px 0 #000' }}>
          CASE #03 · 密室发声案
        </div>

        <div style={{ position: 'relative', marginTop: 80, width: 820, height: 740, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${laptopFloat}px)` }}>
          {burst
            ? [0, 1, 2, 3].map((ring) => {
                const p = (((frame - 105) * 3.2 + ring * 25) % 100) / 100;
                return (
                  <div
                    key={ring}
                    style={{
                      position: 'absolute',
                      width: 240 + p * 580,
                      height: 240 + p * 580,
                      border: `4px dashed rgba(255, 209, 102, ${(1 - p) * 0.9})`,
                      borderRadius: 999,
                    }}
                  />
                );
              })
            : null}

          <svg width="700" height="500" viewBox="0 0 700 500" style={{ filter: 'drop-shadow(0 16px 0 rgba(0,0,0,0.85))' }}>
            <rect x="90" y="30" width="520" height="310" fill="#131B2E" stroke="#F8FAFC" strokeWidth="8" />
            <rect x="110" y="50" width="480" height="270" fill="#060912" stroke="#334155" strokeWidth="4" />
            {Array.from({ length: 18 }, (_, i) => (
              <line key={i} x1="114" y1={60 + i * 14} x2="586" y2={60 + i * 14} stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            ))}
            {!burst ? (
              <g>
                <rect x="230" y="130" width="240" height="100" fill="rgba(230,57,70,0.16)" stroke={CRIMSON} strokeWidth="4" />
                <text x="350" y="192" textAnchor="middle" fill={CRIMSON} fontFamily="monospace" fontSize="36" fontWeight="900">
                  AUDIO: OFF
                </text>
              </g>
            ) : (
              <g>
                {Array.from({ length: 19 }, (_, idx) => {
                  const h = 28 + Math.abs(Math.sin((frame - 90) * 0.45 + idx * 0.7)) * 150 * clampInterpolate(burstSpring, [0, 1], [0.2, 1]);
                  return <rect key={idx} x={148 + idx * 22} y={185 - h / 2} width="14" height={h} fill={idx % 4 === 0 ? CRIMSON : GOLD} />;
                })}
              </g>
            )}
            <polygon points="40,348 660,348 690,465 10,465" fill="#1E293B" stroke="#F8FAFC" strokeWidth="8" />
            <rect x="110" y="366" width="480" height="44" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <rect x="280" y="420" width="140" height="34" fill={burst ? 'rgba(255,209,102,0.35)' : '#0F172A'} stroke={burst ? GOLD : '#64748B'} strokeWidth="4" />
          </svg>

          <div style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 28px', backgroundColor: '#111827', border: `3px solid ${burst ? GOLD : CRIMSON}`, boxShadow: '6px 6px 0 #000', fontFamily: theme.fonts.mono, fontSize: 30, fontWeight: 900, color: burst ? GOLD : CRIMSON }}>
            <VolumeX size={34} color={burst ? GOLD : CRIMSON} />
            <span>{burst ? 'SIGNAL DETECTED · 异常发声！' : 'SPEAKER DISCONNECTED · 0%'}</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Act1Case3ClueBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lensIn = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const lineDraw = clampInterpolate(frame, [24, 58], [1, 0]);
  const card1In = spring({ frame: Math.max(0, frame - 38), fps, config: { damping: 15, stiffness: 210 } });
  const card2In = spring({ frame: Math.max(0, frame - 115), fps, config: { damping: 15, stiffness: 210 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}>
        <path d="M 480 650 L 280 960" stroke={CRIMSON} strokeWidth="6" strokeDasharray="420" strokeDashoffset={420 * lineDraw} fill="none" />
        <path d="M 560 650 L 720 1040" stroke={CRIMSON} strokeWidth="6" strokeDasharray="460" strokeDashoffset={460 * lineDraw} fill="none" />
        <circle cx="480" cy="650" r="9" fill={CRIMSON} />
        <circle cx="560" cy="650" r="9" fill={CRIMSON} />
      </svg>

      <div style={{ position: 'absolute', top: 220, left: 44, right: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20, transform: `scale(${clampInterpolate(lensIn, [0, 1], [0.8, 1])})` }}>
        <div style={{ position: 'relative', width: 560, height: 560, borderRadius: 999, border: `14px solid ${GOLD}`, backgroundColor: '#0A1020', boxShadow: '0 0 50px rgba(255,209,102,0.38), inset 0 0 40px rgba(0,0,0,0.9)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 360, height: 220, border: `4px solid ${WHITE}`, backgroundColor: '#131C31', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(frame * 1.4) * 3}px)` }}>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: GOLD, letterSpacing: 3 }}>HAPTIC MOTOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, height: 84 }}>
              {Array.from({ length: 13 }, (_, i) => (
                <div key={i} style={{ width: 12, height: 16 + Math.abs(Math.sin(frame * 0.55 + i * 0.8)) * 68, backgroundColor: i % 3 === 0 ? CRIMSON : GOLD }} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: 22, fontFamily: theme.fonts.sans, fontSize: 30, fontWeight: 900, color: WHITE, letterSpacing: 2 }}>
            MacBook 触控板马达
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 920, left: 52, width: 445, padding: '22px 24px', backgroundColor: '#F4F1E8', color: BG, border: `4px solid ${BG}`, boxShadow: `8px 8px 0 ${CRIMSON}`, zIndex: 25, transform: `translateY(${clampInterpolate(card1In, [0, 1], [40, 0])}px)`, opacity: clampInterpolate(card1In, [0, 1], [0, 1]) }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 20, fontWeight: 900, color: CRIMSON }}>EVIDENCE #01</div>
        <div style={{ marginTop: 8, fontFamily: theme.fonts.sans, fontSize: 34, fontWeight: 900 }}>高频信号驱动震动马达</div>
      </div>

      <div style={{ position: 'absolute', top: 1095, left: 465, width: 470, padding: '22px 24px', backgroundColor: '#F4F1E8', color: BG, border: `4px solid ${BG}`, boxShadow: `8px 8px 0 ${GOLD}`, zIndex: 25, transform: `translateY(${clampInterpolate(card2In, [0, 1], [40, 0])}px)`, opacity: clampInterpolate(card2In, [0, 1], [0, 1]) }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 20, fontWeight: 900, color: CRIMSON }}>EVIDENCE #02</div>
        <div style={{ marginTop: 8, fontFamily: theme.fonts.sans, fontSize: 34, fontWeight: 900 }}>像音箱纸盆推动空气发声</div>
      </div>
    </AbsoluteFill>
  );
};

/* ================= ACT 2: CASE #02 KuroCat (1100 - 1883) ================= */
const Act2KuroCatRealMonitor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const stageIdx = frame < 95 ? 0 : frame < 190 ? 1 : 2;
  const stages = ['① 午睡打盹中...', '② 敲键盘狂敲 / 起床气！', '③ 摸头呼噜消气 ✓'];

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 180, left: 44, right: 105, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${clampInterpolate(pop, [0, 1], [0.9, 1])})` }}>
        <div style={{ padding: '10px 26px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.sans, fontSize: 34, fontWeight: 900, letterSpacing: 3, boxShadow: '6px 6px 0 #000' }}>
          CASE #02 · 桌面黑猫案
        </div>

        <div style={{ position: 'relative', marginTop: 42, width: 780, height: 780, border: `6px solid ${GOLD}`, backgroundColor: '#000', boxShadow: '12px 12px 0 #000, 0 0 42px rgba(255,209,102,0.22)', overflow: 'hidden' }}>
          <OffthreadVideo src={staticFile('demos/kurocat/wake-pet.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, left: 20, padding: '6px 14px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900 }}>
            ● REC · REAL DEMO
          </div>
        </div>

        <div style={{ marginTop: 38, display: 'flex', gap: 14 }}>
          {stages.map((s, i) => (
            <div
              key={s}
              style={{
                padding: '12px 18px',
                backgroundColor: i === stageIdx ? '#F4F1E8' : '#111827',
                color: i === stageIdx ? BG : MUTED,
                border: `3px solid ${i === stageIdx ? GOLD : '#334155'}`,
                fontFamily: theme.fonts.sans,
                fontSize: 24,
                fontWeight: 900,
                boxShadow: '4px 4px 0 #000',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Act2KuroCatWhaleDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 210 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 155, left: 44, right: 105, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${clampInterpolate(pop, [0, 1], [0.9, 1])})` }}>
        <div style={{ position: 'relative', width: 690, height: 1210, border: `6px solid ${CRIMSON}`, backgroundColor: '#000', boxShadow: '12px 12px 0 #000', overflow: 'hidden' }}>
          <OffthreadVideo src={staticFile('demos/kurocat/whale-demo.mp4')} muted startFrom={45} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 2px, transparent 2px, transparent 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 22, left: 22, padding: '8px 16px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900 }}>
            ● REC · 鲸鱼娘实机演示
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Act2KuroCatPrivacyAndSize: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dots = Math.min(8, Math.floor(clampInterpolate(frame, [10, 62], [0, 8])));
  const shieldPop = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 13, stiffness: 240 } });
  const comparePop = spring({ frame: Math.max(0, frame - 95), fps, config: { damping: 14, stiffness: 220 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 195, left: 44, right: 105, display: 'flex', flexDirection: 'column', gap: 36 }}>
        {/* 上半：输密码自动闭眼微交互模拟 */}
        <div style={{ padding: '32px 34px', backgroundColor: '#101726', border: `4px solid ${GOLD}`, boxShadow: '10px 10px 0 #000' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: theme.fonts.mono, fontSize: 26, fontWeight: 900, color: GOLD }}>
              <Lock size={28} color={GOLD} />
              <span>PASSWORD FIELD DETECTED</span>
            </div>
            <div style={{ padding: '6px 14px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.mono, fontSize: 20, fontWeight: 900, transform: `scale(${clampInterpolate(shieldPop, [0, 1], [0.6, 1])})` }}>
              自动闭眼 ✓
            </div>
          </div>

          <div style={{ marginTop: 26, padding: '22px 26px', backgroundColor: '#050811', border: '3px solid #334155', fontFamily: theme.fonts.mono, fontSize: 48, fontWeight: 900, color: WHITE, letterSpacing: 14 }}>
            {'•'.repeat(dots)}
            <span style={{ color: GOLD }}>_</span>
          </div>
          <div style={{ marginTop: 20, fontFamily: theme.fonts.sans, fontSize: 32, fontWeight: 900, color: '#CBD5E1' }}>
            输入密码时小猫瞬间捂眼 · 零窥屏风险
          </div>
        </div>

        {/* 下半：体积与性能对比卡 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, transform: `translateY(${clampInterpolate(comparePop, [0, 1], [40, 0])}px)`, opacity: clampInterpolate(comparePop, [0, 1], [0, 1]) }}>
          <div style={{ padding: '26px 30px', backgroundColor: '#111827', border: '3px solid #475569', boxShadow: '8px 8px 0 #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: 20, color: MUTED }}>传统桌面宠物</div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 36, fontWeight: 900, color: MUTED, textDecoration: 'line-through', marginTop: 4 }}>动辄 200+ MB · 吃内存收费</div>
            </div>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 42, fontWeight: 900, color: CRIMSON }}>✕</span>
          </div>

          <div style={{ padding: '30px 30px', backgroundColor: '#F4F1E8', border: `4px solid ${BG}`, boxShadow: `10px 10px 0 ${CRIMSON}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: CRIMSON }}>RUST + TAURI V2 打造</div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 46, fontWeight: 900, color: BG, marginTop: 4 }}>仅 2.4 MB · 丝滑零卡顿</div>
            </div>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 48, fontWeight: 900, color: CRIMSON }}>✓</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================= ACT 3: CASE #01 VIctory (1883 - 2605) ================= */
const Act3VictoryStars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stars = Math.round(clampInterpolate(frame, [0, 75], [800, 13672]));
  const chartProg = clampInterpolate(frame, [10, 90], [0, 1]);
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 195, left: 44, right: 105, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${clampInterpolate(pop, [0, 1], [0.9, 1])})` }}>
        <div style={{ padding: '10px 26px', backgroundColor: CRIMSON, color: WHITE, fontFamily: theme.fonts.mono, fontSize: 28, fontWeight: 900, letterSpacing: 3, boxShadow: '6px 6px 0 #000' }}>
          CASE #01 · GLOBAL TOP 1
        </div>
        <div style={{ marginTop: 46, fontFamily: theme.fonts.mono, fontSize: 124, fontWeight: 900, color: GOLD, lineHeight: 1.0, textShadow: '0 0 36px rgba(255,209,102,0.45), 8px 8px 0 #000' }}>
          +{stars.toLocaleString()}★
        </div>
        <div style={{ marginTop: 14, fontFamily: theme.fonts.mono, fontSize: 36, fontWeight: 900, color: WHITE }}>
          Marvisak / VIctory
        </div>

        {/* 像素飙升折线图 */}
        <div style={{ marginTop: 64, width: '100%', padding: '30px', backgroundColor: '#0E1525', border: `4px solid ${CRIMSON}`, boxShadow: '10px 10px 0 #000' }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: MUTED, marginBottom: 16 }}>
            7-DAY STAR VELOCITY // 全球榜首屠榜曲线
          </div>
          <svg width="820" height="320" viewBox="0 0 820 320">
            {[60, 140, 220, 290].map((y) => (
              <line key={y} x1="0" y1={y} x2="820" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            ))}
            <path
              d="M 20 285 L 150 265 L 290 230 L 430 175 L 580 105 L 780 28"
              fill="none"
              stroke={CRIMSON}
              strokeWidth="10"
              strokeDasharray="1000"
              strokeDashoffset={1000 * (1 - chartProg)}
            />
            <circle cx="780" cy="28" r="14" fill={GOLD} opacity={chartProg > 0.9 ? 1 : 0} />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Act3VictoryClueFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 200 } });
  const s2 = spring({ frame: Math.max(0, frame - 68), fps, config: { damping: 14, stiffness: 200 } });
  const s3 = spring({ frame: Math.max(0, frame - 135), fps, config: { damping: 14, stiffness: 200 } });
  const line1 = clampInterpolate(frame, [38, 70], [1, 0]);
  const line2 = clampInterpolate(frame, [105, 138], [1, 0]);

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 190, left: 44, right: 105, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 26, fontWeight: 900, color: CRIMSON, letterSpacing: 4 }}>
          DEDUCTION // 实时指令翻译原理
        </div>

        {/* Node 1 */}
        <div style={{ marginTop: 44, width: '100%', padding: '28px 32px', backgroundColor: '#111827', border: '4px solid #475569', boxShadow: '8px 8px 0 #000', opacity: clampInterpolate(s1, [0, 1], [0, 1]), transform: `translateY(${clampInterpolate(s1, [0, 1], [30, 0])}px)` }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, color: CRIMSON, fontWeight: 900 }}>STEP 01 · 主机独占墙</div>
          <div style={{ marginTop: 8, fontFamily: theme.fonts.sans, fontSize: 40, fontWeight: 900, color: WHITE }}>GTA 6 仅支持游戏主机 · PC 打不开</div>
        </div>

        <svg width="80" height="86" viewBox="0 0 80 86">
          <line x1="40" y1="0" x2="40" y2="86" stroke={CRIMSON} strokeWidth="8" strokeDasharray="90" strokeDashoffset={90 * line1} />
        </svg>

        {/* Node 2 */}
        <div style={{ width: '100%', padding: '30px 32px', backgroundColor: '#171219', border: `4px solid ${GOLD}`, boxShadow: '10px 10px 0 #000', opacity: clampInterpolate(s2, [0, 1], [0, 1]), transform: `scale(${clampInterpolate(s2, [0, 1], [0.9, 1])})` }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, color: GOLD, fontWeight: 900 }}>STEP 02 · VICTORY 翻译引擎</div>
          <div style={{ marginTop: 8, fontFamily: theme.fonts.sans, fontSize: 40, fontWeight: 900, color: WHITE }}>实时把主机底层指令翻译给 PC</div>
        </div>

        <svg width="80" height="86" viewBox="0 0 80 86">
          <line x1="40" y1="0" x2="40" y2="86" stroke={GOLD} strokeWidth="8" strokeDasharray="90" strokeDashoffset={90 * line2} />
        </svg>

        {/* Node 3 */}
        <div style={{ width: '100%', padding: '30px 32px', backgroundColor: '#F4F1E8', border: `4px solid ${BG}`, boxShadow: `10px 10px 0 ${CRIMSON}`, opacity: clampInterpolate(s3, [0, 1], [0, 1]), transform: `translateY(${clampInterpolate(s3, [0, 1], [30, 0])}px)` }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, color: CRIMSON, fontWeight: 900 }}>STEP 03 · 破壁结果</div>
          <div style={{ marginTop: 8, fontFamily: theme.fonts.sans, fontSize: 42, fontWeight: 900, color: BG }}>普通电脑直接硬核试跑！</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================= ACT 4: 结案收尾 (2605 - 2850) ================= */
const Act4CaseClosedOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDoorClose = frame >= 180;
  const stampPop = spring({ frame: Math.max(0, frame - 186), fps, config: { damping: 11, stiffness: 260 } });

  const list = [
    { rank: '#03', repo: 'os6/nospeaker', desc: 'Mac 触控板直接震动唱歌 · ★1,982' },
    { rank: '#02', repo: 'qianyiai/KuroCat', desc: '2.4MB 桌面小黑猫 + 鲸鱼娘 · ★1,735' },
    { rank: '#01', repo: 'Marvisak/VIctory', desc: '把 GTA 6 搬上普通 PC · ★13,672' },
  ];

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div style={{ position: 'absolute', top: 190, left: 44, right: 105 }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 26, fontWeight: 900, color: GOLD, letterSpacing: 4 }}>
          FILE.048 // 收藏防走丢清单
        </div>
        <div style={{ marginTop: 12, fontFamily: theme.fonts.sans, fontSize: 66, fontWeight: 900, color: WHITE, textShadow: '6px 6px 0 #000' }}>
          本周 GitHub 三大神作
        </div>
        <div style={{ marginTop: 46, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {list.map((item, idx) => {
            const p = spring({ frame: Math.max(0, frame - idx * 10), fps, config: { damping: 14, stiffness: 220 } });
            return (
              <div
                key={item.repo}
                style={{
                  padding: '28px 30px',
                  backgroundColor: '#F4F1E8',
                  border: `4px solid ${BG}`,
                  boxShadow: `10px 10px 0 ${idx === 2 ? CRIMSON : GOLD}`,
                  transform: `translateX(${clampInterpolate(p, [0, 1], [-80, 0])}px)`,
                  opacity: clampInterpolate(p, [0, 1], [0, 1]),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: 32, fontWeight: 900, color: CRIMSON }}>{item.rank}</span>
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: 40, fontWeight: 900, color: BG }}>{item.repo}</span>
                </div>
                <div style={{ marginTop: 8, fontFamily: theme.fonts.sans, fontSize: 30, fontWeight: 800, color: '#334155' }}>
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 合规声明 */}
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center', fontFamily: theme.fonts.mono, fontSize: 22, color: MUTED }}>
        内容由 AI 辅助生成 · 开源素材源自对应 GitHub 仓库
      </div>

      {/* 最后 2 秒红砖结案印章覆盖 */}
      {isDoorClose ? (
        <AbsoluteFill style={{ backgroundColor: 'rgba(5,7,13,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 58 }}>
          <div
            style={{
              padding: '26px 56px',
              border: `8px solid ${CRIMSON}`,
              color: CRIMSON,
              fontFamily: theme.fonts.mono,
              fontSize: 82,
              fontWeight: 900,
              letterSpacing: 6,
              transform: `rotate(-8deg) scale(${clampInterpolate(stampPop, [0, 1], [2.4, 1])})`,
              boxShadow: `0 0 40px rgba(230,57,70,0.45)`,
            }}
          >
            CASE CLOSED
          </div>
          <div style={{ marginTop: 34, fontFamily: theme.fonts.sans, fontSize: 38, fontWeight: 900, color: GOLD }}>
            关注我 · 下周继续破案 GitHub
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const WeeklyDetectiveFull: React.FC = () => {
  const frame = useCurrentFrame();
  const cues = useMemo(() => buildSubtitleCues(), []);

  const a0OpenEnd = segMap.a0_preview.startF;
  const a0PrevStart = segMap.a0_preview.startF;
  const a0PrevDur = segMap.a0_punch.startF - a0PrevStart;
  const p1 = Math.round(a0PrevDur * 0.32);
  const p2 = Math.round(a0PrevDur * 0.32);
  const p3 = a0PrevDur - p1 - p2;

  const a0PunchStart = segMap.a0_punch.startF;
  const a0PunchTotal = segMap.a1_c3_hook.startF - a0PunchStart;
  const a0KinDur = Math.round(a0PunchTotal * 0.5);
  const a0IpDur = a0PunchTotal - a0KinDur;

  const c3HookStart = segMap.a1_c3_hook.startF;
  const c3ClueStart = segMap.a1_c3_clue.startF;
  const c3PunchStart = segMap.a1_c3_punch.startF;
  const c3EvStart = segMap.a1_c3_ev.startF;

  const c2CatStart = segMap.a2_c2_cat.startF;
  const c2WhaleStart = segMap.a2_c2_whale.startF;
  const c2TechStart = segMap.a2_c2_tech.startF;
  const c2EvStart = segMap.a2_c2_ev.startF;

  const c1HookStart = segMap.a3_c1_hook.startF;
  const c1IpDur = 36;
  const c1ClueStart = segMap.a3_c1_clue.startF;
  const c1PunchStart = segMap.a3_c1_punch.startF;
  const c1EvStart = segMap.a3_c1_ev.startF;

  const outroStart = segMap.a4_outro.startF;
  const outroDur = WEEKLY_DETECTIVE_FULL_FRAMES - outroStart;

  const hideBadge =
    frame < 28 ||
    (frame >= a0PunchStart && frame < c3HookStart) ||
    (frame >= c3PunchStart && frame < c3EvStart) ||
    (frame >= c1HookStart && frame < c1HookStart + c1IpDur) ||
    (frame >= c1PunchStart && frame < c1EvStart) ||
    frame >= outroStart + 180;

  const hudTag =
    frame < c3HookStart
      ? 'GITHUB WEEKLY'
      : frame < c2CatStart
        ? 'CASE #03 · NOSPEAKER'
        : frame < c1HookStart
          ? 'CASE #02 · KUROCAT'
          : frame < outroStart
            ? 'CASE #01 · VICTORY'
            : 'CASE CLOSED';

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: 'hidden' }}>
      {/* ACT 0: 黄金开场 */}
      <Sequence from={0} durationInFrames={a0OpenEnd}><Act0Open /></Sequence>
      <Sequence from={a0PrevStart} durationInFrames={p1}><Act1Case3ClueBoard /></Sequence>
      <Sequence from={a0PrevStart + p1} durationInFrames={p2}><Act2KuroCatRealMonitor /></Sequence>
      <Sequence from={a0PrevStart + p1 + p2} durationInFrames={p3}><Act3VictoryStars /></Sequence>
      <Sequence from={a0PunchStart} durationInFrames={a0KinDur}>
        <CrimsonKineticShot badge="GITHUB OPEN SOURCE" line1="全部免费开源" />
      </Sequence>
      <Sequence from={a0PunchStart + a0KinDur} durationInFrames={a0IpDur}>
        <HeroIpFlashShot />
      </Sequence>

      {/* ACT 1: CASE #03 nospeaker */}
      <Sequence from={c3HookStart} durationInFrames={c3ClueStart - c3HookStart}><Act1Case3LaptopHook /></Sequence>
      <Sequence from={c3ClueStart} durationInFrames={c3PunchStart - c3ClueStart}><Act1Case3ClueBoard /></Sequence>
      <Sequence from={c3PunchStart} durationInFrames={c3EvStart - c3PunchStart}>
        <CrimsonKineticShot badge="CASE #03 // TRUTH" line1="不用外放喇叭" line2="触控板直接唱歌！" />
      </Sequence>
      <Sequence from={c3EvStart} durationInFrames={c2CatStart - c3EvStart}>
        <FisheyeVerifiedShot
          repo="os6/nospeaker"
          imageSrc="images/top10/rank-3.png"
          stars={1982}
          stamp="MIT · 100% FREE"
          summary="Mac 触控板震动马达直接发声"
          caseNum="CASE #03"
        />
      </Sequence>

      {/* ACT 2: CASE #02 KuroCat */}
      <Sequence from={c2CatStart} durationInFrames={c2WhaleStart - c2CatStart}><Act2KuroCatRealMonitor /></Sequence>
      <Sequence from={c2WhaleStart} durationInFrames={c2TechStart - c2WhaleStart}><Act2KuroCatWhaleDemo /></Sequence>
      <Sequence from={c2TechStart} durationInFrames={c2EvStart - c2TechStart}><Act2KuroCatPrivacyAndSize /></Sequence>
      <Sequence from={c2EvStart} durationInFrames={c1HookStart - c2EvStart}>
        <FisheyeVerifiedShot
          repo="qianyiai/KuroCat"
          imageSrc="images/top10/rank-6.png"
          stars={1735}
          stamp="WIN / MAC / ANDROID"
          summary="2.4MB 桌面打字黑猫 · 永久免费"
          caseNum="CASE #02"
        />
      </Sequence>

      {/* ACT 3: CASE #01 VIctory */}
      <Sequence from={c1HookStart} durationInFrames={c1IpDur}>
        <HeroIpFlashShot label="本周第一 · 全球登顶！" />
      </Sequence>
      <Sequence from={c1HookStart + c1IpDur} durationInFrames={c1ClueStart - (c1HookStart + c1IpDur)}>
        <Act3VictoryStars />
      </Sequence>
      <Sequence from={c1ClueStart} durationInFrames={c1PunchStart - c1ClueStart}><Act3VictoryClueFlow /></Sequence>
      <Sequence from={c1PunchStart} durationInFrames={c1EvStart - c1PunchStart}>
        <CrimsonKineticShot badge="GLOBAL TOP 1" line1="官方还没出 PC 版？" line2="开源极客自己搬！" />
      </Sequence>
      <Sequence from={c1EvStart} durationInFrames={outroStart - c1EvStart}>
        <FisheyeVerifiedShot
          repo="Marvisak/VIctory"
          imageSrc="images/top10/rank-1.png"
          stars={13672}
          stamp="GLOBAL TOP 1"
          summary="一周狂飙 13,672★ · 把 GTA 6 搬上 PC"
          caseNum="CASE #01"
        />
      </Sequence>

      {/* ACT 4: 结案收尾 */}
      <Sequence from={outroStart} durationInFrames={outroDur}><Act4CaseClosedOutro /></Sequence>

      <DetectiveHud frame={frame} tag={hudTag} hideBadge={hideBadge} />
      <PixelSubtitleBar cues={cues} frame={frame} />

      <Audio src={staticFile('audio/weekly-detective-full.mp3')} volume={0.95} />
      <Audio src={staticFile('sfx/detective-acid-jazz-112-full.wav')} volume={0.22} />
    </AbsoluteFill>
  );
};
