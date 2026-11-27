import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Star, Terminal } from 'lucide-react';
import { clampInterpolate } from '../kit/motion';
import { theme } from '../kit/theme';
import {
  LiveHighwayCanvas,
  LiveTokyoNightCanvas,
} from '../kit/anime/AnimeMotionScenes';

const CAPTIONS: Array<{
  startMs: number;
  endMs: number;
  parts: Array<{ text: string; color?: string }>;
}> = [
  {
    startMs: 0,
    endMs: 2800,
    parts: [
      { text: '一条十公里高速，就' },
      { text: '一个收费站堵车', color: '#FFD166' },
    ],
  },
  {
    startMs: 2800,
    endMs: 5450,
    parts: [
      { text: '以前却得把' },
      { text: '整条路拆了重修！', color: '#FF6B6B' },
    ],
  },
  {
    startMs: 5548,
    endMs: 8800,
    parts: [
      { text: 'GitHub 刚火的免费神器 ' },
      { text: 'fast-anything', color: '#5CE1E6' },
    ],
  },
  {
    startMs: 8800,
    endMs: 12950,
    parts: [
      { text: '像软件的体检医生，专找最卡的 ' },
      { text: '5% 零件', color: '#FFD166' },
    ],
  },
  {
    startMs: 13077,
    endMs: 16900,
    parts: [
      { text: 'AI 只把这 5% 换成' },
      { text: '赛车引擎', color: '#34D399' },
      { text: '，改完自动对账' },
    ],
  },
  {
    startMs: 16900,
    endMs: 21100,
    parts: [
      { text: '原本一分钟，现在' },
      { text: '不到两秒', color: '#FFD166' },
      { text: '，翻三十多倍！' },
    ],
  },
];

