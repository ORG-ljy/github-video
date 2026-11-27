import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  Cpu,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
} from 'lucide-react';
import { clampInterpolate } from '../kit/motion';
import { theme } from '../kit/theme';
import { FisheyeCanvas } from '../kit/fisheye/FisheyeCanvas';

const PALETTE = {
  night: '#0A0D14',
  nightCard: 'rgba(20, 25, 36, 0.88)',
  paper: '#F5F2EB',
  paperCard: '#FFFFFF',
  ink: '#1A1D24',
  inkMuted: '#5C6473',
  amber: '#F5B82E',
  coral: '#FF4D4F',
  cyan: '#22D3EE',
  emerald: '#10B981',
  claude: '#D97757',
  white: '#F8FAFC',
};

const CAPTIONS: Array<{
  startMs: number;
  endMs: number;
  parts: Array<{ text: string; color?: string }>;
}> = [
  {
    startMs: 0,
    endMs: 3400,
    parts: [
      { text: '一条十公里高速，其实就' },
      { text: '一个收费站堵车', color: PALETTE.amber },
    ],
  },
  {
    startMs: 3400,
    endMs: 7150,
    parts: [
      { text: '以前想提速，居然得把' },
      { text: '整条路全拆了重修', color: PALETTE.coral },
    ],
  },
  {
    startMs: 7311,
    endMs: 10900,
    parts: [
      { text: 'GitHub 爆火免费神器 ' },
      { text: 'fast-anything', color: PALETTE.cyan },
    ],
  },
  {
    startMs: 10900,
    endMs: 16150,
    parts: [
      { text: '像体检医生，专揪最卡的 ' },
      { text: '5% 零件', color: PALETTE.amber },
    ],
  },
  {
    startMs: 16374,
    endMs: 20500,
    parts: [
      { text: '让 AI 只把这 5% 换成' },
      { text: '赛车级引擎', color: PALETTE.emerald },
    ],
  },
  {
    startMs: 20500,
    endMs: 24550,
    parts: [
      { text: '改完' },
      { text: '自动对账', color: PALETTE.emerald },
      { text: '，结果一模一样绝不出错' },
    ],
  },
  {
    startMs: 24745,
    endMs: 28100,
    parts: [
      { text: '原本等一分钟，现在' },
      { text: '不到两秒跑完', color: PALETTE.amber },
    ],
  },
  {
    startMs: 28100,
    endMs: 30900,
    parts: [
      { text: '省 95% 成本，速度翻 ' },
      { text: '30 多倍！', color: PALETTE.emerald },
    ],
  },
  {
    startMs: 30900,
    endMs: 33600,
    parts: [
      { text: '收藏起来，' },
      { text: '关注看更多狠活', color: PALETTE.amber },
    ],
  },
];

/** 借鉴 vibe-motion/ruler-progress-render：极简自适应物理刻度尺 */
const EditorialRuler: React.FC<{ progress: number; dark: boolean; step: number }> = ({
  progress,
  dark,
  step,
}) => {
  const steps = ['01 痛点类比', '02 实拍神器', '03 AI 原理', '04 提速实测'];
  const fg = dark ? 'rgba(248, 250, 252, 0.72)' : 'rgba(26, 29, 36, 0.72)';
  const tickColor = dark ? 'rgba(248, 250, 252, 0.28)' : 'rgba(26, 29, 36, 0.25)';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        fontFamily: theme.fonts.sans,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 28,
          backgroundColor: dark ? 'rgba(10,13,20,0.6)' : 'rgba(245,242,235,0.85)',
          borderBottom: `1px solid ${tickColor}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${progress * 100}%`,
            backgroundColor: dark ? 'rgba(245, 184, 46, 0.2)' : 'rgba(245, 184, 46, 0.32)',
            borderRight: `3px solid ${PALETTE.amber}`,
          }}
        />
        <svg viewBox="0 0 1080 28" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {Array.from({ length: 55 }, (_, i) => {
            const x = i * 20;
            const major = i % 5 === 0;
            return (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={major ? 14 : 7}
                stroke={tickColor}
                strokeWidth={major ? 1.8 : 1}
              />
            );
          })}
        </svg>
      </div>

      <div
        style={{
          padding: '22px 48px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: fg,
          }}
        >
          GITHUB 狠活深度拆解 · VOL.48
        </div>
        <div
          style={{
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 20,
            fontWeight: 700,
            backgroundColor: dark ? 'rgba(245,184,46,0.16)' : 'rgba(26,29,36,0.08)',
            border: `1px solid ${dark ? 'rgba(245,184,46,0.45)' : 'rgba(26,29,36,0.18)'}`,
            color: dark ? PALETTE.amber : PALETTE.ink,
          }}
        >
          {steps[step]}
        </div>
      </div>
    </div>
  );
};

