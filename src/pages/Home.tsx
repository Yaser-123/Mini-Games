import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const games = [
  {
    id: 'space-battle',
    title: 'Space Battle',
    description: 'Engage in epic space combat with stunning 3D graphics',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'maze-runner',
    title: 'Maze Runner',
    description: 'Navigate through procedurally generated 3D mazes',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'pixel-platformer',
    title: 'Pixel Platformer',
    description: 'Classic platforming action with modern twists',
    gradient: 'from-red-500 to-pink-500',
  },
  {
    id: 'puzzle-master',
    title: 'Puzzle Master',
    description: 'Test your wits with challenging color-matching puzzles',
    gradient: 'from-yellow-500 to-orange-500',
  },
];

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleGameClick = (gameId: string) => {
    if (currentUser) {
      navigate('/lobby');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 gradient-text">
          Welcome to Modern Game Platform
        </h1>
        <p className="text-gray-300 text-lg">
          {currentUser
            ? 'Choose your game and start playing!'
            : 'Sign in to start playing amazing multiplayer games!'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleGameClick(game.id)}
            className={`game-card bg-gradient-to-br ${game.gradient} cursor-pointer`}
          >
            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
            <p className="text-sm opacity-90">{game.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;