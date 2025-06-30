import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Game {
  id: string;
  title: string;
  description: string;
  players: number;
  gradient: string;
}

const games: Game[] = [
  {
    id: 'space-battle',
    title: 'Space Battle',
    description: 'Engage in epic space combat with stunning 3D graphics',
    players: 12,
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'maze-runner',
    title: 'Maze Runner',
    description: 'Navigate through procedurally generated 3D mazes',
    players: 8,
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'pixel-platformer',
    title: 'Pixel Platformer',
    description: 'Classic platforming action with modern twists',
    players: 15,
    gradient: 'from-red-500 to-pink-500',
  },
  {
    id: 'puzzle-master',
    title: 'Puzzle Master',
    description: 'Test your wits with challenging color-matching puzzles',
    players: 10,
    gradient: 'from-yellow-500 to-orange-500',
  },
];

const GameLobby = () => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
  };

  const startMatchmaking = () => {
    if (!selectedGame) return;
    setIsMatchmaking(true);
    // Simulate matchmaking process
    setTimeout(() => {
      setIsMatchmaking(false);
      navigate(`/games/${selectedGame.id}`);
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold mb-4 gradient-text">Available Games</h2>
            <div className="space-y-4">
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGameSelect(game)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedGame?.id === game.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  <h3 className="text-lg font-semibold">{game.title}</h3>
                  <p className="text-sm text-gray-400">{game.players} players online</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode='wait'>
            {selectedGame ? (
              <motion.div
                key={selectedGame.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card"
              >
                <div className={`h-48 rounded-lg bg-gradient-to-r ${selectedGame.gradient} mb-6`} />
                <h2 className="text-3xl font-bold mb-2">{selectedGame.title}</h2>
                <p className="text-gray-300 mb-6">{selectedGame.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Players Online: {selectedGame.players}</p>
                    <p className="text-sm text-gray-400">Average Wait Time: 30 seconds</p>
                  </div>
                  <button
                    onClick={startMatchmaking}
                    disabled={isMatchmaking}
                    className="btn"
                  >
                    {isMatchmaking ? (
                      <div className="flex items-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Finding Match...
                      </div>
                    ) : (
                      'Play Now'
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card text-center py-12"
              >
                <p className="text-gray-400 text-lg">
                  Select a game from the list to view details and start playing
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;