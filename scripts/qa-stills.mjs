#!/usr/bin/env node
/**
 * 批量抽帧静帧 QA 脚本（参考 vibe-motion/remotion-starter 的渲染前视觉自检流程）
 * 用法：node scripts/qa-stills.mjs [WeeklyRankingVertical]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const compositionId = process.argv[2] || 'WeeklyRankingVertical';
const frames = [20, 95, 210, 325, 420];
const outDir = 'out/qa';

mkdirSync(outDir, { recursive: true });

for (const frame of frames) {
  const outFile = `${outDir}/${compositionId}-f${frame}.png`;
  console.log(`正在抽取第 ${frame} 帧 -> ${outFile}`);
  execFileSync(
    'pnpm',
    ['exec', 'remotion', 'still', compositionId, outFile, `--frame=${frame}`, '--scale=0.5'],
    { stdio: 'inherit' },
  );
}

console.log(`QA 抽帧完成，请查看 ${outDir}/ 目录。`);
