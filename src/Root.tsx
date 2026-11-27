import React from 'react';
import { Composition } from 'remotion';
import sampleData from '../data/weekly-sample.json';
import { WeeklyRankingPropsSchema } from './schema/ranking';
import {
  WeeklyRanking,
  calcWeeklyRankingDurationFrames,
} from './compositions/WeeklyRanking';
import {
  MangaDeepDive,
  MANGA_DEEP_DIVE_FRAMES,
} from './compositions/MangaDeepDive';
import {
  VibeCinemaDeepDive,
  VIBE_CINEMA_FRAMES,
} from './compositions/VibeCinemaDeepDive';
import {
  AnimeCinemaV5,
  ANIME_CINEMA_V5_FRAMES,
} from './compositions/AnimeCinemaV5';
import {
  Top10Cinema,
  TOP10_CINEMA_FRAMES,
} from './compositions/Top10Cinema';
import {
  DetectiveCase10s,
  DETECTIVE_10S_FRAMES,
} from './compositions/DetectiveCase10s';
import {
  WeeklyDetectiveFull,
  WEEKLY_DETECTIVE_FULL_FRAMES,
} from './compositions/WeeklyDetectiveFull';
import { theme } from './kit/theme';

const parsedDefaultProps = WeeklyRankingPropsSchema.parse(sampleData);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WeeklyDetectiveFullVertical"
        component={WeeklyDetectiveFull}
        durationInFrames={WEEKLY_DETECTIVE_FULL_FRAMES}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
      />

      <Composition
        id="DetectiveCase10sVertical"
        component={DetectiveCase10s}
        durationInFrames={DETECTIVE_10S_FRAMES}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
      />

      <Composition
        id="Top10CinemaVertical"
        component={Top10Cinema}
        durationInFrames={TOP10_CINEMA_FRAMES}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
      />

      <Composition
        id="AnimeCinemaV5Vertical"
        component={AnimeCinemaV5}
        durationInFrames={ANIME_CINEMA_V5_FRAMES}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
      />

      <Composition
        id="VibeCinemaVertical"
        component={VibeCinemaDeepDive}
        durationInFrames={VIBE_CINEMA_FRAMES}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
      />

      <Composition
        id="MangaDeepDiveVertical"
        component={MangaDeepDive}
        durationInFrames={MANGA_DEEP_DIVE_FRAMES}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
      />

      <Composition
        id="WeeklyRankingVertical"
        component={WeeklyRanking}
        schema={WeeklyRankingPropsSchema}
        defaultProps={parsedDefaultProps}
        fps={theme.fps}
        width={theme.vertical.width}
        height={theme.vertical.height}
        calculateMetadata={({ props }) => ({
          durationInFrames: calcWeeklyRankingDurationFrames(props, theme.fps),
        })}
      />

      <Composition
        id="WeeklyRankingLandscape"
        component={WeeklyRanking}
        schema={WeeklyRankingPropsSchema}
        defaultProps={parsedDefaultProps}
        fps={theme.fps}
        width={theme.landscape.width}
        height={theme.landscape.height}
        calculateMetadata={({ props }) => ({
          durationInFrames: calcWeeklyRankingDurationFrames(props, theme.fps),
        })}
      />
    </>
  );
};
