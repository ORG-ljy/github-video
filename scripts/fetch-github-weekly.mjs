#!/usr/bin/env node
/**
 * 抓取最近 7 天在 GitHub 上创建的 Star 最高热门工具仓库，并生成可供 Remotion 直接渲染的 JSON。
 * 用法：node scripts/fetch-github-weekly.mjs [--limit=5] [--out=data/weekly-latest.json]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v = 'true'] = arg.replace(/^--/, '').split('=');
    return [k, v];
  }),
);

const limit = Number(args.limit || 5);
const outPath = args.out || 'data/weekly-latest.json';

const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const sinceDate = sevenDaysAgo.toISOString().slice(0, 10);

function getWeekLabel(date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
  return `${temp.getUTCFullYear()} W${String(weekNo).padStart(2, '0')}`;
}

async function fetchRepos() {
  const query = `created:>=${sinceDate}`;
  try {
    const raw = execFileSync(
      'gh',
      [
        'api',
        `search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return JSON.parse(raw).items || [];
  } catch {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'github-video-fetcher' },
    });
    if (!res.ok) {
      throw new Error(`GitHub API 请求失败: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.items || [];
  }
}

const repos = await fetchRepos();
const payload = {
  issueTitle: 'GitHub 一周热门工具排行',
  weekLabel: getWeekLabel(now),
  subtitle: `统计自 ${sinceDate} 以来 Star 增长最快的开源项目`,
  outroTitle: '关注我，每周精选 GitHub 宝藏工具',
  outroSubtitle: '点赞 · 收藏 · 评论区告诉我你最想看哪个项目',
  introDurationSec: 2.5,
  itemDurationSec: 4.5,
  outroDurationSec: 2.0,
  captions: [],
  items: repos.map((repo, index) => ({
    rank: index + 1,
    name: repo.name,
    fullName: repo.full_name,
    tagline: repo.description ? repo.description.slice(0, 42) : '本周热门开源项目',
    description: repo.description || '暂无简介，建议结合仓库 README 补充中文亮点。',
    stars: repo.stargazers_count || 0,
    language: repo.language || 'Unknown',
    highlights: (repo.topics || []).slice(0, 4).map((t) => `#${t}`),
    url: repo.html_url,
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`已生成 ${payload.items.length} 条本周热门项目数据 -> ${outPath}`);
