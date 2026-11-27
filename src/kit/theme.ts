export const theme = {
  colors: {
    bg: '#070910',
    bgElevated: '#101524',
    cardBg: 'rgba(17, 24, 39, 0.82)',
    cardBorder: 'rgba(148, 163, 184, 0.22)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    accentPrimary: '#38BDF8', // Cyan-Blue
    accentSecondary: '#A855F7', // Violet
    accentGold: '#FACC15',
    accentGreen: '#34D399',
  },
  fonts: {
    sans: '"Noto Sans CJK SC", "Noto Sans CJK JP", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fps: 30,
  vertical: {
    width: 1080,
    height: 1920,
  },
  landscape: {
    width: 1920,
    height: 1080,
  },
} as const;
