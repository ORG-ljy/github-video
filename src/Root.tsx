import React from 'react';
import { Composition } from 'remotion';
import sampleData from '../data/weekly-sample.json';
import { WeeklyRankingPropsSchema } from './schema/ranking';
import {
  WeeklyRanking,
  calcWeeklyRankingDurationFrames,
} from './compositions/WeeklyRanking';
import { theme } from './kit/theme';

const parsedDefaultProps = WeeklyRankingPropsSchema.parse(sampleData);

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
