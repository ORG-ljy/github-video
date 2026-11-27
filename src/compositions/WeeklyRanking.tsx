import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Flame, Github, Sparkles } from 'lucide-react';
import type { WeeklyRankingProps } from '../schema/ranking';
import { Backdrop } from '../kit/components/Backdrop';
import { RankCard } from '../kit/components/RankCard';
import { SrtCaptions } from '../kit/components/SrtCaptions';
import { clampInterpolate, enterSpring } from '../kit/motion';
import { theme } from '../kit/theme';

const TRANSITION_FRAMES = 12;

export function calcWeeklyRankingDurationFrames(
  props: WeeklyRankingProps,
  fps: number,
): number {
  const introFrames = Math.round(props.introDurationSec * fps);
  const itemFrames = Math.round(props.itemDurationSec * fps);
  const outroFrames = Math.round(props.outroDurationSec * fps);
  const transitionCount = props.items.length + 1;
  return (
    introFrames +
    props.items.length * itemFrames +
    outroFrames -
    transitionCount * TRANSITION_FRAMES
  );
}

const IntroSlide: React.FC<{
  issueTitle: string;
  weekLabel: string;
  subtitle: string;
  isVertical: boolean;
}> = ({ issueTitle, weekLabel, subtitle, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = enterSpring(frame, fps, 0);
  const titleSpring = enterSpring(frame, fps, 6);
  const subSpring = enterSpring(frame, fps, 14);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '0 72px' : '0 140px',
        fontFamily: theme.fonts.sans,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 28px',
          borderRadius: 999,
          backgroundColor: 'rgba(56, 189, 248, 0.16)',
          border: `1.5px solid ${theme.colors.accentPrimary}`,
          color: theme.colors.accentPrimary,
          fontSize: isVertical ? 30 : 28,
          fontWeight: 700,
          marginBottom: 36,
          transform: `translateY(${clampInterpolate(badgeSpring, [0, 1], [30, 0])}px)`,
          opacity: clampInterpolate(badgeSpring, [0, 1], [0, 1]),
        }}
      >
        <Github size={30} />
        <span>{weekLabel}</span>
      </div>

      <div
        style={{
          fontSize: isVertical ? 84 : 88,
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: -1,
          color: theme.colors.textPrimary,
          transform: `scale(${clampInterpolate(titleSpring, [0, 1], [0.9, 1])}) translateY(${clampInterpolate(titleSpring, [0, 1], [40, 0])}px)`,
          opacity: clampInterpolate(titleSpring, [0, 1], [0, 1]),
        }}
      >
        {issueTitle}
      </div>

      <div
        style={{
          marginTop: 28,
          fontSize: isVertical ? 36 : 34,
          color: theme.colors.textSecondary,
          maxWidth: isVertical ? 860 : 1200,
          lineHeight: 1.5,
          transform: `translateY(${clampInterpolate(subSpring, [0, 1], [28, 0])}px)`,
          opacity: clampInterpolate(subSpring, [0, 1], [0, 1]),
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

const OutroSlide: React.FC<{
  title: string;
  subtitle: string;
  isVertical: boolean;
}> = ({ title, subtitle, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s1 = enterSpring(frame, fps, 0);
  const s2 = enterSpring(frame, fps, 10);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '0 72px' : '0 140px',
        fontFamily: theme.fonts.sans,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 26px',
          borderRadius: 999,
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          border: `1.5px solid ${theme.colors.accentSecondary}`,
          color: '#E9D5FF',
          fontSize: isVertical ? 28 : 26,
          fontWeight: 700,
          marginBottom: 32,
          opacity: clampInterpolate(s1, [0, 1], [0, 1]),
        }}
      >
        <Sparkles size={26} />
        <span>本期榜单完结</span>
      </div>

      <div
        style={{
          fontSize: isVertical ? 64 : 68,
          fontWeight: 900,
          lineHeight: 1.25,
          color: theme.colors.textPrimary,
          transform: `translateY(${clampInterpolate(s1, [0, 1], [32, 0])}px)`,
          opacity: clampInterpolate(s1, [0, 1], [0, 1]),
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 26,
          fontSize: isVertical ? 32 : 30,
          color: theme.colors.textSecondary,
          transform: `translateY(${clampInterpolate(s2, [0, 1], [24, 0])}px)`,
          opacity: clampInterpolate(s2, [0, 1], [0, 1]),
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

export const WeeklyRanking: React.FC<WeeklyRankingProps> = (props) => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const isVertical = height > width;

  const introFrames = Math.round(props.introDurationSec * fps);
  const itemFrames = Math.round(props.itemDurationSec * fps);
  const outroFrames = Math.round(props.outroDurationSec * fps);

  const progressRatio = clampInterpolate(frame, [0, durationInFrames], [0, 1]);

  return (
    <AbsoluteFill>
      <Backdrop />

      {/* 顶部常驻进度条与栏目水印 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: 'rgba(148, 163, 184, 0.16)',
          zIndex: 30,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressRatio * 100}%`,
            background: `linear-gradient(90deg, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: isVertical ? 56 : 36,
          left: isVertical ? 54 : 64,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: theme.colors.textSecondary,
          fontFamily: theme.fonts.mono,
          fontSize: isVertical ? 24 : 20,
          fontWeight: 600,
          zIndex: 20,
        }}
      >
        <Flame size={22} color={theme.colors.accentPrimary} />
        <span>GITHUB WEEKLY RANKING · {props.weekLabel}</span>
      </div>

      {/* 主镜头序列（Intro → Top N 榜单卡片 → Outro） */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={introFrames}>
          <IntroSlide
            issueTitle={props.issueTitle}
            weekLabel={props.weekLabel}
            subtitle={props.subtitle}
            isVertical={isVertical}
          />
        </TransitionSeries.Sequence>

        {props.items.map((item) => (
          <React.Fragment key={item.fullName}>
            <TransitionSeries.Transition
              presentation={slide({ direction: 'from-right' })}
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
            />
            <TransitionSeries.Sequence durationInFrames={itemFrames}>
              <AbsoluteFill
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <RankCard item={item} isVertical={isVertical} />
              </AbsoluteFill>
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={outroFrames}>
          <OutroSlide
            title={props.outroTitle}
            subtitle={props.outroSubtitle}
            isVertical={isVertical}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 可选配音轨（放在 public/ 下） */}
      {props.audioSrc ? (
        <Sequence from={0}>
          <Audio src={staticFile(props.audioSrc)} />
        </Sequence>
      ) : null}

      {/* 可选帧级字幕 */}
      {props.captions.length > 0 ? (
        <SrtCaptions captions={props.captions} isVertical={isVertical} />
      ) : null}
    </AbsoluteFill>
  );
};
