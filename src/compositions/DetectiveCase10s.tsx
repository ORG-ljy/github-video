import React from 'react';
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
import { clampInterpolate } from '../kit/motion';
import { theme } from '../kit/theme';

export const DETECTIVE_10S_FRAMES = 386; // 12.87s @ 30fps (aligned to 112 BPM Acid Jazz)

// Strict DESIGN.md palette (Conan-inspired Detective Pixel Case-File)
const BG = '#080C16';
const CRIMSON = '#E63946';
const GOLD = '#FFD166';
const WHITE = '#F8FAFC';
const MUTED = '#94A3B8';

// Exact subtitle cues aligned to public/audio/weekly-detective-10s.timeline.json
// Rule: hidden during S3a full-screen Kinetic Typography (frames 289-337) to prevent overlap!
const SUBTITLES: Array<{ startFrame: number; endFrame: number; text: string }> = [
  { startFrame: 0, endFrame: 56, text: '本周 GitHub 飙升榜' },
  { startFrame: 57, endFrame: 122, text: '冒出了三个离谱的开源神作！' },
  { startFrame: 125, endFrame: 176, text: '一个让触控板开口唱歌' },
  { startFrame: 177, endFrame: 224, text: '一个在桌面养打字小黑猫' },
  { startFrame: 225, endFrame: 288, text: '还有一个把 GTA 6 搬上了电脑！' },
  // 289 - 337: Full-screen Crimson Kinetic Typography ("全部免费开源") -> subtitle hidden!
  { startFrame: 338, endFrame: 384, text: '档案开启，马上揭晓！' },
];

/** 午夜侦探蓝图暗网格（严格零散景圆圈） */
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
          'radial-gradient(circle at 50% 42%, rgba(230,57,70,0.06) 0%, rgba(8,12,22,0) 58%, rgba(4,6,12,0.78) 100%)',
      }}
    />
  </AbsoluteFill>
);

/** 左上角红色像素钥匙孔角标 + 顶部极细进度条 */
const DetectiveHud: React.FC<{ frame: number; hideBadge?: boolean }> = ({
  frame,
  hideBadge = false,
}) => {
  const progress = Math.min(1, frame / DETECTIVE_10S_FRAMES);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: 'rgba(255,255,255,0.08)',
          zIndex: 60,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: CRIMSON,
            boxShadow: `0 0 12px ${CRIMSON}`,
          }}
        />
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
            <div style={{ fontSize: 18, fontWeight: 900, color: CRIMSON, letterSpacing: 2 }}>
              FILE.048
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1 }}>
              GITHUB WEEKLY
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

