import React from 'react';
import { TrackedClan } from '../types';
import { RankIcon, TrendIcon } from './icons';

interface LeaderboardProps {
  data: TrackedClan[];
  isLoading: boolean;
}

const PointChangeDisplay: React.FC<{ change: number }> = ({ change }) => {
  // Use a small epsilon for floating point comparison to avoid showing -0.000 or +0.000
  if (Math.abs(change) < 0.0001) {
    return <span className="text-gray-500 text-center">-</span>;
  }

  const isGain = change > 0;
  const color = isGain ? 'text-lime-400' : 'text-red-500';
  const sign = isGain ? '+' : '';

  return (
    <div className={`flex items-center justify-center font-semibold text-lg ${color}`}>
      <TrendIcon change={change} />
      <span className="ml-1">{`${sign}${change.toFixed(3)}`}</span>
    </div>
  );
};

const Leaderboard: React.FC<LeaderboardProps> = ({ data, isLoading }) => {
  const formatScore = (score: number) => {
    return score.toFixed(3);
  };

  return (
    <div className="w-full relative text-lg">
      {isLoading && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-cyan-400 animate-pulse"></div>
      )}
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-lg font-bold text-cyan-300 border-b-2 border-cyan-400/50">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-7">Clan</div>
        <div className="col-span-2 text-center">Change</div>
        <div className="col-span-2 text-right">Score</div>
      </div>

      {/* Rows */}
      <div className="">
        {data.map((clan, index) => {
          const rank = index + 1;
          const { name, score, pointChange } = clan;

          return (
            <div
              key={name}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-dashed border-purple-800/60 hover:bg-purple-600/30 transition-colors duration-200"
            >
              <div className="col-span-1 flex justify-center items-center">
                <RankIcon rank={rank} />
              </div>
              <div className="col-span-7 font-medium text-white truncate pr-2 flex items-center">
                <span>{name}</span>
              </div>
              <div className="col-span-2 text-center">
                <PointChangeDisplay change={pointChange} />
              </div>
              <div className="col-span-2 text-right font-semibold text-pink-400">
                {formatScore(score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
