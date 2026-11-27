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
import { CheckCircle2, Flame, Star, Terminal, Zap } from 'lucide-react';
import { clampInterpolate } from '../kit/motion';
import { theme } from '../kit/theme';
import { FisheyeCanvas } from '../kit/fisheye/FisheyeCanvas';

const MANGA = {
  paper: '#FAF7F0',
  paperAlt: '#F2ECE1',
  ink: '#111111',
  red: '#FF3B30',
  yellow: '#FFE600',
  cyan: '#00C2FF',
  green: '#10B981',
  darkPanel: '#14171F',
  white: '#FFFFFF',
  shadow: '8px 8px 0px #111111',
  shadowSm: '5px 5px 0px #111111',
  border: '4px solid #111111',
};

const CAPTIONS: Array<{
  startMs: number;
  endMs: number;
  parts: Array<{ text: string; color?: string }>;
}> = [
  {
    startMs: 0,
    endMs: 2450,
    parts: [
      { text: '别再把整个项目用 ' },
      { text: 'Rust 重写', color: MANGA.red },
      { text: ' 了！' },
    ],
  },
  {
    startMs: 2450,
    endMs: 4100,
    parts: [
      { text: 'GitHub 刚爆火一个' },
      { text: '神器', color: MANGA.yellow },
    ],
  },
  {
    startMs: 4100,
    endMs: 5550,
    parts: [
      { text: '只改 ' },
      { text: '5% 代码', color: MANGA.yellow },
      { text: ' 直接起飞' },
    ],
  },
  {
    startMs: 5700,
    endMs: 8500,
    parts: [
      { text: '它叫 ' },
      { text: 'fast-anything', color: MANGA.cyan },
      { text: '，接管 Claude Code' },
    ],
  },
  {
    startMs: 8500,
    endMs: 12050,
    parts: [
      { text: '先把 Python 最慢的函数' },
      { text: '精准揪出来', color: MANGA.yellow },
    ],
  },
  {
    startMs: 12200,
    endMs: 15500,
    parts: [
      { text: 'AI 只把 ' },
      { text: '5% 热点', color: MANGA.yellow },
      { text: ' 转成 Rust' },
    ],
  },
  {
    startMs: 15500,
    endMs: 19050,
    parts: [
      { text: '自动跑' },
      { text: '等价测试', color: MANGA.green },
      { text: '，拉满性能不改出Bug' },
    ],
  },
  {
    startMs: 19225,
    endMs: 21700,
    parts: [
      { text: '保留 ' },
      { text: 'Python 效率', color: MANGA.yellow },
      { text: '，白嫖 ' },
      { text: 'Rust 性能', color: MANGA.cyan },
    ],
  },
  {
    startMs: 21700,
    endMs: 24200,
    parts: [
      { text: '项目放这，' },
      { text: '关注看更多狠活！', color: MANGA.yellow },
    ],
  },
];

