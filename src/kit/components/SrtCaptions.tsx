import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { CaptionCue } from '../../schema/ranking';
import { theme } from '../theme';

interface SrtCaptionsProps {
  captions: CaptionCue[];
  isVertical: boolean;
}

/**
 * 帧级精确中文字幕组件（配合 scripts/generate-tts.py 生成的 SRT/JSON 时间轴）
 */
export const SrtCaptions: React.FC<SrtCaptionsProps> = ({ captions, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const active = captions.find(
    (cue) => currentMs >= cue.startMs && currentMs <= cue.endMs,
  );

  if (!active) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: isVertical ? 140 : 64,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 48px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: isVertical ? 940 : 1400,
          padding: '14px 28px',
          borderRadius: 18,
          backgroundColor: 'rgba(7, 9, 16, 0.78)',
          border: '1px solid rgba(248, 250, 252, 0.16)',
          color: '#FFFFFF',
          fontFamily: theme.fonts.sans,
          fontSize: isVertical ? 40 : 34,
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.35,
          textShadow: '0 4px 16px rgba(0,0,0,0.8)',
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