/** 电影感通透大字字幕（抖音底部安全区上方 Y=1420px） */
const CinemaCaptions: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const active = CAPTIONS.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  if (!active) return null;

  const localFrame = Math.max(0, frame - Math.round((active.startMs / 1000) * fps));
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 260, mass: 0.55 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 1410,
        left: 44,
        right: 44,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: 46,
          fontWeight: 900,
          lineHeight: 1.32,
          textAlign: 'center',
          color: PALETTE.white,
          backgroundColor: dark ? 'rgba(10, 13, 20, 0.72)' : 'rgba(20, 24, 34, 0.88)',
          padding: '14px 30px',
          borderRadius: 18,
          border: '1.5px solid rgba(255,255,255,0.14)',
          boxShadow: '0 14px 36px rgba(0,0,0,0.32)',
          transform: `scale(${clampInterpolate(pop, [0, 1], [0.94, 1])}) translateY(${clampInterpolate(pop, [0, 1], [10, 0])}px)`,
        }}
      >
        {active.parts.map((p, idx) => (
          <span key={idx} style={{ color: p.color || PALETTE.white }}>
            {p.text}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Scene 1 (0-219f): 借鉴 vibe-motion/light-spotlight-render 摆动聚光灯 + 高速收费站生活类比 */
const Scene1SpotlightAnalogy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 钟摆式聚光灯扫过画面
  const swingDeg = Math.sin((frame / fps) * 1.45) * 20;
  const titleIn = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });
  const jamPulse = 0.65 + 0.35 * Math.sin(frame * 0.25);
  const demoIn = spring({
    frame: Math.max(0, frame - 98),
    fps,
    config: { damping: 14, stiffness: 190 },
  });
  const carX = (frame * 6) % 760;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.night,
        fontFamily: theme.fonts.sans,
        overflow: 'hidden',
      }}
    >
      {/* 顶部摆动聚光灯光锥（light-spotlight-render 电影感实现） */}
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="spotBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#F5B82E" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#F5B82E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(540, 20) rotate(${swingDeg})`}>
          <polygon points="-24,0 24,0 440,1450 -440,1450" fill="url(#spotBeam)" />
          <circle cx="0" cy="18" r="14" fill="#FFF7D6" opacity="0.9" />
        </g>
      </svg>

      <div style={{ padding: '210px 60px 0', position: 'relative', zIndex: 5 }}>
        <div
          style={{
            textAlign: 'center',
            opacity: clampInterpolate(titleIn, [0, 1], [0, 1]),
            transform: `translateY(${clampInterpolate(titleIn, [0, 1], [34, 0])}px)`,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontSize: 26,
              fontWeight: 700,
              color: PALETTE.amber,
              letterSpacing: 3,
              marginBottom: 20,
            }}
          >
            先打个生活比方
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: PALETTE.white,
              lineHeight: 1.2,
              textShadow: '0 8px 32px rgba(245, 184, 46, 0.25)',
            }}
          >
            10 公里高速路
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 54,
              fontWeight: 800,
              color: 'rgba(248,250,252,0.86)',
            }}
          >
            其实就 <span style={{ color: PALETTE.coral }}>1 个收费站</span> 堵车
          </div>
        </div>

        {/* 具象高速公路可视化：95% 畅通 vs 5% 堵车收费站 */}
        <div
          style={{
            marginTop: 64,
            backgroundColor: PALETTE.nightCard,
            borderRadius: 24,
            border: '1.5px solid rgba(255,255,255,0.12)',
            padding: '38px 34px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 24,
              fontWeight: 700,
              color: '#94A3B8',
              marginBottom: 18,
            }}
          >
            <span>95% 路段一路畅通</span>
            <span style={{ color: PALETTE.coral }}>5% 收费站堵死</span>
          </div>

          <div
            style={{
              position: 'relative',
              height: 86,
              borderRadius: 16,
              backgroundColor: '#161C28',
              border: '1.5px solid rgba(255,255,255,0.12)',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {/* 畅通路段 + 流动车灯 */}
            <div style={{ width: '82%', position: 'relative', borderRight: '2px dashed rgba(255,255,255,0.2)' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 42,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'repeating-linear-gradient(90deg, rgba(16,185,129,0.5) 0 28px, transparent 28px 56px)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 28,
                  left: carX,
                  width: 48,
                  height: 14,
                  borderRadius: 99,
                  backgroundColor: PALETTE.emerald,
                  boxShadow: '0 0 16px #10B981',
                }}
              />
            </div>

            {/* 5% 堵车收费站 */}
            <div
              style={{
                width: '18%',
                backgroundColor: `rgba(255, 77, 79, ${0.28 * jamPulse + 0.12})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
                color: PALETTE.coral,
              }}
            >
              堵死
            </div>
          </div>

          {/* 荒谬反差：以前居然拆整条路重修 */}
          {frame >= 98 ? (
            <div
              style={{
                marginTop: 32,
                padding: '24px 28px',
                borderRadius: 16,
                backgroundColor: 'rgba(255, 77, 79, 0.12)',
                border: '1.5px solid rgba(255, 77, 79, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transform: `scale(${clampInterpolate(demoIn, [0, 1], [0.9, 1])})`,
                opacity: clampInterpolate(demoIn, [0, 1], [0, 1]),
              }}
            >
              <div>
                <div style={{ fontSize: 22, color: '#FCA5A5', fontWeight: 700 }}>以前的笨办法</div>
                <div style={{ fontSize: 34, color: PALETTE.white, fontWeight: 900, marginTop: 6 }}>
                  整条 10 公里路全拆了重修！
                </div>
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  color: PALETTE.coral,
                }}
              >
                ✕
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 2 (219-491f): 借鉴 vibe-motion/colorize 上色扫屏 + fisheye-motion WebGL 鱼眼屏摄聚焦 */
const Scene2ColorizeFisheye: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Colorize 黑白 -> 彩色扫屏转场（前 26 帧）
  const colorSweep = clampInterpolate(frame, [0, 26], [0, 100]);
  const grayscaleAmt = clampInterpolate(frame, [0, 26], [1, 0]);
  const blurPx = clampInterpolate(frame, [0, 18], [5, 0]);

  // 迪士尼慢入慢出聚焦推镜
  const focusProgress = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 24, stiffness: 75, mass: 1.15 },
  });
  const focusX = clampInterpolate(focusProgress, [0, 1], [0.52, 0.73]);
  const focusY = clampInterpolate(focusProgress, [0, 1], [0.36, 0.36]);
  const zoom = clampInterpolate(focusProgress, [0, 1], [1.05, 1.58]);
  const strength = clampInterpolate(focusProgress, [0, 1], [0.75, 1.38]);

  // 弯曲荧光标注滑入
  const mask1 = clampInterpolate(frame, [45, 72], [0, 1]);
  const mask2 = clampInterpolate(frame, [62, 90], [0, 1]);

  const cardIn = spring({
    frame: Math.max(0, frame - 70),
    fps,
    config: { damping: 16, stiffness: 170 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.night,
        fontFamily: theme.fonts.sans,
        padding: '155px 46px 0',
      }}
    >
      {/* 真实 GitHub 页面 WebGL 鱼眼屏摄 + colorize 扫色揭示 */}
      <div
        style={{
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.16)',
          boxShadow: '0 28px 70px rgba(0,0,0,0.6)',
          backgroundColor: '#000',
        }}
      >
        <div
          style={{
            height: 48,
            backgroundColor: '#131722',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            fontFamily: theme.fonts.mono,
            fontSize: 20,
            color: '#CBD5E1',
          }}
        >
          <div style={{ display: 'flex', gap: 9 }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: '#FF5F56' }} />
            <span style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: '#FFBD2E' }} />
            <span style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: '#27C93F' }} />
          </div>
          <span>github.com/EL4CTEO/fast-anything</span>
          <span style={{ color: PALETTE.amber, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Star size={18} fill={PALETTE.amber} /> 4.4k
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            height: 620,
            filter: `grayscale(${grayscaleAmt}) blur(${blurPx}px)`,
          }}
        >
          <FisheyeCanvas
            imageSrc="images/fast-anything-repo.png"
            focus={{ x: focusX, y: focusY }}
            zoom={zoom}
            strength={strength}
            moire={{ intensity: 0.22, scale: 820, angle: 0.06 }}
            vignette={{ amount: 0.72, radius: 0.72, softness: 0.44 }}
            rects={[
              {
                x: 0.715,
                y: 0.322,
                w: 0.255,
                h: 0.052,
                color: '#ffe200',
                opacity: 0.95,
                blend: 'multiply',
                mask: mask1,
              },
              {
                x: 0.715,
                y: 0.376,
                w: 0.255,
                h: 0.052,
                color: '#ffe200',
                opacity: 0.95,
                blend: 'multiply',
                mask: mask2,
              },
            ]}
          />
          {/* Colorize 扫光竖线 */}
          {colorSweep < 99 ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${colorSweep}%`,
                width: 6,
                backgroundColor: PALETTE.amber,
                boxShadow: '0 0 32px 12px rgba(245, 184, 46, 0.7)',
              }}
            />
          ) : null}
        </div>
      </div>

      {/* 下半屏：小白秒懂“体检医生”角色卡 */}
      {frame >= 70 ? (
        <div
          style={{
            marginTop: 34,
            borderRadius: 24,
            backgroundColor: PALETTE.nightCard,
            border: '1.5px solid rgba(34, 211, 238, 0.35)',
            padding: '34px 36px',
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            transform: `translateY(${clampInterpolate(cardIn, [0, 1], [40, 0])}px)`,
            opacity: clampInterpolate(cardIn, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              backgroundColor: 'rgba(34, 211, 238, 0.14)',
              border: '1.5px solid rgba(34, 211, 238, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Search size={44} color={PALETTE.cyan} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: PALETTE.cyan }}>
              一句话看懂 fast-anything
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: PALETTE.white, marginTop: 6, lineHeight: 1.25 }}>
              软件的「体检医生」
            </div>
            <div style={{ fontSize: 26, color: '#94A3B8', marginTop: 8 }}>
              不用推倒重来，专找拖慢全局的那 <span style={{ color: PALETTE.amber, fontWeight: 800 }}>5% 卡顿零件</span>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Scene 3 (491-742f): 柔和日系暖白杂志风 + 借鉴 vibe-motion/claude-typer 拟真终端 + 三步直观机制 */
const Scene3ClaudeTyperMechanism: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const termIn = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const cmd = 'claude > 用 fast-anything 给我的程序提速，只改最慢的部分';
  const typedLen = Math.floor(clampInterpolate(frame, [10, 62], [0, cmd.length]));

  const step1 = spring({ frame: Math.max(0, frame - 68), fps, config: { damping: 14, stiffness: 200 } });
  const step2 = spring({ frame: Math.max(0, frame - 108), fps, config: { damping: 14, stiffness: 200 } });
  const step3 = spring({ frame: Math.max(0, frame - 150), fps, config: { damping: 14, stiffness: 200 } });

  const steps = [
    {
      icon: <Search size={30} color={PALETTE.cyan} />,
      badge: 'STEP 01',
      title: '揪出 5% 卡顿源头',
      desc: '自动扫描全程序，精准定位最耗时的瓶颈',
      accent: PALETTE.cyan,
      anim: step1,
    },
    {
      icon: <Cpu size={30} color={PALETTE.claude} />,
      badge: 'STEP 02',
      title: 'AI 换装赛车级引擎',
      desc: '只重写这 5% 核心零件，其余 95% 原封不动',
      accent: PALETTE.claude,
      anim: step2,
    },
    {
      icon: <ShieldCheck size={30} color={PALETTE.emerald} />,
      badge: 'STEP 03',
      title: '改完自动对账校验',
      desc: '128 组真实数据比对，确保结果 100% 一致',
      accent: PALETTE.emerald,
      anim: step3,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.paper,
        backgroundImage:
          'linear-gradient(rgba(26,29,36,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,29,36,0.04) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        fontFamily: theme.fonts.sans,
        padding: '155px 48px 0',
      }}
    >
      {/* 上半屏：Claude Code 拟真提示词打字终端（claude-typer 风格） */}
      <div
        style={{
          borderRadius: 24,
          backgroundColor: '#151821',
          border: '1.5px solid rgba(26,29,36,0.16)',
          boxShadow: '0 24px 60px rgba(26, 29, 36, 0.18)',
          padding: '30px 32px',
          color: PALETTE.white,
          transform: `translateY(${clampInterpolate(termIn, [0, 1], [30, 0])}px)`,
          opacity: clampInterpolate(termIn, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: PALETTE.claude,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Terminal size={20} color="#FFF" />
            </div>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 800, color: '#F1F5F9' }}>
              Claude Code · fast-anything
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: PALETTE.emerald,
              backgroundColor: 'rgba(16,185,129,0.14)',
              padding: '4px 12px',
              borderRadius: 99,
            }}
          >
            AUTO AGENT
          </span>
        </div>

        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.5,
            color: '#FDE68A',
            minHeight: 88,
          }}
        >
          {cmd.slice(0, typedLen)}
          <span style={{ opacity: frame % 12 < 6 ? 1 : 0, color: PALETTE.claude }}>▍</span>
        </div>

        {frame >= 72 ? (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px dashed rgba(255,255,255,0.12)',
              fontFamily: theme.fonts.mono,
              fontSize: 22,
              color: '#94A3B8',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: PALETTE.emerald }}>✓ 热点定位完成 · 正在自动换装底层引擎...</span>
            <span>5% / 100%</span>
          </div>
        ) : null}
      </div>

      {/* 下半屏：日系杂志感三步卡片（迪士尼跟随重叠入场） */}
      <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {steps.map((s) => (
          <div
            key={s.badge}
            style={{
              backgroundColor: PALETTE.paperCard,
              borderRadius: 20,
              border: '1.5px solid rgba(26, 29, 36, 0.1)',
              boxShadow: '0 10px 28px rgba(26, 29, 36, 0.06)',
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              transform: `translateY(${clampInterpolate(s.anim, [0, 1], [36, 0])}px) scale(${clampInterpolate(s.anim, [0, 1], [0.96, 1])})`,
              opacity: clampInterpolate(s.anim, [0, 1], [0, 1]),
            }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 16,
                backgroundColor: `${s.accent}18`,
                border: `1.5px solid ${s.accent}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: theme.fonts.mono, fontSize: 18, fontWeight: 800, color: s.accent }}>
                  {s.badge}
                </span>
                <span style={{ fontSize: 34, fontWeight: 900, color: PALETTE.ink }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 24, color: PALETTE.inkMuted, marginTop: 6, fontWeight: 600 }}>
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Scene 4 (742-1014f): 60 秒 vs 1.6 秒双秒表竞速 + 收藏卡片 */
const Scene4ResultOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 16, stiffness: 170 } });
  const slowSec = clampInterpolate(frame, [10, 95], [0, 60.0]);
  const fastSec = clampInterpolate(frame, [10, 32], [0, 1.6]);
  const fastBar = clampInterpolate(frame, [10, 32], [0, 100]);
  const slowBar = clampInterpolate(frame, [10, 95], [0, 100]);
  const badgeIn = spring({ frame: Math.max(0, frame - 80), fps, config: { damping: 13, stiffness: 220 } });
  const repoIn = spring({ frame: Math.max(0, frame - 125), fps, config: { damping: 15, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.night,
        backgroundImage: 'radial-gradient(circle at 50% 25%, rgba(16, 185, 129, 0.16), transparent 60%)',
        fontFamily: theme.fonts.sans,
        padding: '175px 52px 0',
      }}
    >
      {/* 双秒表竞速对比 */}
      <div
        style={{
          borderRadius: 26,
          backgroundColor: PALETTE.nightCard,
          border: '1.5px solid rgba(255,255,255,0.12)',
          padding: '40px 38px',
          boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
          opacity: clampInterpolate(cardIn, [0, 1], [0, 1]),
          transform: `translateY(${clampInterpolate(cardIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Gauge size={30} color={PALETTE.amber} />
          <span style={{ fontSize: 30, fontWeight: 800, color: PALETTE.white }}>
            同一个任务 · 改造前后耗时对比
          </span>
        </div>

        {/* 改造前：60 秒 */}
        <div style={{ marginBottom: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#94A3B8' }}>改造前（原版慢吞吞）</span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 44, fontWeight: 900, color: PALETTE.coral }}>
              {slowSec.toFixed(1)} 秒
            </span>
          </div>
          <div style={{ height: 28, borderRadius: 99, backgroundColor: '#1B2230', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${slowBar}%`, backgroundColor: PALETTE.coral, borderRadius: 99 }} />
          </div>
        </div>

        {/* 改造后：1.6 秒 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: PALETTE.emerald }}>改造后（只换 5% 引擎）</span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 48, fontWeight: 900, color: PALETTE.emerald }}>
              {fastSec.toFixed(1)} 秒 ✓
            </span>
          </div>
          <div style={{ height: 28, borderRadius: 99, backgroundColor: '#1B2230', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${fastBar}%`,
                background: 'linear-gradient(90deg, #10B981, #22D3EE)',
                borderRadius: 99,
                boxShadow: '0 0 24px rgba(16,185,129,0.55)',
              }}
            />
          </div>
        </div>

        {/* 95% 成本省下 + 30x+ 提速双徽章 */}
        {frame >= 80 ? (
          <div
            style={{
              marginTop: 38,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              transform: `scale(${clampInterpolate(badgeIn, [0, 1], [0.88, 1])})`,
              opacity: clampInterpolate(badgeIn, [0, 1], [0, 1]),
            }}
          >
            <div
              style={{
                borderRadius: 18,
                backgroundColor: 'rgba(245, 184, 46, 0.14)',
                border: '1.5px solid rgba(245, 184, 46, 0.45)',
                padding: '22px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, color: '#FDE68A', fontWeight: 700 }}>改造成本省下</div>
              <div style={{ fontSize: 54, fontWeight: 900, color: PALETTE.amber, marginTop: 4 }}>95%</div>
            </div>
            <div
              style={{
                borderRadius: 18,
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                padding: '22px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, color: '#A7F3D0', fontWeight: 700 }}>运行速度直接翻</div>
              <div style={{ fontSize: 54, fontWeight: 900, color: PALETTE.emerald, marginTop: 4 }}>30×+</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 开源项目名片 + 收藏引导 */}
      {frame >= 125 ? (
        <div
          style={{
            marginTop: 38,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.14)',
            padding: '32px 34px',
            textAlign: 'center',
            transform: `translateY(${clampInterpolate(repoIn, [0, 1], [34, 0])}px)`,
            opacity: clampInterpolate(repoIn, [0, 1], [0, 1]),
          }}
        >
          <div style={{ fontSize: 22, color: '#94A3B8', fontWeight: 700, letterSpacing: 1.5 }}>
            GITHUB 免费开源项目
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: theme.fonts.mono,
              fontSize: 44,
              fontWeight: 900,
              color: PALETTE.white,
            }}
          >
            EL4CTEO / fast-anything
          </div>
          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 28px',
              borderRadius: 999,
              backgroundColor: PALETTE.amber,
              color: PALETTE.ink,
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            <Sparkles size={24} />
            <span>先收藏防走丢 · 关注看更多狠活</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const VIBE_CINEMA_FRAMES = 1014; // 33.8s @ 30fps

export const VibeCinemaDeepDive: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const step = frame < 219 ? 0 : frame < 491 ? 1 : frame < 742 ? 2 : 3;
  const isDark = step !== 2; // 第 3 幕切换为日系暖白杂志幕，形成电影感明暗节奏
  const progress = clampInterpolate(frame, [0, durationInFrames], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: isDark ? PALETTE.night : PALETTE.paper }}>
      <EditorialRuler progress={progress} dark={isDark} step={step} />

      <Sequence from={0} durationInFrames={219}>
        <Scene1SpotlightAnalogy />
      </Sequence>
      <Sequence from={219} durationInFrames={272}>
        <Scene2ColorizeFisheye />
      </Sequence>
      <Sequence from={491} durationInFrames={251}>
        <Scene3ClaudeTyperMechanism />
      </Sequence>
      <Sequence from={742} durationInFrames={272}>
        <Scene4ResultOutro />
      </Sequence>

      <CinemaCaptions dark={isDark} />

      {/* 零爆音零吞字主配音 + 轻柔 48kHz 日系 BGM */}
      <Sequence from={0}>
        <Audio src={staticFile('audio/v4-fast-anything.mp3')} volume={0.95} />
      </Sequence>
      <Sequence from={0}>
        <Audio src={staticFile('sfx/anime-lofi-bgm.wav')} volume={0.07} loop />
      </Sequence>
    </AbsoluteFill>
  );
};