/** 日漫集中线背景（纯确定性 SVG） */
const MangaSpeedLines: React.FC<{ opacity?: number; color?: string }> = ({
  opacity = 0.14,
  color = MANGA.ink,
}) => {
  const frame = useCurrentFrame();
  const rot = (frame % 4) * 1.5; // 漫画抖动感
  const rays = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <svg
      viewBox="0 0 1080 1920"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <g transform={`translate(540, 820) rotate(${rot})`}>
        {rays.map((deg, idx) => (
          <polygon
            key={deg}
            points={`0,-340 ${idx % 2 === 0 ? -14 : -7},-1250 ${idx % 2 === 0 ? 14 : 7},-1250`}
            fill={color}
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </svg>
  );
};

/** 顶部日漫章节条 + 4 步进度锚点 */
const MangaHeader: React.FC<{ activeStep: number; progress: number }> = ({
  activeStep,
  progress,
}) => {
  const steps = ['01 痛点', '02 实拍', '03 原理', '04 结论'];
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
      {/* 顶部物理尺子进度条（借鉴 vibe-motion/ruler-progress-render） */}
      <div
        style={{
          position: 'relative',
          height: 30,
          backgroundColor: MANGA.paperAlt,
          borderBottom: '3px solid #111111',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${progress * 100}%`,
            backgroundColor: 'rgba(255, 230, 0, 0.55)',
            borderRight: '4px solid #FF3B30',
          }}
        />
        <svg viewBox="0 0 1080 30" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {Array.from({ length: 55 }, (_, i) => {
            const x = i * 20;
            const major = i % 5 === 0;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={major ? 18 : 10}
                  stroke="#111111"
                  strokeWidth={major ? 2.2 : 1.2}
                />
                {major && i > 0 && i < 55 ? (
                  <text
                    x={x + 4}
                    y={26}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily={theme.fonts.mono}
                    fill="#111111"
                  >
                    {String(i * 2).padStart(2, '0')}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          padding: '28px 48px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: MANGA.ink,
            color: MANGA.yellow,
            padding: '8px 18px',
            fontFamily: theme.fonts.mono,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 1,
            boxShadow: '4px 4px 0px #FF3B30',
          }}
        >
          <Flame size={22} color={MANGA.yellow} />
          <span>VOL.48 // GITHUB 狠活拆解</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {steps.map((label, idx) => {
            const active = idx === activeStep;
            return (
              <div
                key={label}
                style={{
                  padding: '6px 12px',
                  fontSize: 20,
                  fontWeight: 800,
                  border: '2.5px solid #111111',
                  backgroundColor: active ? MANGA.yellow : MANGA.white,
                  color: MANGA.ink,
                  boxShadow: active ? '3px 3px 0px #111111' : 'none',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** 抖音安全区高对比漫画描边字幕（Y=1410px，避开底部 380px 遮挡） */
const AnimeCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const active = CAPTIONS.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  if (!active) return null;

  const localFrame = Math.max(0, frame - Math.round((active.startMs / 1000) * fps));
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 260, mass: 0.6 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 1380,
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
          lineHeight: 1.3,
          textAlign: 'center',
          color: MANGA.white,
          backgroundColor: MANGA.ink,
          padding: '15px 26px',
          border: '4px solid #111111',
          boxShadow: '7px 7px 0px #FFE600',
          transform: `scale(${clampInterpolate(pop, [0, 1], [0.92, 1])}) translateY(${clampInterpolate(pop, [0, 1], [14, 0])}px)`,
        }}
      >
        {active.parts.map((p, idx) => (
          <span key={idx} style={{ color: p.color || MANGA.white }}>
            {p.text}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Scene 1: 0-171f (0-5.7s) 反常识漫画冲击钩子 */
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const slashProgress = clampInterpolate(frame, [28, 38], [0, 1]);
  const shakeX =
    frame >= 30 && frame <= 40
      ? Math.sin((frame - 30) * 2.4) * (40 - frame) * 1.6
      : 0;

  const revealIn = spring({
    frame: Math.max(0, frame - 54),
    fps,
    config: { damping: 12, stiffness: 210 },
  });
  const starCount = Math.round(clampInterpolate(frame, [62, 118], [0, 4400]));
  const barFiveWidth = clampInterpolate(frame, [74, 108], [0, 100]);

  return (
    <AbsoluteFill
      style={{
        padding: '180px 56px 0',
        fontFamily: theme.fonts.sans,
        transform: `translateX(${shakeX}px)`,
      }}
    >
      {frame >= 54 ? <MangaSpeedLines opacity={0.13} /> : null}

      {/* 上半格：旧认知 100% 重写被红叉划掉 */}
      <div
        style={{
          position: 'relative',
          backgroundColor: MANGA.white,
          border: MANGA.border,
          boxShadow: MANGA.shadow,
          padding: '44px 40px',
          transform: `scale(${clampInterpolate(cardIn, [0, 1], [0.85, 1])}) rotate(-1.2deg)`,
          opacity: clampInterpolate(cardIn, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#666666',
            marginBottom: 12,
          }}
        >
          传统硬核玩家的做法：
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: MANGA.ink,
            lineHeight: 1.12,
          }}
        >
          100% 用 Rust 重写
        </div>

        {/* 动态粗红线划掉 + 红色印章 */}
        {slashProgress > 0 ? (
          <>
            <svg
              viewBox="0 0 900 220"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <line
                x1="36"
                y1="190"
                x2={36 + 828 * slashProgress}
                y2={190 - 155 * slashProgress}
                stroke={MANGA.red}
                strokeWidth="20"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                right: 32,
                top: 24,
                backgroundColor: MANGA.red,
                color: MANGA.white,
                fontSize: 34,
                fontWeight: 900,
                padding: '8px 22px',
                border: '4px solid #111111',
                transform: `rotate(8deg) scale(${slashProgress})`,
              }}
            >
              别傻干了 ✕
            </div>
          </>
        ) : null}
      </div>

      {/* 下半格：亮黄冲击面板 —— 只改 5%！ */}
      {frame >= 54 ? (
        <div
          style={{
            marginTop: 48,
            backgroundColor: MANGA.yellow,
            border: MANGA.border,
            boxShadow: '12px 12px 0px #111111',
            padding: '44px 42px',
            transform: `scale(${clampInterpolate(revealIn, [0, 1], [0.75, 1])}) rotate(0.8deg)`,
            opacity: clampInterpolate(revealIn, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                backgroundColor: MANGA.ink,
                color: MANGA.white,
                fontSize: 28,
                fontWeight: 900,
                padding: '8px 18px',
              }}
            >
              GITHUB 本周爆火神器
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: MANGA.white,
                border: '3px solid #111111',
                padding: '8px 18px',
                fontFamily: theme.fonts.mono,
                fontSize: 34,
                fontWeight: 900,
                color: MANGA.ink,
              }}
            >
              <Star size={30} fill={MANGA.red} color={MANGA.ink} />
              {starCount.toLocaleString()}+
            </span>
          </div>

          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: MANGA.ink,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            只改 <span style={{ color: MANGA.red }}>5%</span> 代码
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              fontWeight: 800,
              color: MANGA.ink,
            }}
          >
            精准提速热点函数 · 性能直接起飞
          </div>

          {/* 95% vs 5% 可视化条 */}
          <div
            style={{
              marginTop: 28,
              height: 46,
              border: '4px solid #111111',
              backgroundColor: MANGA.white,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '82%',
                backgroundColor: MANGA.paperAlt,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 16,
                fontSize: 22,
                fontWeight: 800,
                color: '#444444',
                borderRight: '4px solid #111111',
              }}
            >
              95% 原业务代码（保持不动）
            </div>
            <div
              style={{
                width: `${18 * (barFiveWidth / 100)}%`,
                backgroundColor: MANGA.red,
                color: MANGA.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              5%
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Scene 2: 171-366f (5.7-12.2s) 猫学长同款 WebGL 鱼眼屏摄聚焦推镜 + 终端热点扫描 */
const Scene2Evidence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserIn = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  // 迪士尼慢入慢出聚焦推镜：全景 -> 右侧 About 核心定位 + Star 4.4k
  const focusProgress = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 22, stiffness: 85, mass: 1.1 },
  });
  const focusX = clampInterpolate(focusProgress, [0, 1], [0.54, 0.73]);
  const focusY = clampInterpolate(focusProgress, [0, 1], [0.36, 0.36]);
  const zoom = clampInterpolate(focusProgress, [0, 1], [1.06, 1.56]);
  const strength = clampInterpolate(focusProgress, [0, 1], [0.75, 1.38]);

  // 黄色荧光标注在鱼眼曲面内从左向右滑入（blend: multiply）
  const mask1 = clampInterpolate(frame, [24, 46], [0, 1]);
  const mask2 = clampInterpolate(frame, [38, 60], [0, 1]);

  const termIn = spring({
    frame: Math.max(0, frame - 48),
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const cmd = '$ fast-anything profile ./app.py';
  const typedLen = Math.floor(clampInterpolate(frame, [58, 95], [0, cmd.length]));
  const showScan = frame >= 102;
  const hotspotWidth = clampInterpolate(frame, [106, 142], [0, 94.8]);

  return (
    <AbsoluteFill
      style={{
        padding: '170px 48px 0',
        fontFamily: theme.fonts.sans,
      }}
    >
      {/* 上半格：WebGL 鱼眼屏摄聚焦推镜（桶形畸变 + 摩尔纹 + 暗角 + 弯曲荧光标注） */}
      <div
        style={{
          backgroundColor: MANGA.ink,
          border: MANGA.border,
          boxShadow: MANGA.shadow,
          overflow: 'hidden',
          transform: `scale(${clampInterpolate(browserIn, [0, 1], [0.92, 1])})`,
          opacity: clampInterpolate(browserIn, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            height: 46,
            backgroundColor: MANGA.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            color: MANGA.white,
            fontFamily: theme.fonts.mono,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, backgroundColor: MANGA.red }} />
            <span style={{ width: 14, height: 14, borderRadius: 99, backgroundColor: MANGA.yellow }} />
            <span style={{ width: 14, height: 14, borderRadius: 99, backgroundColor: MANGA.green }} />
          </div>
          <span>github.com/EL4CTEO/fast-anything</span>
          <span style={{ color: MANGA.yellow }}>FISHEYE 实拍</span>
        </div>

        <div style={{ position: 'relative', height: 590, overflow: 'hidden', backgroundColor: '#000' }}>
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
        </div>
      </div>

      {/* 下半格：动态终端窗口（实时打字机 + CPU 热点揪出） */}
      {frame >= 48 ? (
        <div
          style={{
            marginTop: 34,
            backgroundColor: MANGA.darkPanel,
            border: MANGA.border,
            boxShadow: MANGA.shadow,
            padding: '28px 32px',
            color: MANGA.white,
            fontFamily: theme.fonts.mono,
            transform: `translateY(${clampInterpolate(termIn, [0, 1], [60, 0])}px)`,
            opacity: clampInterpolate(termIn, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              borderBottom: '2px solid rgba(255,255,255,0.16)',
              paddingBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 800, color: MANGA.cyan }}>
              <Terminal size={24} />
              <span>CLAUDE CODE // PROFILER</span>
            </div>
            <span style={{ fontSize: 20, color: MANGA.yellow }}>实时扫描</span>
          </div>

          <div style={{ fontSize: 30, fontWeight: 700, color: MANGA.yellow, minHeight: 42 }}>
            {cmd.slice(0, typedLen)}
            <span style={{ opacity: frame % 12 < 6 ? 1 : 0 }}>▋</span>
          </div>

          {showScan ? (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 22, color: '#94A3B8', marginBottom: 12 }}>
                ▶ 发现性能瓶颈（仅占 4.6% 代码量）：
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255, 59, 48, 0.16)',
                  border: '3px solid #FF3B30',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
                  <span style={{ color: MANGA.white }}>parse_payload()</span>
                  <span style={{ color: MANGA.red }}>{hotspotWidth.toFixed(1)}% CPU</span>
                </div>
                <div style={{ height: 18, backgroundColor: '#262B38', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${hotspotWidth}%`,
                      backgroundColor: MANGA.red,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Scene 3: 366-577f (12.2-19.2s) 漫画三步原理连线 + Before/After 柱状图竞速 + 37x 印章 */
const Scene3Mechanism: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n1 = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const n2 = spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 14, stiffness: 220 } });
  const n3 = spring({ frame: Math.max(0, frame - 54), fps, config: { damping: 14, stiffness: 220 } });

  const dashOffset = -(frame * 3);
  const chartIn = spring({ frame: Math.max(0, frame - 86), fps, config: { damping: 14, stiffness: 200 } });
  const pyBar = clampInterpolate(frame, [96, 126], [0, 100]);
  const rsBar = clampInterpolate(frame, [106, 132], [0, 8]);
  const stampIn = spring({ frame: Math.max(0, frame - 122), fps, config: { damping: 11, stiffness: 260 } });

  const nodes = [
    { num: '01', title: '剖析热点', sub: '揪出最慢 5% 函数', bg: MANGA.cyan, anim: n1 },
    { num: '02', title: 'AI 写 Rust', sub: '自动生成原生扩展', bg: MANGA.yellow, anim: n2 },
    { num: '03', title: '等价测试', sub: '逐条校验绝不出错', bg: MANGA.green, anim: n3 },
  ];

  return (
    <AbsoluteFill
      style={{
        padding: '165px 48px 0',
        fontFamily: theme.fonts.sans,
      }}
    >
      {frame >= 122 ? <MangaSpeedLines opacity={0.14} /> : null}

      {/* 上半格：三步漫画架构连线 */}
      <div
        style={{
          backgroundColor: MANGA.white,
          border: MANGA.border,
          boxShadow: MANGA.shadow,
          padding: '32px 28px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: MANGA.ink,
            color: MANGA.white,
            padding: '6px 16px',
            fontSize: 24,
            fontWeight: 900,
            marginBottom: 28,
          }}
        >
          <Zap size={22} color={MANGA.yellow} />
          <span>核心原理：三步全自动流水线</span>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 26 }}>
          {/* 纵向动态流动连线 */}
          <svg
            viewBox="0 0 60 360"
            style={{ position: 'absolute', left: 32, top: 40, width: 60, height: 320, zIndex: 0 }}
          >
            <line
              x1="30"
              y1="0"
              x2="30"
              y2="320"
              stroke={MANGA.ink}
              strokeWidth="6"
              strokeDasharray="14 10"
              strokeDashoffset={dashOffset}
            />
          </svg>

          {nodes.map((node) => (
            <div
              key={node.num}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                backgroundColor: node.bg,
                border: '4px solid #111111',
                boxShadow: MANGA.shadowSm,
                padding: '22px 26px',
                transform: `translateX(${clampInterpolate(node.anim, [0, 1], [-50, 0])}px)`,
                opacity: clampInterpolate(node.anim, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  backgroundColor: MANGA.ink,
                  color: MANGA.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: theme.fonts.mono,
                  fontSize: 32,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {node.num}
              </div>
              <div>
                <div style={{ fontSize: 38, fontWeight: 900, color: MANGA.ink }}>{node.title}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1F2937', marginTop: 4 }}>{node.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 下半格：实测性能柱状图对比 + 37x 漫画印章 */}
      {frame >= 86 ? (
        <div
          style={{
            position: 'relative',
            marginTop: 34,
            backgroundColor: MANGA.darkPanel,
            border: MANGA.border,
            boxShadow: MANGA.shadow,
            padding: '32px 34px',
            color: MANGA.white,
            transform: `translateY(${clampInterpolate(chartIn, [0, 1], [50, 0])}px)`,
            opacity: clampInterpolate(chartIn, [0, 1], [0, 1]),
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, color: MANGA.yellow, marginBottom: 24 }}>
            核心接口耗时对比（越短越快）
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
              <span>Python 原版</span>
              <span style={{ fontFamily: theme.fonts.mono, color: MANGA.red }}>1,420 ms</span>
            </div>
            <div style={{ height: 34, backgroundColor: '#262B38', border: '2px solid #FFFFFF' }}>
              <div style={{ height: '100%', width: `${pyBar}%`, backgroundColor: MANGA.red }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
              <span>Rust 热点接管</span>
              <span style={{ fontFamily: theme.fonts.mono, color: MANGA.green, backgroundColor: 'rgba(16,185,129,0.18)', padding: '2px 12px', border: '2px solid #10B981' }}>38 ms</span>
            </div>
            <div style={{ height: 34, backgroundColor: '#262B38', border: '2px solid #FFFFFF' }}>
              <div style={{ height: '100%', width: `${rsBar}%`, backgroundColor: MANGA.green }} />
            </div>
          </div>

          {/* 37x 漫画冲击印章 */}
          {frame >= 122 ? (
            <div
              style={{
                position: 'absolute',
                right: 26,
                bottom: 24,
                backgroundColor: MANGA.yellow,
                color: MANGA.ink,
                border: '5px solid #111111',
                boxShadow: '6px 6px 0px #FF3B30',
                padding: '12px 26px',
                fontSize: 48,
                fontWeight: 900,
                transform: `rotate(-7deg) scale(${clampInterpolate(stampIn, [0, 1], [1.9, 1])})`,
                opacity: clampInterpolate(stampIn, [0, 1], [0, 1]),
              }}
            >
              37x 提速!
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Scene 4: 577-735f (19.2-24.5s) 漫画双栏结论定格 + 仓库名牌 + 关注引导 */
const Scene4Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftIn = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const rightIn = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 14, stiffness: 200 } });
  const repoIn = spring({ frame: Math.max(0, frame - 42), fps, config: { damping: 14, stiffness: 210 } });

  return (
    <AbsoluteFill
      style={{
        padding: '220px 52px 0',
        fontFamily: theme.fonts.sans,
      }}
    >
      <MangaSpeedLines opacity={0.1} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
        <div
          style={{
            backgroundColor: MANGA.yellow,
            border: MANGA.border,
            boxShadow: MANGA.shadow,
            padding: '44px 28px',
            transform: `translateY(${clampInterpolate(leftIn, [0, 1], [50, 0])}px)`,
            opacity: clampInterpolate(leftIn, [0, 1], [0, 1]),
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, color: MANGA.ink }}>开发体验</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: MANGA.ink, marginTop: 14, lineHeight: 1.1 }}>
            Python 效率
          </div>
          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: MANGA.ink,
              color: MANGA.white,
              padding: '8px 16px',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            <CheckCircle2 size={24} color={MANGA.green} />
            100% 保留
          </div>
        </div>

        <div
          style={{
            backgroundColor: MANGA.cyan,
            border: MANGA.border,
            boxShadow: MANGA.shadow,
            padding: '44px 28px',
            transform: `translateY(${clampInterpolate(rightIn, [0, 1], [50, 0])}px)`,
            opacity: clampInterpolate(rightIn, [0, 1], [0, 1]),
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, color: MANGA.ink }}>运行速度</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: MANGA.ink, marginTop: 14, lineHeight: 1.1 }}>
            Rust 性能
          </div>
          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: MANGA.ink,
              color: MANGA.yellow,
              padding: '8px 16px',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            <Zap size={24} color={MANGA.yellow} />
            直接白嫖
          </div>
        </div>
      </div>

      {/* 仓库名牌 */}
      <div
        style={{
          marginTop: 52,
          backgroundColor: MANGA.white,
          border: MANGA.border,
          boxShadow: '10px 10px 0px #111111',
          padding: '40px 36px',
          textAlign: 'center',
          transform: `scale(${clampInterpolate(repoIn, [0, 1], [0.88, 1])})`,
          opacity: clampInterpolate(repoIn, [0, 1], [0, 1]),
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 800, color: '#555555' }}>GITHUB 开源项目地址</div>
        <div
          style={{
            marginTop: 14,
            fontFamily: theme.fonts.mono,
            fontSize: 48,
            fontWeight: 900,
            color: MANGA.ink,
          }}
        >
          EL4CTEO / fast-anything
        </div>
        <div
          style={{
            marginTop: 26,
            display: 'inline-block',
            backgroundColor: MANGA.red,
            color: MANGA.white,
            border: '4px solid #111111',
            boxShadow: '5px 5px 0px #111111',
            padding: '12px 32px',
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          关注我 · 下期拆解更多硬核狠活
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MANGA_DEEP_DIVE_FRAMES = 735; // 24.5s @ 30fps

export const MangaDeepDive: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const activeStep = frame < 171 ? 0 : frame < 366 ? 1 : frame < 577 ? 2 : 3;
  const progress = clampInterpolate(frame, [0, durationInFrames], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MANGA.paper,
        // 日漫网点纸背景
        backgroundImage: 'radial-gradient(rgba(17, 17, 17, 0.12) 1.6px, transparent 1.6px)',
        backgroundSize: '20px 20px',
      }}
    >
      <MangaHeader activeStep={activeStep} progress={progress} />

      <Sequence from={0} durationInFrames={171}>
        <Scene1Hook />
      </Sequence>
      <Sequence from={171} durationInFrames={195}>
        <Scene2Evidence />
      </Sequence>
      <Sequence from={366} durationInFrames={211}>
        <Scene3Mechanism />
      </Sequence>
      <Sequence from={577} durationInFrames={158}>
        <Scene4Outro />
      </Sequence>

      <AnimeCaptions />

      {/* L1 主人声轨 */}
      <Sequence from={0}>
        <Audio src={staticFile('audio/v2-fast-anything.mp3')} volume={0.92} />
      </Sequence>

      {/* L2 日系轻快 Lo-fi 节拍 BGM（轻托底，避免抢人声与叠加爆音） */}
      <Sequence from={0}>
        <Audio src={staticFile('sfx/anime-lofi-bgm.wav')} volume={0.07} />
      </Sequence>

      {/* L3 轻量动作音效（去掉低频 boom.wav，仅保留轻柔和切镜 whoosh/pop） */}
      <Sequence from={54} durationInFrames={15}>
        <Audio src={staticFile('sfx/pop.wav')} volume={0.14} />
      </Sequence>
      <Sequence from={171} durationInFrames={15}>
        <Audio src={staticFile('sfx/whoosh.wav')} volume={0.15} />
      </Sequence>
      <Sequence from={366} durationInFrames={15}>
        <Audio src={staticFile('sfx/whoosh.wav')} volume={0.15} />
      </Sequence>
      <Sequence from={577} durationInFrames={15}>
        <Audio src={staticFile('sfx/whoosh.wav')} volume={0.15} />
      </Sequence>
    </AbsoluteFill>
  );
};
