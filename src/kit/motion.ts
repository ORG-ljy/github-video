import { Easing, interpolate, spring } from 'remotion';

/**
 * 确定性插值封装：强制开启 extrapolateLeft/Right: 'clamp'，避免渲染溢出闪烁
 */
export function clampInterpolate(
  frame: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  easing?: (t: number) => number,
): number {
  return interpolate(frame, inputRange, outputRange, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
}

/**
 * 常用弹性入场预设（无 CSS 动画，纯 frame 驱动）
 */
export function enterSpring(frame: number, fps: number, delayFrames = 0): number {
  return spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 16,
      stiffness: 160,
      mass: 0.9,
    },
  });
}

/**
 * 数字滚动动画（用于 Star 数递增动效）
 */
export function countUp(
  frame: number,
  startFrame: number,
  durationFrames: number,
  target: number,
): number {
  const progress = clampInterpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    Easing.out(Easing.cubic),
  );
  return Math.round(target * progress);
}
