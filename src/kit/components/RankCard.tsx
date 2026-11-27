import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Star, TrendingUp, Code2, ExternalLink } from 'lucide-react';
import type { RepoItem } from '../../schema/ranking';
import { clampInterpolate, countUp, enterSpring } from '../motion';
import { theme } from '../theme';

interface RankCardProps {
  item: RepoItem;
  isVertical: boolean;
}

export const RankCard: React.FC<RankCardProps> = ({ item, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = enterSpring(frame, fps, 0);
  const translateY = clampInterpolate(cardSpring, [0, 1], [60, 0]);
  const scale = clampInterpolate(cardSpring, [0, 1], [0.94, 1]);
  const opacity = clampInterpolate(frame, [0, 10], [0, 1]);

  const animatedStars = countUp(frame, 6, 26, item.stars);
  const animatedWeekly = item.weeklyStars
    ? countUp(frame, 10, 24, item.weeklyStars)
    : undefined;

  const rankBadgeColor =
    item.rank === 1
      ? theme.colors.accentGold
      : item.rank === 2
        ? '#E2E8F0'
        : item.rank === 3
          ? '#FB923C'
          : theme.colors.accentPrimary;

  return (
    <div
      style={{
        width: isVertical ? '90%' : '78%',
        maxWidth: isVertical ? 960 : 1440,
        padding: isVertical ? '52px 44px' : '56px 64px',
        borderRadius: 36,
        backgroundColor: theme.colors.cardBg,
        border: `2px solid ${theme.colors.cardBorder}`,
        boxShadow: '0 28px 90px rgba(0, 0, 0, 0.55)',
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        fontFamily: theme.fonts.sans,
        color: theme.colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        gap: isVertical ? 30 : 26,
      }}
    >
      {/* 顶栏：排名徽章 + 编程语言 + Star 统计 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              padding: '10px 26px',
              borderRadius: 999,
              backgroundColor: `${rankBadgeColor}22`,
              border: `2px solid ${rankBadgeColor}`,
              color: rankBadgeColor,
              fontSize: isVertical ? 36 : 32,
              fontWeight: 800,
              fontFamily: theme.fonts.mono,
              letterSpacing: 1,
            }}
          >
            TOP #{item.rank}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              borderRadius: 999,
              backgroundColor: 'rgba(148, 163, 184, 0.14)',
              color: theme.colors.textSecondary,
              fontSize: isVertical ? 26 : 24,
              fontWeight: 600,
            }}
          >
            <Code2 size={24} color={theme.colors.accentPrimary} />
            <span>{item.language}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: theme.fonts.mono,
              fontSize: isVertical ? 34 : 32,
              fontWeight: 700,
              color: theme.colors.accentGold,
            }}
          >
            <Star size={30} fill={theme.colors.accentGold} color={theme.colors.accentGold} />
            <span>{animatedStars.toLocaleString()}</span>
          </div>
          {animatedWeekly !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 14,
                backgroundColor: 'rgba(52, 211, 153, 0.16)',
                color: theme.colors.accentGreen,
                fontFamily: theme.fonts.mono,
                fontSize: isVertical ? 26 : 24,
                fontWeight: 700,
              }}
            >
              <TrendingUp size={22} />
              <span>+{animatedWeekly.toLocaleString()} / 周</span>
            </div>
          )}
        </div>
      </div>

      {/* 仓库名称与一句话定位 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontSize: isVertical ? 58 : 54,
            fontWeight: 900,
            letterSpacing: -0.5,
            lineHeight: 1.15,
            color: theme.colors.textPrimary,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: isVertical ? 34 : 30,
            fontWeight: 700,
            color: theme.colors.accentPrimary,
            lineHeight: 1.35,
          }}
        >
          {item.tagline}
        </div>
        <div
          style={{
            fontSize: isVertical ? 28 : 25,
            color: theme.colors.textSecondary,
            lineHeight: 1.55,
          }}
        >
          {item.description}
        </div>
      </div>

      {/* 核心亮点列表（逐条弹入） */}
      {item.highlights.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
            gap: 16,
            marginTop: 4,
          }}
        >
          {item.highlights.map((point, idx) => {
            const pSpring = enterSpring(frame, fps, 12 + idx * 5);
            const pY = clampInterpolate(pSpring, [0, 1], [24, 0]);
            const pOpacity = clampInterpolate(pSpring, [0, 1], [0, 1]);
            return (
              <div
                key={idx}
                style={{
                  padding: '18px 22px',
                  borderRadius: 18,
                  backgroundColor: 'rgba(30, 41, 59, 0.72)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: isVertical ? 26 : 23,
                  lineHeight: 1.4,
                  color: '#E2E8F0',
                  transform: `translateY(${pY}px)`,
                  opacity: pOpacity,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: theme.colors.accentPrimary,
                    flexShrink: 0,
                  }}
                />
                <span>{point}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部 GitHub 路径 */}
      <div
        style={{
          marginTop: 6,
          paddingTop: 20,
          borderTop: '1px solid rgba(148, 163, 184, 0.16)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: theme.colors.textSecondary,
          fontFamily: theme.fonts.mono,
          fontSize: isVertical ? 24 : 22,
        }}
      >
        <ExternalLink size={20} color={theme.colors.accentPrimary} />
        <span>github.com/{item.fullName}</span>
      </div>
    </div>
  );
};
