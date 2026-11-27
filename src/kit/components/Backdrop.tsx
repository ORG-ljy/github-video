import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

interface BackdropProps {
  accent?: string;
}

/**
 * 科技感动态背景（纯 frame 驱动，遵循确定性渲染规范）
 */
export const Backdrop: React.FC<BackdropProps> = ({
  accent = theme.colors.accentPrimary,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const gridOffset = (frame * 0.8) % 64;
  const glowX = Math.sin(frame / 45) * 80;
  const glowY = Math.cos(frame / 60) * 60;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* 柔和径向光晕 */}
      <div
        style={{
          position: 'absolute',
          left: width * 0.15 + glowX,
          top: height * 0.12 + glowY,
          width: width * 0.75,
          height: width * 0.75,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}2E 0%, transparent 65%)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: width * 0.05 - glowX * 0.6,
          bottom: height * 0.08 - glowY * 0.6,
          width: width * 0.65,
          height: width * 0.65,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.accentSecondary}28 0%, transparent 65%)`,
          filter: 'blur(70px)',
        }}
      />

      {/* 缓动透视网格 */}
      <div
        style={{
          position: 'absolute',
          inset: -64,
          backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          transform: `translate3d(0px, ${gridOffset}px, 0px)`,
        }}
      />
    </AbsoluteFill>
  );
};