/** 极简电影感物理刻度尺（借鉴 vibe-motion/ruler-progress-render） */
const CinemaRuler: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 }}>
      <div
        style={{
          position: 'relative',
          height: 24,
          backgroundColor: 'rgba(6, 9, 16, 0.52)',
          borderBottom: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${progress * 100}%`,
            backgroundColor: 'rgba(255, 209, 102, 0.22)',
            borderRight: '3px solid #FFD166',
          }}
        />
        <svg viewBox="0 0 1080 24" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {Array.from({ length: 55 }, (_, i) => (
            <line
              key={i}
              x1={i * 20}
              y1={0}
              x2={i * 20}
              y2={i % 5 === 0 ? 13 : 6}
              stroke="rgba(255,255,255,0.34)"
              strokeWidth={i % 5 === 0 ? 1.6 : 1}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

/** 日系番剧竖排章节角标 */
const AnimeVerticalTag: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      position: 'absolute',
      top: 56,
      right: 16,
      zIndex: 35,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      fontFamily: theme.fonts.sans,
      pointerEvents: 'none',
    }}
  >
    <div style={{ width: 1.5, height: 36, backgroundColor: 'rgba(255, 209, 102, 0.8)' }} />
    <div
      style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 5,
        color: 'rgba(255, 255, 255, 0.85)',
        textShadow: '0 4px 16px rgba(0,0,0,0.9)',
      }}
    >
      {label}
    </div>
    <div style={{ width: 1.5, height: 36, backgroundColor: 'rgba(255, 255, 255, 0.35)' }} />
  </div>
);

/** 纯日影无框大字字幕（无圆角卡片，彻底电影质感） */
const AnimeFilmSubtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const active = CAPTIONS.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  if (!active) return null;

  const localFrame = Math.max(0, frame - Math.round((active.startMs / 1000) * fps));
  const fade = clampInterpolate(localFrame, [0, 6], [0, 1]);
  const rise = clampInterpolate(localFrame, [0, 8], [10, 0]);

  return (
    <>
      {/* 底部极柔和电影暗部托底渐变 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 620,
          background: 'linear-gradient(to top, rgba(4,7,14,0.88) 0%, rgba(4,7,14,0.45) 55%, transparent 100%)',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1425,
          left: 48,
          right: 48,
          textAlign: 'center',
          zIndex: 50,
          fontFamily: theme.fonts.sans,
          fontSize: 50,
          fontWeight: 900,
          lineHeight: 1.35,
          letterSpacing: 1,
          color: '#FFFFFF',
          opacity: fade,
          transform: `translateY(${rise}px)`,
          textShadow: '0 4px 20px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.85)',
        }}
      >
        {active.parts.map((p, idx) => (
          <span key={idx} style={{ color: p.color || '#FFFFFF' }}>
            {p.text}
          </span>
        ))}
      </div>
    </>
  );
};

/** Scene 1 (0-166f): 100% 代码逐帧渲染的新海诚 3D 透视高架桥（真飞驰车流 + 真实收费站红灯堵车 + 飘云 + 雨丝） */
const Scene1AnimeHighway: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const swingDeg = Math.sin((frame / fps) * 1.4) * 16;
  const titleIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const punchIn = spring({
    frame: Math.max(0, frame - 78),
    fps,
    config: { damping: 14, stiffness: 190 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050810', overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      {/* L0 真动态 3D 高架桥动画画布（每帧实时运算，零静图） */}
      <LiveHighwayCanvas />

      {/* 摆动聚光灯光束 */}
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="animeBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD166" stopOpacity="0.24" />
            <stop offset="55%" stopColor="#FFD166" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(540, 0) rotate(${swingDeg})`}>
          <polygon points="-28,0 28,0 420,1200 -420,1200" fill="url(#animeBeam)" />
        </g>
      </svg>

      {/* 上半夜空无框电影主标题 */}
      <div
        style={{
          position: 'absolute',
          top: 155,
          left: 60,
          right: 100,
          opacity: clampInterpolate(titleIn, [0, 1], [0, 1]),
          transform: `translateY(${clampInterpolate(titleIn, [0, 1], [28, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            color: '#FFD166',
            marginBottom: 16,
            textShadow: '0 2px 12px rgba(0,0,0,0.85)',
          }}
        >
          EP.48 // GITHUB TOP 10
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            textShadow: '0 8px 32px rgba(0,0,0,0.9)',
          }}
        >
          只堵 <span style={{ color: '#FF5A5F' }}>1 个收费站</span>
        </div>

        {frame >= 78 ? (
          <div
            style={{
              marginTop: 20,
              fontSize: 44,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 4px 20px rgba(0,0,0,0.95)',
              opacity: clampInterpolate(punchIn, [0, 1], [0, 1]),
              transform: `translateY(${clampInterpolate(punchIn, [0, 1], [18, 0])}px)`,
            }}
          >
            以前居然要 <span style={{ color: '#FF6B6B', textDecoration: 'line-through' }}>拆整条路重修</span> ？
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Scene 2 (166-392f): 真动态东京夜景画布 + Playwright 真实滚动录屏视频 + colorize 扫色 + 屏摄暗角/扫描线 */
const Scene2AnimeFisheye: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colorSweep = clampInterpolate(frame, [0, 24], [0, 100]);
  const grayscaleAmt = clampInterpolate(frame, [0, 24], [1, 0]);
  const winIn = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });
  const focusZoom = clampInterpolate(frame, [20, 140], [1.0, 1.12]);
  const tagIn = spring({ frame: Math.max(0, frame - 65), fps, config: { damping: 16, stiffness: 170 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#060912', overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      {/* L0 真动态呼吸感东京夜景 + 漂浮微尘 */}
      <LiveTokyoNightCanvas />

      {/* 顶部大字项目名 */}
      <div style={{ position: 'absolute', top: 96, left: 54, right: 90 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: theme.fonts.mono,
            fontSize: 24,
            fontWeight: 800,
            color: '#FFD166',
            textShadow: '0 2px 12px rgba(0,0,0,0.85)',
          }}
        >
          <Star size={22} fill="#FFD166" />
          <span>本周飙升 4,400+ STAR · 实拍录屏</span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: theme.fonts.mono,
            fontSize: 64,
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: -1,
            textShadow: '0 8px 28px rgba(0,0,0,0.9)',
          }}
        >
          fast-anything
        </div>
      </div>

      {/* 中景：Playwright 真实 GitHub 页面滚动录屏视频（3D 屏摄透视 + 扫描线摩尔纹 + 暗角 + colorize 扫色） */}
      <div
        style={{
          position: 'absolute',
          top: 285,
          left: 46,
          right: 60,
          height: 675,
          borderRadius: 18,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.24)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.78)',
          transform: `perspective(1100px) rotateY(-4deg) rotateX(2deg) scale(${clampInterpolate(winIn, [0, 1], [0.92, 1])})`,
          opacity: clampInterpolate(winIn, [0, 1], [0, 1]),
          filter: `grayscale(${grayscaleAmt})`,
        }}
      >
        <OffthreadVideo
          src={staticFile('videos/fast-anything-scroll.mp4')}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${focusZoom})`,
            transformOrigin: '60% 35%',
          }}
        />
        {/* 屏摄细扫描线摩尔纹 + 电影径向暗角 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 4px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 45%, transparent 52%, rgba(0,0,0,0.68) 100%)',
            pointerEvents: 'none',
          }}
        />
        {colorSweep < 99 ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${colorSweep}%`,
              width: 6,
              backgroundColor: '#FFD166',
              boxShadow: '0 0 36px 14px rgba(255, 209, 102, 0.75)',
            }}
          />
        ) : null}
      </div>

      {/* 下景：无框电影感大白话定性 */}
      {frame >= 65 ? (
        <div
          style={{
            position: 'absolute',
            top: 1020,
            left: 54,
            right: 54,
            textAlign: 'center',
            opacity: clampInterpolate(tagIn, [0, 1], [0, 1]),
            transform: `translateY(${clampInterpolate(tagIn, [0, 1], [24, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 6px 26px rgba(0,0,0,0.95)',
            }}
          >
            软件的「<span style={{ color: '#5CE1E6' }}>体检医生</span>」
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 30,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              textShadow: '0 4px 16px rgba(0,0,0,0.9)',
            }}
          >
            不用推倒重来 · 专找最卡的 <span style={{ color: '#FFD166' }}>5% 零件</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Scene 3 (392-639f): 真动态东京夜景 + 极速光束流 + 半透明 Claude 终端 + 巨型电影发光数字 */
const Scene3AnimeResult: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const termIn = spring({ frame, fps, config: { damping: 16, stiffness: 170 } });
  const cmd = 'claude > 只把最卡的 5% 换成赛车引擎，并自动对账';
  const typedLen = Math.floor(clampInterpolate(frame, [8, 56], [0, cmd.length]));

  const raceIn = spring({ frame: Math.max(0, frame - 92), fps, config: { damping: 14, stiffness: 190 } });
  const fastSec = clampInterpolate(frame, [100, 128], [60.0, 1.6]);
  const multIn = spring({ frame: Math.max(0, frame - 135), fps, config: { damping: 12, stiffness: 220 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#060912', overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      {/* L0 真动态夜景 + 100 帧后开启 30x 极速光束流粒子 */}
      <LiveTokyoNightCanvas speedBoost={frame >= 100} />

      {/* 上半景：半透明磨砂 Claude Code 终端 */}
      <div
        style={{
          position: 'absolute',
          top: 155,
          left: 48,
          right: 64,
          borderRadius: 20,
          backgroundColor: 'rgba(13, 17, 26, 0.82)',
          border: '1.5px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          padding: '28px 32px',
          opacity: clampInterpolate(termIn, [0, 1], [0, 1]),
          transform: `translateY(${clampInterpolate(termIn, [0, 1], [26, 0])}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Terminal size={24} color="#D97757" />
          <span style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 800, color: '#F1F5F9' }}>
            Claude Code · fast-anything
          </span>
        </div>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 28,
            fontWeight: 700,
            color: '#FFD166',
            lineHeight: 1.45,
            minHeight: 82,
          }}
        >
          {cmd.slice(0, typedLen)}
          <span style={{ opacity: frame % 12 < 6 ? 1 : 0, color: '#D97757' }}>▍</span>
        </div>
        {frame >= 62 ? (
          <div style={{ marginTop: 12, fontFamily: theme.fonts.mono, fontSize: 22, color: '#34D399', fontWeight: 700 }}>
            ✓ 5% 热点引擎替换完成 · 128 组自动对账 100% 一致
          </div>
        ) : null}
      </div>

      {/* 中下景：无框巨型电影发光数字对比 */}
      {frame >= 92 ? (
        <div
          style={{
            position: 'absolute',
            top: 560,
            left: 52,
            right: 52,
            textAlign: 'center',
            opacity: clampInterpolate(raceIn, [0, 1], [0, 1]),
            transform: `scale(${clampInterpolate(raceIn, [0, 1], [0.9, 1])})`,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.72)',
              textDecoration: 'line-through',
              textShadow: '0 4px 16px rgba(0,0,0,0.9)',
            }}
          >
            原本等待 60.0 秒
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: theme.fonts.mono,
              fontSize: 138,
              fontWeight: 900,
              color: '#34D399',
              lineHeight: 1.0,
              textShadow: '0 0 48px rgba(52, 211, 153, 0.55), 0 10px 30px rgba(0,0,0,0.95)',
            }}
          >
            {fastSec.toFixed(1)}s
          </div>
          {frame >= 135 ? (
            <div
              style={{
                marginTop: 22,
                display: 'inline-block',
                fontSize: 44,
                fontWeight: 900,
                color: '#FFD166',
                letterSpacing: 2,
                textShadow: '0 4px 24px rgba(255, 209, 102, 0.55), 0 4px 12px rgba(0,0,0,0.95)',
                transform: `scale(${clampInterpolate(multIn, [0, 1], [1.3, 1])})`,
                opacity: clampInterpolate(multIn, [0, 1], [0, 1]),
              }}
            >
              速度狂飙 30×+ · 省 95% 成本
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ANIME_CINEMA_V5_FRAMES = 639; // 21.3s @ 30fps

export const AnimeCinemaV5: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = clampInterpolate(frame, [0, durationInFrames], [0, 1]);
  const tagLabel = frame < 166 ? '第四十八期 · 开源周榜' : frame < 392 ? '实拍 · 体检神器' : '实测 · 三十倍提速';

  return (
    <AbsoluteFill style={{ backgroundColor: '#050810' }}>
      <Sequence from={0} durationInFrames={166}>
        <Scene1AnimeHighway />
      </Sequence>
      <Sequence from={166} durationInFrames={226}>
        <Scene2AnimeFisheye />
      </Sequence>
      <Sequence from={392} durationInFrames={247}>
        <Scene3AnimeResult />
      </Sequence>

      <CinemaRuler progress={progress} />
      <AnimeVerticalTag label={tagLabel} />
      <AnimeFilmSubtitles />

      {/* 48kHz 零爆音零吞字主配音 + 轻柔日系 Lo-fi BGM */}
      <Sequence from={0}>
        <Audio src={staticFile('audio/v5-anime.mp3')} volume={0.95} />
      </Sequence>
      <Sequence from={0}>
        <Audio src={staticFile('sfx/anime-lofi-bgm.wav')} volume={0.08} loop />
      </Sequence>
    </AbsoluteFill>
  );
};
