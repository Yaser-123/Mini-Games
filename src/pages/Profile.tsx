import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface GameStats {
  id: string;
  title: string;
  gamesPlayed: number;
  wins: number;
  highScore: number;
}

interface MatchHistory {
  id: string;
  game: string;
  result: 'win' | 'loss';
  score: number;
  date: string;
}

const mockGameStats: GameStats[] = [
  {
    id: 'space-battle',
    title: 'Space Battle',
    gamesPlayed: 25,
    wins: 15,
    highScore: 2500,
  },
  {
    id: 'maze-runner',
    title: 'Maze Runner',
    gamesPlayed: 18,
    wins: 10,
    highScore: 1800,
  },
  {
    id: 'pixel-platformer',
    title: 'Pixel Platformer',
    gamesPlayed: 30,
    wins: 20,
    highScore: 3000,
  },
  {
    id: 'puzzle-master',
    title: 'Puzzle Master',
    gamesPlayed: 22,
    wins: 12,
    highScore: 2200,
  },
];

const mockMatchHistory: MatchHistory[] = [
  {
    id: '1',
    game: 'Space Battle',
    result: 'win',
    score: 2500,
    date: '2023-06-30',
  },
  {
    id: '2',
    game: 'Maze Runner',
    result: 'loss',
    score: 1500,
    date: '2023-06-29',
  },
  {
    id: '3',
    game: 'Pixel Platformer',
    result: 'win',
    score: 3000,
    date: '2023-06-28',
  },
  {
    id: '4',
    game: 'Puzzle Master',
    result: 'win',
    score: 2200,
    date: '2023-06-27',
  },
];

const Profile = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-8"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
            {currentUser?.email?.[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">{currentUser?.email}</h2>
            <p className="text-gray-400">Member since June 2023</p>
          </div>
        </div>
      </motion.div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn ${activeTab === 'stats' ? 'bg-indigo-600' : 'bg-gray-700'}`}
        >
          Game Stats
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'bg-indigo-600' : 'bg-gray-700'}`}
        >
          Match History
        </button>
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'stats' ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {mockGameStats.map((stat) => (
              <div key={stat.id} className="card">
                <h3 className="text-xl font-bold mb-4">{stat.title}</h3>
                <div className="space-y-2">
                  <p className="text-gray-400">
                    Games Played: <span className="text-white">{stat.gamesPlayed}</span>
                  </p>
                  <p className="text-gray-400">
                    Wins: <span className="text-white">{stat.wins}</span>
                  </p>
                  <p className="text-gray-400">
                    Win Rate:{' '}
                    <span className="text-white">
                      {((stat.wins / stat.gamesPlayed) * 100).toFixed(1)}%
                    </span>
                  </p>
                  <p className="text-gray-400">
                    High Score: <span className="text-white">{stat.highScore}</span>
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="card"
          >
            <div className="space-y-4">
              {mockMatchHistory.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{match.game}</h4>
                    <p className="text-sm text-gray-400">{match.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-gray-400">
                      Score: <span className="text-white">{match.score}</span>
                    </p>
                    <span
                      className={`px-2 py-1 rounded ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      {match.result.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;