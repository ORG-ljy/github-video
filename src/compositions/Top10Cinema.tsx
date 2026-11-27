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
import { ArrowRightLeft, Star, Terminal, Volume2 } from 'lucide-react';
import top10Data from '../../data/top10-w48-config.json';
import { clampInterpolate } from '../kit/motion';
import { theme } from '../kit/theme';
import { FisheyeCanvas } from '../kit/fisheye/FisheyeCanvas';
import {
  LiveHighwayCanvas,
  LiveTokyoNightCanvas,
} from '../kit/anime/AnimeMotionScenes';

type Top10Item = (typeof top10Data.items)[number];

interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

/** 按标点自动把长口播切分为 12–18 字一句的日影短字幕，按字数比例分配时间 */
function splitIntoCues(text: string, startMs: number, endMs: number): SubtitleCue[] {
  const rawChunks = text
    .split(/(?<=[。！？；，、])/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 合并过短片段，拆分过长片段
  const merged: string[] = [];
  for (const chunk of rawChunks) {
    if (merged.length > 0 && merged[merged.length - 1].length + chunk.length <= 18) {
      merged[merged.length - 1] += chunk;
    } else {
      merged.push(chunk);
    }
  }

  const totalChars = merged.reduce((sum, s) => sum + Math.max(1, s.length), 0);
  const totalDur = endMs - startMs;
  let cursor = startMs;
  return merged.map((seg, i) => {
    const share = i === merged.length - 1 ? endMs - cursor : Math.round((seg.length / totalChars) * totalDur);
    const cue = {
      startMs: cursor,
      endMs: cursor + share,
      text: seg.replace(/[。，；、]+$/, ''),
    };
    cursor += share;
    return cue;
  });
}

/** 顶部极简物理刻度尺 */
const CinemaRuler: React.FC<{ progress: number }> = ({ progress }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 45 }}>
    <div
      style={{
        position: 'relative',
        height: 24,
        backgroundColor: 'rgba(6, 9, 16, 0.56)',
        borderBottom: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${progress * 100}%`,
          backgroundColor: 'rgba(255, 209, 102, 0.24)',
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

/** 右侧边缘日系番剧竖排章节角标 */
const AnimeVerticalTag: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      position: 'absolute',
      top: 56,
      right: 14,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      fontFamily: theme.fonts.sans,
      pointerEvents: 'none',
    }}
  >
    <div style={{ width: 1.5, height: 34, backgroundColor: 'rgba(255, 209, 102, 0.8)' }} />
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
    <div style={{ width: 1.5, height: 34, backgroundColor: 'rgba(255, 255, 255, 0.35)' }} />
  </div>
);

/** MotionFace《排名攀升动效》顶部标题头 */
const RankClimbHeader: React.FC<{ item: Top10Item }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const climb = spring({ frame, fps, config: { damping: 14, stiffness: 210 } });
  const starRoll = Math.round(clampInterpolate(frame, [4, 38], [0, item.stars]));
  const isTop3 = item.rank <= 3;

  return (
    <div style={{ position: 'absolute', top: 68, left: 48, right: 64, zIndex: 25, fontFamily: theme.fonts.sans }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 排名攀升跳动徽章 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 12,
            transform: `translateY(${clampInterpolate(climb, [0, 1], [34, 0])}px) scale(${clampInterpolate(climb, [0, 1], [0.85, 1])})`,
            opacity: clampInterpolate(climb, [0, 1], [0, 1]),
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 26,
              fontWeight: 800,
              color: isTop3 ? '#FFD166' : '#5CE1E6',
              letterSpacing: 2,
            }}
          >
            TOP
          </span>
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 74,
              fontWeight: 900,
              lineHeight: 0.95,
              color: isTop3 ? '#FFD166' : '#FFFFFF',
              textShadow: isTop3
                ? '0 0 28px rgba(255, 209, 102, 0.55), 0 6px 20px rgba(0,0,0,0.9)'
                : '0 6px 20px rgba(0,0,0,0.9)',
            }}
          >
            #{String(item.rank).padStart(2, '0')}
          </span>
        </div>

        {/* 动态滚表 Star 数 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 999,
            backgroundColor: 'rgba(13, 18, 30, 0.72)',
            border: `1.5px solid ${isTop3 ? 'rgba(255, 209, 102, 0.6)' : 'rgba(255,255,255,0.2)'}`,
            fontFamily: theme.fonts.mono,
            fontSize: 26,
            fontWeight: 900,
            color: '#FFD166',
          }}
        >
          <Star size={22} fill="#FFD166" />
          <span>{starRoll.toLocaleString()}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          fontFamily: theme.fonts.mono,
          fontSize: item.name.length > 18 ? 44 : 56,
          fontWeight: 900,
          color: '#FFFFFF',
          letterSpacing: -1,
          textShadow: '0 6px 24px rgba(0,0,0,0.95)',
          opacity: clampInterpolate(climb, [0, 1], [0, 1]),
        }}
      >
        {item.name}
      </div>
    </div>
  );
};

/** MotionFace《六卡片 · 连续运镜空间画廊》开场 3D 透视走廊 */
const HookSpaceGallery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 16, stiffness: 150 } });
  const scrollX = clampInterpolate(frame, [0, 355], [0, -1950]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      <LiveTokyoNightCanvas />

      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 56,
          right: 76,
          textAlign: 'center',
          opacity: clampInterpolate(titleIn, [0, 1], [0, 1]),
          transform: `translateY(${clampInterpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 800, color: '#FFD166', letterSpacing: 4 }}>
          {top10Data.weekLabel} // GITHUB WEEKLY TOP 10
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 78,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            textShadow: '0 10px 36px rgba(0,0,0,0.95)',
          }}
        >
          {top10Data.hook.title}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 34,
            fontWeight: 700,
            color: '#5CE1E6',
            textShadow: '0 4px 18px rgba(0,0,0,0.9)',
          }}
        >
          {top10Data.hook.subtitle}
        </div>
      </div>

      {/* 3D 连续运镜空间画廊（展示真实抓取的仓库截图） */}
      <div
        style={{
          position: 'absolute',
          top: 520,
          left: 0,
          right: 0,
          height: 620,
          perspective: 1200,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 36,
            paddingLeft: 90,
            transform: `translateX(${scrollX}px) rotateX(6deg)`,
          }}
        >
          {top10Data.items.slice(0, 8).map((item, idx) => (
            <div
              key={item.rank}
              style={{
                width: 460,
                height: 520,
                flexShrink: 0,
                borderRadius: 20,
                overflow: 'hidden',
                border: '1.5px solid rgba(255,255,255,0.22)',
                backgroundColor: '#0E1320',
                boxShadow: '0 28px 70px rgba(0,0,0,0.75)',
                transform: `rotateY(${idx % 2 === 0 ? -8 : 8}deg)`,
              }}
            >
              <Img
                src={staticFile(item.imageSrc)}
                style={{ width: '100%', height: 340, objectFit: 'cover', objectPosition: 'top' }}
              />
              <div style={{ padding: '22px 24px' }}>
                <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 900, color: '#FFD166' }}>
                  TOP #{item.rank} · ★ {item.stars.toLocaleString()}
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', marginTop: 8 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 22, color: '#94A3B8', marginTop: 6 }}>{item.badge}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** #10 -> #4 轻快精炼段：MotionFace《画中画旋落交接》+ Playwright 真实滚动录屏 */
const FastRankScene: React.FC<{ item: Top10Item }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 画中画旋落交接（3D 旋转俯冲落地）
  const drop = spring({ frame, fps, config: { damping: 15, stiffness: 165 } });
  const rotZ = clampInterpolate(drop, [0, 1], [-8, 0]);
  const rotY = clampInterpolate(drop, [0, 1], [18, -3]);
  const translateY = clampInterpolate(drop, [0, 1], [-140, 0]);
  const scale = clampInterpolate(drop, [0, 1], [0.82, 1]);
  const zoom = clampInterpolate(frame, [20, 320], [1.0, 1.09]);
  const calloutIn = spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 16, stiffness: 170 } });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      <LiveTokyoNightCanvas />
      <RankClimbHeader item={item} />

      {/* 真实滚动录屏窗口（画中画旋落 + 屏摄扫描线与暗角） */}
      <div
        style={{
          position: 'absolute',
          top: 265,
          left: 44,
          right: 60,
          height: 670,
          borderRadius: 18,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.24)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.78)',
          transform: `perspective(1200px) translateY(${translateY}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
          opacity: clampInterpolate(drop, [0, 1], [0, 1]),
        }}
      >
        {item.videoSrc ? (
          <OffthreadVideo
            src={staticFile(item.videoSrc)}
            muted
            playbackRate={0.45}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
              transformOrigin: '55% 35%',
            }}
          />
        ) : (
          <Img
            src={staticFile(item.imageSrc)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 4px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 45%, transparent 54%, rgba(0,0,0,0.62) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* 无框电影感小白一句话定位 */}
      <div
        style={{
          position: 'absolute',
          top: 995,
          left: 48,
          right: 62,
          textAlign: 'center',
          opacity: clampInterpolate(calloutIn, [0, 1], [0, 1]),
          transform: `translateY(${clampInterpolate(calloutIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            fontSize: 44,
            fontWeight: 900,
            color: '#FFD166',
            textShadow: '0 6px 24px rgba(0,0,0,0.95)',
          }}
        >
          {item.badge}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 30,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.4,
            textShadow: '0 4px 16px rgba(0,0,0,0.95)',
          }}
        >
          {item.analogy}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** #3 nospeaker 专属精讲：colorize + WebGL 鱼眼聚焦 + 触控板震动声波动态可视化 */