/** 底部清晰粗黑字幕（单行 <= 14 字，避开抖音右侧/底部遮挡区） */
const PixelSubtitleBar: React.FC<{ frame: number }> = ({ frame }) => {
  const cue = SUBTITLES.find((c) => frame >= c.startFrame && frame <= c.endFrame);
  if (!cue) return null;
  const local = frame - cue.startFrame;
  const opacity = clampInterpolate(local, [0, 4], [0, 1]);
  const ty = clampInterpolate(local, [0, 5], [10, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 44,
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
          fontSize: 48,
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

/** S1 (0-129): 红砖钥匙孔推镜开场 (0-26) + 本周 GitHub 飙升榜三大悬案盖章落位 (26-129) */
const Shot1WeeklyCaseOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Keyhole zoom-in right on Beat 2 (f=16)
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
        <div
          style={{
            display: 'inline-block',
            padding: '8px 20px',
            backgroundColor: CRIMSON,
            color: WHITE,
            fontFamily: theme.fonts.mono,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 3,
            boxShadow: '5px 5px 0 #000',
          }}
        >
          2026 W48 // TOP 3 ARCHIVE
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: theme.fonts.sans,
            fontSize: 78,
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.12,
            textShadow: '6px 6px 0 #000',
          }}
        >
          GitHub 本周
          <br />
          <span style={{ color: GOLD }}>三大离谱神作</span>
        </div>

        {/* 3 张像素悬案档案条：精准踩 Beat 4(48) / Beat 5(64) / Beat 6(80) 弹入 */}
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
                  transform: `translateX(${clampInterpolate(p, [0, 1], [-120, 0])}px) scale(${clampInterpolate(p, [0, 1], [0.9, 1])})`,
                  opacity: clampInterpolate(p, [0, 1], [0, 1]),
                }}
              >
                <div>
                  <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: isTop1 ? GOLD : CRIMSON }}>
                    {c.rank} · {c.name}
                  </div>
                  <div style={{ marginTop: 6, fontFamily: theme.fonts.sans, fontSize: 40, fontWeight: 900, color: WHITE }}>
                    {c.tag}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: 30,
                    fontWeight: 900,
                    color: GOLD,
                    padding: '8px 16px',
                    backgroundColor: 'rgba(8,12,22,0.85)',
                    border: `2px solid ${GOLD}`,
                  }}
                >
                  {c.stars}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 开场 0-28 帧：红砖像素钥匙孔推镜 */}
      {frame < 29 ? (
        <AbsoluteFill
          style={{
            backgroundColor: '#05070D',
            opacity: keyholeOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${keyholeZoom})`,
            zIndex: 45,
          }}
        >
          <svg width="460" height="560" viewBox="0 0 230 280">
            <g fill="#8B2635" stroke="#05070D" strokeWidth="3">
              <rect x="45" y="10" width="140" height="24" />
              <rect x="25" y="34" width="180" height="24" />
              <rect x="15" y="58" width="200" height="24" />
              <rect x="15" y="82" width="200" height="24" />
              <rect x="25" y="106" width="180" height="24" />
              <rect x="40" y="130" width="150" height="24" />
              <rect x="35" y="154" width="160" height="24" />
              <rect x="30" y="178" width="170" height="24" />
              <rect x="25" y="202" width="180" height="24" />
              <rect x="20" y="226" width="190" height="24" />
            </g>
            <circle cx="115" cy="94" r="52" fill="#05070D" />
            <polygon points="88,132 142,132 162,252 68,252" fill="#05070D" />
            <circle cx="115" cy="94" r="52" fill="none" stroke={CRIMSON} strokeWidth="4" />
          </svg>
          <div
            style={{
              position: 'absolute',
              fontFamily: theme.fonts.mono,
              fontSize: 54,
              fontWeight: 900,
              color: GOLD,
              letterSpacing: 6,
              textShadow: '4px 4px 0 #000',
              transform: `scale(${clampInterpolate(filePop, [0, 1], [0.5, 1])})`,
            }}
          >
            FILE.048
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** S2a (129-177): 快切 1 —— nospeaker 像素发光放大镜聚焦触控板唱歌 */
const Shot2aTrackpadSing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 220 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div
        style={{
          position: 'absolute',
          top: 210,
          left: 44,
          right: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${clampInterpolate(pop, [0, 1], [0.85, 1])})`,
        }}
      >
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#111827',
            border: `3px solid ${CRIMSON}`,
            fontFamily: theme.fonts.mono,
            fontSize: 28,
            fontWeight: 900,
            color: GOLD,
            boxShadow: '6px 6px 0 #000',
          }}
        >
          EVIDENCE #03 · os6/nospeaker
        </div>

        {/* 像素发光放大镜 */}
        <div
          style={{
            marginTop: 70,
            width: 620,
            height: 620,
            borderRadius: 999,
            border: `14px solid ${GOLD}`,
            backgroundColor: '#0A1020',
            boxShadow: '0 0 55px rgba(255,209,102,0.35), inset 0 0 40px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 390,
              height: 240,
              border: `4px solid ${WHITE}`,
              backgroundColor: '#131C31',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateY(${Math.sin(frame * 1.5) * 4}px)`,
            }}
          >
            <div style={{ fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 900, color: GOLD, letterSpacing: 3 }}>
              HAPTIC MOTOR
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 20, height: 96 }}>
              {Array.from({ length: 13 }, (_, i) => {
                const bh = 20 + Math.abs(Math.sin(frame * 0.6 + i * 0.8)) * 76;
                return <div key={i} style={{ width: 13, height: bh, backgroundColor: i % 3 === 0 ? CRIMSON : GOLD }} />;
              })}
            </div>
          </div>
          <div style={{ marginTop: 24, fontFamily: theme.fonts.sans, fontSize: 34, fontWeight: 900, color: WHITE }}>
            触控板直接震动发声
          </div>
        </div>

        <div
          style={{
            marginTop: 64,
            padding: '18px 30px',
            backgroundColor: '#F4F1E8',
            color: '#080C16',
            border: '4px solid #080C16',
            boxShadow: `8px 8px 0 ${CRIMSON}`,
            fontFamily: theme.fonts.sans,
            fontSize: 38,
            fontWeight: 900,
          }}
        >
          不用喇叭 · 电脑也能开口唱
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** S2b (177-225): 快切 2 —— KuroCat 真实实机 Demo 嵌入 HD-2D 像素监视器 */
const Shot2bKuroCatRealDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 44,
          right: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${clampInterpolate(pop, [0, 1], [0.88, 1])})`,
        }}
      >
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#111827',
            border: `3px solid ${CRIMSON}`,
            fontFamily: theme.fonts.mono,
            fontSize: 28,
            fontWeight: 900,
            color: GOLD,
            boxShadow: '6px 6px 0 #000',
          }}
        >
          EVIDENCE #02 · qianyiai/KuroCat
        </div>

        {/* 像素侦探监视器框 + 真实 README 实机视频 wake-pet.mp4 + 微 CRT 扫描线统一世界观 */}
        <div
          style={{
            position: 'relative',
            marginTop: 54,
            width: 740,
            height: 740,
            border: `6px solid ${GOLD}`,
            backgroundColor: '#000',
            boxShadow: '12px 12px 0 #000, 0 0 40px rgba(255,209,102,0.22)',
            overflow: 'hidden',
          }}
        >
          <OffthreadVideo
            src={staticFile('demos/kurocat/wake-pet.mp4')}
            muted
            startFrom={30}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* 极轻 CRT 像素扫线消除实拍与像素框割裂感 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 5px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              padding: '6px 14px',
              backgroundColor: CRIMSON,
              color: WHITE,
              fontFamily: theme.fonts.mono,
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            ● REC · REAL DEMO
          </div>
        </div>

        <div
          style={{
            marginTop: 48,
            padding: '18px 30px',
            backgroundColor: '#F4F1E8',
            color: '#080C16',
            border: '4px solid #080C16',
            boxShadow: `8px 8px 0 ${GOLD}`,
            fontFamily: theme.fonts.sans,
            fontSize: 38,
            fontWeight: 900,
          }}
        >
          3D 桌面打字黑猫 · 仅 2.4 MB
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** S2c (225-289): 快切 3 —— VIctory (+13,672★) 主机越狱 PC 跑 GTA 6 线索对比 */
const Shot2cVictoryGta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 230 } });
  const stars = Math.round(clampInterpolate(frame, [0, 38], [1000, 13672]));

  return (
    <AbsoluteFill>
      <DetectiveGridBg />
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 44,
          right: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${clampInterpolate(pop, [0, 1], [0.88, 1])})`,
        }}
      >
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: CRIMSON,
            color: WHITE,
            fontFamily: theme.fonts.mono,
            fontSize: 28,
            fontWeight: 900,
            boxShadow: '6px 6px 0 #000',
          }}
        >
          EVIDENCE #01 · GLOBAL TOP 1
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: theme.fonts.mono,
            fontSize: 120,
            fontWeight: 900,
            color: GOLD,
            lineHeight: 1.0,
            textShadow: `0 0 36px rgba(255,209,102,0.45), 8px 8px 0 #000`,
          }}
        >
          +{stars.toLocaleString()}★
        </div>
        <div style={{ marginTop: 12, fontFamily: theme.fonts.mono, fontSize: 34, fontWeight: 900, color: WHITE }}>
          Marvisak / VIctory
        </div>

        {/* 侦探红线对比卡：主机独占 -> 搬上普通 PC */}
        <div style={{ marginTop: 64, width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              padding: '28px 32px',
              backgroundColor: '#111827',
              border: '3px solid #475569',
              boxShadow: '8px 8px 0 #000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: theme.fonts.sans, fontSize: 36, fontWeight: 900, color: MUTED, textDecoration: 'line-through' }}>
              GTA 6 主机独占 · 电脑打不开
            </span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 36, fontWeight: 900, color: CRIMSON }}>✕</span>
          </div>

          <div
            style={{
              padding: '32px 32px',
              backgroundColor: '#F4F1E8',
              border: '4px solid #080C16',
              boxShadow: `10px 10px 0 ${CRIMSON}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: theme.fonts.sans, fontSize: 40, fontWeight: 900, color: '#080C16' }}>
              实时指令翻译 · 强行搬上 PC！
            </span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 40, fontWeight: 900, color: CRIMSON }}>✓</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** S3 (289-386): 朱红高反差大字撞击 (289-338) + 魔改版 A 极客耳机少年闪电亮相 (338-386) */
const Shot3PunchAndIpReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isIpReveal = frame >= 49; // local 49 = global 338 (Beat 22!)
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 280 } });

  if (isIpReveal) {
    const local = frame - 49;
    const scale = clampInterpolate(local, [0, 6, 48], [1.14, 1.0, 1.04]);
    const flash = clampInterpolate(local, [0, 6], [0.95, 0]);
    return (
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <Img
          src={staticFile('images/ip/remix-a-hero.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
        />
        {/* 顶部钥匙孔动态写入 FILE.048 */}
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
        <AbsoluteFill style={{ backgroundColor: '#FFFFFF', opacity: flash, pointerEvents: 'none' }} />
      </AbsoluteFill>
    );
  }

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
          fontSize: 32,
          fontWeight: 900,
          color: '#080C16',
          letterSpacing: 5,
          padding: '10px 24px',
          backgroundColor: GOLD,
          boxShadow: '6px 6px 0 #080C16',
        }}
      >
        GITHUB OPEN SOURCE
      </div>
      <div
        style={{
          marginTop: 34,
          fontFamily: theme.fonts.sans,
          fontSize: 112,
          fontWeight: 900,
          color: WHITE,
          textAlign: 'center',
          lineHeight: 1.12,
          textShadow: '9px 9px 0 #080C16',
          transform: `scale(${clampInterpolate(pop, [0, 1], [0.65, 1])})`,
        }}
      >
        全部免费开源
      </div>
    </AbsoluteFill>
  );
};

export const DetectiveCase10s: React.FC = () => {
  const frame = useCurrentFrame();
  const isKinetic = frame >= 289 && frame < 338;
  const isIpReveal = frame >= 338;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: 'hidden' }}>
      {/* S1: 0-129 (Beat 1 -> Beat 9) */}
      <Sequence from={0} durationInFrames={129}>
        <Shot1WeeklyCaseOpen />
      </Sequence>

      {/* S2a: 129-177 (Beat 9 -> Beat 12) nospeaker */}
      <Sequence from={129} durationInFrames={48}>
        <Shot2aTrackpadSing />
      </Sequence>

      {/* S2b: 177-225 (Beat 12 -> Beat 15) KuroCat REAL DEMO */}
      <Sequence from={177} durationInFrames={48}>
        <Shot2bKuroCatRealDemo />
      </Sequence>

      {/* S2c: 225-289 (Beat 15 -> Beat 19) VIctory GTA 6 */}
      <Sequence from={225} durationInFrames={64}>
        <Shot2cVictoryGta />
      </Sequence>

      {/* S3: 289-386 (Beat 19 -> End) Crimson Kinetic + Remix A IP Flash */}
      <Sequence from={289} durationInFrames={97}>
        <Shot3PunchAndIpReveal />
      </Sequence>

      <DetectiveHud frame={frame} hideBadge={frame < 28 || isKinetic || isIpReveal} />
      <PixelSubtitleBar frame={frame} />

      {/* Audio: 48kHz zero-clip voice + original 112 BPM Detective Acid Jazz BGM + clean beat-synced SFX */}
      <Audio src={staticFile('audio/weekly-detective-10s.mp3')} volume={0.95} />
      <Audio src={staticFile('sfx/detective-acid-jazz-112.wav')} volume={0.24} />

      {/* Pre-0.5s retention pop on Beat 1 (f=4) */}
      <Sequence from={4} durationInFrames={16}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.32} />
      </Sequence>
      {/* Beat 4/5/6 case cards stamp pops */}
      <Sequence from={48} durationInFrames={14}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.25} />
      </Sequence>
      <Sequence from={64} durationInFrames={14}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.25} />
      </Sequence>
      <Sequence from={80} durationInFrames={14}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.28} />
      </Sequence>
      {/* Beat 9 / 12 / 15 fast-cut transitions */}
      <Sequence from={128} durationInFrames={18}>
        <Audio src={staticFile('sfx/whoosh.wav')} volume={0.26} />
      </Sequence>
      <Sequence from={176} durationInFrames={16}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.30} />
      </Sequence>
      <Sequence from={224} durationInFrames={18}>
        <Audio src={staticFile('sfx/whoosh.wav')} volume={0.26} />
      </Sequence>
      {/* Beat 19 crimson kinetic + Beat 22 IP lightning flash */}
      <Sequence from={289} durationInFrames={16}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.36} />
      </Sequence>
      <Sequence from={338} durationInFrames={18}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.40} />
      </Sequence>
    </AbsoluteFill>
  );
};
