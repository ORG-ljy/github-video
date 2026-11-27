import { z } from 'zod';

export const RepoItemSchema = z.object({
  rank: z.number().int().positive(),
  name: z.string(),
  fullName: z.string(),
  tagline: z.string(),
  description: z.string(),
  stars: z.number().int().nonnegative(),
  weeklyStars: z.number().int().nonnegative().optional(),
  language: z.string().default('TypeScript'),
  highlights: z.array(z.string()).max(4).default([]),
  url: z.string(),
});

export const CaptionCueSchema = z.object({
  startMs: z.number().nonnegative(),
  endMs: z.number().positive(),
  text: z.string(),
});

export const WeeklyRankingPropsSchema = z.object({
  issueTitle: z.string(),
  weekLabel: z.string(),
  subtitle: z.string(),
  outroTitle: z.string().default('关注我，每周精选 GitHub 宝藏工具'),
  outroSubtitle: z.string().default('点赞 · 收藏 · 评论区告诉我你最想看哪个项目'),
  introDurationSec: z.number().positive().default(3.0),
  itemDurationSec: z.number().positive().default(4.5),
  outroDurationSec: z.number().positive().default(2.5),
  audioSrc: z.string().optional(),
  captions: z.array(CaptionCueSchema).default([]),
  items: z.array(RepoItemSchema).min(1),
});

export type RepoItem = z.infer<typeof RepoItemSchema>;
export type CaptionCue = z.infer<typeof CaptionCueSchema>;
export type WeeklyRankingProps = z.infer<typeof WeeklyRankingPropsSchema>;