const DeepRank3Nospeaker: React.FC<{ item: Top10Item }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colorSweep = clampInterpolate(frame, [0, 24], [0, 100]);
  const grayscaleAmt = clampInterpolate(frame, [0, 24], [1, 0]);
  const focusP = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 24, stiffness: 75 } });
  const zoom = clampInterpolate(focusP, [0, 1], [1.05, 1.5]);
  const mask1 = clampInterpolate(frame, [35, 65], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      <LiveTokyoNightCanvas />
      <RankClimbHeader item={item} />

      {/* 上景：WebGL 鱼眼屏摄聚焦仓库 */}
      <div
        style={{
          position: 'absolute',
          top: 265,
          left: 44,
          right: 60,
          height: 540,
          borderRadius: 18,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,209,102,0.35)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          filter: `grayscale(${grayscaleAmt})`,
        }}
      >
        <FisheyeCanvas
          imageSrc={item.imageSrc}
          focus={{ x: clampInterpolate(focusP, [0, 1], [0.5, 0.72]), y: 0.36 }}
          zoom={zoom}
          strength={1.35}
          moire={{ intensity: 0.2, scale: 820, angle: 0.06 }}
          vignette={{ amount: 0.7, radius: 0.72, softness: 0.44 }}
          rects={[
            { x: 0.68, y: 0.30, w: 0.28, h: 0.08, color: '#ffe200', opacity: 0.92, blend: 'multiply', mask: mask1 },
          ]}
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
              boxShadow: '0 0 32px 12px rgba(255,209,102,0.8)',
            }}
          />
        ) : null}
      </div>

      {/* 下景：MacBook 触控板高频震动声波动态可视化 */}
      <div style={{ position: 'absolute', top: 855, left: 48, right: 60, textAlign: 'center' }}>
        <div
          style={{
            position: 'relative',
            margin: '0 auto',
            width: 760,
            height: 220,
            padding: '0 28px',
            borderRadius: 24,
            border: '2px solid rgba(92, 225, 230, 0.55)',
            backgroundColor: 'rgba(13, 19, 32, 0.78)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* 扩散声波环 */}
          {[0, 1, 2].map((ring) => {
            const prog = ((frame * 2.5 + ring * 33) % 100) / 100;
            return (
              <div
                key={ring}
                style={{
                  position: 'absolute',
                  width: 90 + prog * 540,
                  height: 90 + prog * 540,
                  borderRadius: 999,
                  border: `2.5px solid rgba(92, 225, 230, ${(1 - prog) * 0.7})`,
                }}
              />
            );
          })}
          <Volume2 size={54} color="#5CE1E6" />
          <div style={{ marginTop: 12, fontSize: 30, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            触控板震动马达 → 直接推动空气发声！
          </div>
          <div style={{ marginTop: 6, fontSize: 22, color: '#FFD166', fontWeight: 700 }}>
            不用音响喇叭 · 也能开口唱歌
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** #2 fast-anything 专属精讲：3D 动态高架桥 -> WebGL 鱼眼 -> Claude 终端 + 60s -> 1.6s 极速光束 */
const DeepRank2FastAnything: React.FC<{ item: Top10Item }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phase = frame < 200 ? 0 : frame < 410 ? 1 : 2;
  const fLocal = phase === 0 ? frame : phase === 1 ? frame - 200 : frame - 410;
  const focusP = spring({ frame: Math.max(0, fLocal - 8), fps, config: { damping: 24, stiffness: 75 } });
  const mask1 = clampInterpolate(fLocal, [28, 56], [0, 1]);
  const fastSec = clampInterpolate(fLocal, [35, 70], [60.0, 1.6]);
  const cmd = 'claude > 只把最卡的 5% 换成赛车引擎，并自动对账';
  const typedLen = Math.floor(clampInterpolate(fLocal, [4, 42], [0, cmd.length]));

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      {phase === 0 ? <LiveHighwayCanvas /> : <LiveTokyoNightCanvas speedBoost={phase === 2 && fLocal >= 35} />}
      <RankClimbHeader item={item} />

      {phase === 0 ? (
        <div style={{ position: 'absolute', top: 340, left: 56, right: 70 }}>
          <div style={{ fontSize: 70, fontWeight: 900, color: '#FFFFFF', textShadow: '0 8px 30px rgba(0,0,0,0.95)' }}>
            只堵 <span style={{ color: '#FF5A5F' }}>1 个收费站</span>
          </div>
          <div style={{ marginTop: 18, fontSize: 38, fontWeight: 800, color: '#FFD166', textShadow: '0 4px 18px rgba(0,0,0,0.95)' }}>
            以前却得把整条 10 公里路全拆了重修！
          </div>
        </div>
      ) : null}

      {phase === 1 ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 265,
              left: 44,
              right: 60,
              height: 600,
              borderRadius: 18,
              overflow: 'hidden',
              border: '1.5px solid rgba(255,209,102,0.35)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
            }}
          >
            <FisheyeCanvas
              imageSrc={item.imageSrc}
              focus={{ x: clampInterpolate(focusP, [0, 1], [0.52, 0.73]), y: 0.36 }}
              zoom={clampInterpolate(focusP, [0, 1], [1.05, 1.56])}
              strength={1.38}
              moire={{ intensity: 0.22, scale: 820, angle: 0.06 }}
              vignette={{ amount: 0.72, radius: 0.72, softness: 0.44 }}
              rects={[
                { x: 0.715, y: 0.322, w: 0.255, h: 0.052, color: '#ffe200', opacity: 0.95, blend: 'multiply', mask: mask1 },
              ]}
            />
          </div>
          <div style={{ position: 'absolute', top: 920, left: 52, right: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#FFFFFF', textShadow: '0 6px 24px rgba(0,0,0,0.95)' }}>
              软件的「<span style={{ color: '#5CE1E6' }}>体检医生</span>」· 专找 5% 慢零件
            </div>
          </div>
        </>
      ) : null}

      {phase === 2 ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 270,
              left: 48,
              right: 64,
              borderRadius: 18,
              backgroundColor: 'rgba(13, 17, 26, 0.85)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              padding: '24px 28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Terminal size={22} color="#D97757" />
              <span style={{ fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 800, color: '#F1F5F9' }}>
                Claude Code · fast-anything
              </span>
            </div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: 26, fontWeight: 700, color: '#FFD166', minHeight: 72 }}>
              {cmd.slice(0, typedLen)}▍
            </div>
          </div>

          <div style={{ position: 'absolute', top: 580, left: 48, right: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: 'rgba(255,255,255,0.72)', textDecoration: 'line-through' }}>
              原本等待 60.0 秒
            </div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 136,
                fontWeight: 900,
                color: '#34D399',
                lineHeight: 1.05,
                textShadow: '0 0 44px rgba(52,211,153,0.6), 0 8px 28px rgba(0,0,0,0.95)',
              }}
            >
              {fastSec.toFixed(1)}s
            </div>
            <div style={{ marginTop: 14, fontSize: 42, fontWeight: 900, color: '#FFD166' }}>
              速度翻 30×+ · 省 95% 改造成本
            </div>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** #1 VIctory 压轴王炸：colorize + WebGL 鱼眼聚焦 + MotionFace《一张卡拆成两类》主机->PC 实时翻译对比 */
