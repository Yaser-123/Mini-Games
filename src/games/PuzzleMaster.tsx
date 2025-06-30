import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Tile {
  id: number;
  value: number;
  position: number;
  isCorrect: boolean;
}

interface Player {
  id: number;
  score: number;
  moves: number;
  currentPuzzle: Tile[];
  hasHint: boolean;
  hasShuffle: boolean;
  hasUndo: boolean;
}

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const PuzzleMaster: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [player1, setPlayer1] = useState<Player>({
    id: 1,
    score: 0,
    moves: 0,
    currentPuzzle: [],
    hasHint: true,
    hasShuffle: true,
    hasUndo: true,
  });
  const [player2, setPlayer2] = useState<Player>({
    id: 2,
    score: 0,
    moves: 0,
    currentPuzzle: [],
    hasHint: true,
    hasShuffle: true,
    hasUndo: true,
  });
  const [moveHistory, setMoveHistory] = useState<{ playerId: number; moves: number[] }[]>([]);

  const generatePuzzle = (): Tile[] => {
    const numbers = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);
    numbers.push(0); // Empty tile

    // Shuffle the numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Ensure the puzzle is solvable
    let inversions = 0;
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i] === 0) continue;
      for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[j] === 0) continue;
        if (numbers[i] > numbers[j]) inversions++;
      }
    }

    // If inversions count is odd, swap last two numbers to make it solvable
    if (inversions % 2 !== 0) {
      const lastIndex = numbers.length - 1;
      const secondLastIndex = lastIndex - 1;
      [numbers[lastIndex], numbers[secondLastIndex]] = 
        [numbers[secondLastIndex], numbers[lastIndex]];
    }

    return numbers.map((value, index) => ({
      id: index,
      value,
      position: index,
      isCorrect: value === index + 1 || (value === 0 && index === TOTAL_TILES - 1),
    }));
  };

  const initializeGame = () => {
    const puzzle1 = generatePuzzle();
    const puzzle2 = generatePuzzle();
    setPlayer1(prev => ({ ...prev, currentPuzzle: puzzle1 }));
    setPlayer2(prev => ({ ...prev, currentPuzzle: puzzle2 }));
    setMoveHistory([]);
    setGameStarted(true);
  };

  const isMoveValid = (currentPosition: number, targetPosition: number): boolean => {
    const row1 = Math.floor(currentPosition / GRID_SIZE);
    const col1 = currentPosition % GRID_SIZE;
    const row2 = Math.floor(targetPosition / GRID_SIZE);
    const col2 = targetPosition % GRID_SIZE;
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
  };

  const moveTile = (playerId: number, tilePosition: number) => {
    const player = playerId === 1 ? player1 : player2;
    const setPlayer = playerId === 1 ? setPlayer1 : setPlayer2;
    const puzzle = [...player.currentPuzzle];

    const emptyTileIndex = puzzle.findIndex(tile => tile.value === 0);
    if (!isMoveValid(tilePosition, emptyTileIndex)) return;

    // Swap tiles
    const temp = puzzle[tilePosition];
    puzzle[tilePosition] = puzzle[emptyTileIndex];
    puzzle[emptyTileIndex] = temp;

    // Update positions
    puzzle[tilePosition].position = tilePosition;
    puzzle[emptyTileIndex].position = emptyTileIndex;

    // Update correct status
    puzzle.forEach(tile => {
      tile.isCorrect = tile.value === tile.position + 1 || 
                      (tile.value === 0 && tile.position === TOTAL_TILES - 1);
    });

    // Update move history
    setMoveHistory(prev => [...prev, { playerId, moves: puzzle.map(t => t.value) }]);

    // Update player state
    setPlayer(prev => ({
      ...prev,
      currentPuzzle: puzzle,
      moves: prev.moves + 1,
      score: puzzle.filter(t => t.isCorrect).length * 10,
    }));

    // Check win condition
    if (puzzle.every(tile => tile.isCorrect)) {
      setPlayer(prev => ({
        ...prev,
        score: prev.score + 1000, // Bonus points for completing the puzzle
      }));
      setTimeout(() => {
        alert(`Player ${playerId} won! Starting new round...`);
        const newPuzzle = generatePuzzle();
        setPlayer(prev => ({
          ...prev,
          currentPuzzle: newPuzzle,
          moves: 0,
          hasHint: true,
          hasShuffle: true,
          hasUndo: true,
        }));
      }, 500);
    }
  };

  const handleHint = (playerId: number) => {
    const player = playerId === 1 ? player1 : player2;
    const setPlayer = playerId === 1 ? setPlayer1 : setPlayer2;

    if (!player.hasHint) return;

    const puzzle = [...player.currentPuzzle];
    const incorrectTiles = puzzle.filter(tile => !tile.isCorrect);
    if (incorrectTiles.length === 0) return;

    // Highlight a random incorrect tile
    const randomTile = incorrectTiles[Math.floor(Math.random() * incorrectTiles.length)];
    setPlayer(prev => ({ ...prev, hasHint: false }));

    // Visual feedback
    const tileElement = document.getElementById(`tile-${playerId}-${randomTile.id}`);
    if (tileElement) {
      tileElement.classList.add('hint-animation');
      setTimeout(() => tileElement.classList.remove('hint-animation'), 2000);
    }
  };

  const handleShuffle = (playerId: number) => {
    const player = playerId === 1 ? player1 : player2;
    const setPlayer = playerId === 1 ? setPlayer1 : setPlayer2;

    if (!player.hasShuffle) return;

    const newPuzzle = generatePuzzle();
    setPlayer(prev => ({
      ...prev,
      currentPuzzle: newPuzzle,
      hasShuffle: false,
    }));
  };

  const handleUndo = (playerId: number) => {
    const player = playerId === 1 ? player1 : player2;
    const setPlayer = playerId === 1 ? setPlayer1 : setPlayer2;

    if (!player.hasUndo || moveHistory.length === 0) return;

    const playerMoves = moveHistory.filter(move => move.playerId === playerId);
    if (playerMoves.length <= 1) return;

    const previousMove = playerMoves[playerMoves.length - 2].moves;
    const puzzle = player.currentPuzzle.map((tile, index) => ({
      ...tile,
      value: previousMove[index],
      isCorrect: previousMove[index] === index + 1 || 
                (previousMove[index] === 0 && index === TOTAL_TILES - 1),
    }));

    setPlayer(prev => ({
      ...prev,
      currentPuzzle: puzzle,
      moves: prev.moves - 1,
      hasUndo: false,
    }));
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center">
      {!gameStarted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-6 gradient-text">Puzzle Master</h2>
          <div className="mb-8 text-left space-y-4">
            <p className="text-xl">Game Rules:</p>
            <ul className="ml-4 space-y-2">
              <li>• Click tiles adjacent to the empty space to move them</li>
              <li>• Arrange the numbers in ascending order</li>
              <li>• Use power-ups wisely:</li>
              <ul className="ml-6 mt-2">
                <li>- Hint: Highlights a tile that needs to be moved</li>
                <li>- Shuffle: Generates a new puzzle layout</li>
                <li>- Undo: Reverts your last move</li>
              </ul>
            </ul>
          </div>
          <button
            onClick={initializeGame}
            className="btn px-8 py-3"
          >
            Start Game
          </button>
        </motion.div>
      ) : (
        <div className="flex gap-8">
          {[player1, player2].map((player) => (
            <div key={player.id} className="text-white">
              <h3 className="text-2xl font-bold mb-4">Player {player.id}</h3>
              <div className="mb-4 flex justify-between">
                <span>Score: {player.score}</span>
                <span>Moves: {player.moves}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-gray-800 p-2 rounded-lg">
                {player.currentPuzzle.map((tile) => (
                  <motion.button
                    key={tile.id}
                    id={`tile-${player.id}-${tile.id}`}
                    onClick={() => moveTile(player.id, tile.position)}
                    className={`w-16 h-16 text-xl font-bold rounded ${tile.value === 0 ? 'bg-gray-900' : 'bg-blue-600 hover:bg-blue-700'} ${tile.isCorrect ? 'border-2 border-green-400' : ''}`}
                    whileHover={{ scale: tile.value !== 0 ? 1.05 : 1 }}
                    whileTap={{ scale: tile.value !== 0 ? 0.95 : 1 }}
                  >
                    {tile.value !== 0 && tile.value}
                  </motion.button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleHint(player.id)}
                  className={`btn-sm ${!player.hasHint && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!player.hasHint}
                >
                  Hint
                </button>
                <button
                  onClick={() => handleShuffle(player.id)}
                  className={`btn-sm ${!player.hasShuffle && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!player.hasShuffle}
                >
                  Shuffle
                </button>
                <button
                  onClick={() => handleUndo(player.id)}
                  className={`btn-sm ${!player.hasUndo && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!player.hasUndo}
                >
                  Undo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PuzzleMaster;