const DeepRank1Victory: React.FC<{ item: Top10Item }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colorSweep = clampInterpolate(frame, [0, 26], [0, 100]);
  const grayscaleAmt = clampInterpolate(frame, [0, 26], [1, 0]);
  const focusP = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 24, stiffness: 75 } });
  const splitIn = spring({ frame: Math.max(0, frame - 140), fps, config: { damping: 14, stiffness: 180 } });
  const splitOffset = clampInterpolate(splitIn, [0, 1], [0, 14]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      <LiveTokyoNightCanvas speedBoost={frame >= 320} />
      <RankClimbHeader item={item} />

      {/* WebGL 鱼眼聚焦 Marvisak/VIctory 仓库 */}
      <div
        style={{
          position: 'absolute',
          top: 265,
          left: 44,
          right: 60,
          height: 520,
          borderRadius: 18,
          overflow: 'hidden',
          border: '2px solid rgba(255, 209, 102, 0.55)',
          boxShadow: '0 32px 84px rgba(0,0,0,0.85)',
          filter: `grayscale(${grayscaleAmt})`,
        }}
      >
        <FisheyeCanvas
          imageSrc={item.imageSrc}
          focus={{ x: clampInterpolate(focusP, [0, 1], [0.5, 0.68]), y: 0.34 }}
          zoom={clampInterpolate(focusP, [0, 1], [1.05, 1.48])}
          strength={1.35}
          moire={{ intensity: 0.22, scale: 820, angle: 0.06 }}
          vignette={{ amount: 0.7, radius: 0.72, softness: 0.44 }}
          rects={[
            { x: 0.68, y: 0.28, w: 0.28, h: 0.09, color: '#ffe200', opacity: 0.92, blend: 'multiply', mask: clampInterpolate(frame, [35, 65], [0, 1]) },
          ]}
        />
        {colorSweep < 99 ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${colorSweep}%`,
              width: 8,
              backgroundColor: '#FFD166',
              boxShadow: '0 0 40px 16px rgba(255,209,102,0.85)',
            }}
          />
        ) : null}
      </div>

      {/* MotionFace《一张卡拆成两类》：主机底层指令 ⇄ PC 实时翻译 */}
      <div
        style={{
          position: 'absolute',
          top: 830,
          left: 44,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 14,
          opacity: clampInterpolate(splitIn, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            borderRadius: 18,
            backgroundColor: 'rgba(255, 77, 79, 0.14)',
            border: '1.5px solid rgba(255, 77, 79, 0.5)',
            padding: '26px 20px',
            textAlign: 'center',
            transform: `translateX(${-splitOffset}px)`,
          }}
        >
          <div style={{ fontSize: 22, color: '#FCA5A5', fontWeight: 700 }}>以前 · 主机独占</div>
          <div style={{ fontSize: 36, color: '#FFFFFF', fontWeight: 900, marginTop: 8 }}>GTA 6 主机指令</div>
          <div style={{ fontSize: 22, color: '#94A3B8', marginTop: 8 }}>电脑根本打不开</div>
        </div>

        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 999,
            backgroundColor: '#FFD166',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(255,209,102,0.6)',
          }}
        >
          <ArrowRightLeft size={28} color="#111111" />
        </div>

        <div
          style={{
            borderRadius: 18,
            backgroundColor: 'rgba(52, 211, 153, 0.14)',
            border: '1.5px solid rgba(52, 211, 153, 0.55)',
            padding: '26px 20px',
            textAlign: 'center',
            transform: `translateX(${splitOffset}px)`,
          }}
        >
          <div style={{ fontSize: 22, color: '#A7F3D0', fontWeight: 700 }}>现在 · 实时翻译</div>
          <div style={{ fontSize: 36, color: '#34D399', fontWeight: 900, marginTop: 8 }}>搬上普通 PC</div>
          <div style={{ fontSize: 22, color: '#CBD5E1', marginTop: 8 }}>一周狂飙 13,672★</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 结尾全榜 10 项速览墙 + 评论区互动引导 */
const OutroTop10Wall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inSpring = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: theme.fonts.sans }}>
      <LiveTokyoNightCanvas />
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 48,
          right: 60,
          opacity: clampInterpolate(inSpring, [0, 1], [0, 1]),
          transform: `translateY(${clampInterpolate(inSpring, [0, 1], [28, 0])}px)`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 22, color: '#FFD166', fontWeight: 800, letterSpacing: 3 }}>
            {top10Data.weekLabel} 完整榜单速览
          </div>
          <div style={{ fontSize: 58, fontWeight: 900, color: '#FFFFFF', marginTop: 10 }}>
            {top10Data.outro.title}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[...top10Data.items].reverse().map((item) => (
            <div
              key={item.rank}
              style={{
                borderRadius: 14,
                backgroundColor: item.rank <= 3 ? 'rgba(255, 209, 102, 0.14)' : 'rgba(15, 21, 35, 0.78)',
                border: `1.5px solid ${item.rank <= 3 ? 'rgba(255, 209, 102, 0.55)' : 'rgba(255,255,255,0.14)'}`,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: theme.fonts.mono, fontSize: 18, fontWeight: 900, color: item.rank <= 3 ? '#FFD166' : '#5CE1E6' }}>
                  #{String(item.rank).padStart(2, '0')} · {item.name}
                </div>
                <div style={{ fontSize: 18, color: '#CBD5E1', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.badge}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              borderRadius: 999,
              backgroundColor: '#FFD166',
              color: '#111111',
              fontSize: 30,
              fontWeight: 900,
              boxShadow: '0 10px 30px rgba(255,209,102,0.4)',
            }}
          >
            {top10Data.outro.subtitle}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TOP10_CINEMA_FRAMES = Math.round(top10Data.totalDurationSec * 30);

export const Top10Cinema: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const progress = clampInterpolate(frame, [0, durationInFrames], [0, 1]);

  const allCues = useMemo(() => {
    const cues: SubtitleCue[] = [];
    cues.push(...splitIntoCues(top10Data.hook.text, top10Data.hook.startMs, top10Data.hook.endMs - 200));
    for (const item of top10Data.items) {
      cues.push(...splitIntoCues(item.text, item.startMs, item.endMs - 250));
    }
    cues.push(...splitIntoCues(top10Data.outro.text, top10Data.outro.startMs, top10Data.outro.endMs - 300));
    return cues;
  }, []);

  const activeCue = allCues.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  const msToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050810' }}>
      {/* 开场 3D 空间画廊 */}
      <Sequence from={0} durationInFrames={msToFrames(top10Data.hook.endMs)}>
        <HookSpaceGallery />
      </Sequence>

      {/* Top 10 逐项精准卡点序列 */}
      {top10Data.items.map((item) => {
        const from = msToFrames(item.startMs);
        const dur = Math.max(1, msToFrames(item.endMs) - from);
        return (
          <Sequence key={item.rank} from={from} durationInFrames={dur}>
            {item.special === 'nospeaker' ? (
              <DeepRank3Nospeaker item={item} />
            ) : item.special === 'fast-anything' ? (
              <DeepRank2FastAnything item={item} />
            ) : item.special === 'victory' ? (
              <DeepRank1Victory item={item} />
            ) : (
              <FastRankScene item={item} />
            )}
          </Sequence>
        );
      })}

      {/* 结尾 10 项清单墙 */}
      <Sequence
        from={msToFrames(top10Data.outro.startMs)}
        durationInFrames={durationInFrames - msToFrames(top10Data.outro.startMs)}
      >
        <OutroTop10Wall />
      </Sequence>

      <CinemaRuler progress={progress} />
      <AnimeVerticalTag label={top10Data.episodeLabel} />

      {/* 纯日影无框大字字幕（抖音底部安全区上方） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 540,
          background: 'linear-gradient(to top, rgba(4,7,14,0.9) 0%, rgba(4,7,14,0.45) 55%, transparent 100%)',
          zIndex: 35,
          pointerEvents: 'none',
        }}
      />
      {activeCue ? (
        <div
          style={{
            position: 'absolute',
            top: 1435,
            left: 44,
            right: 44,
            textAlign: 'center',
            zIndex: 50,
            fontFamily: theme.fonts.sans,
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1.35,
            color: '#FFFFFF',
            textShadow: '0 4px 20px rgba(0,0,0,0.96), 0 0 8px rgba(0,0,0,0.95), 2px 2px 0 rgba(0,0,0,0.9)',
          }}
        >
          {activeCue.text}
        </div>
      ) : null}

      {/* 48kHz 零爆音零吞字主配音 + 轻柔循环日系 Lo-fi BGM */}
      <Sequence from={0}>
        <Audio src={staticFile(top10Data.audioSrc)} volume={0.95} />
      </Sequence>
      <Sequence from={0}>
        <Audio src={staticFile(top10Data.bgmSrc)} volume={0.07} loop />
      </Sequence>
    </AbsoluteFill>
  );
};
