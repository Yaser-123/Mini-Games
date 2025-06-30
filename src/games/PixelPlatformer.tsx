import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Player {
  x: number;
  y: number;
  velocityY: number;
  velocityX: number;
  isJumping: boolean;
  doubleJumpAvailable: boolean;
  hasSpeedBoost: boolean;
  hasShield: boolean;
  score: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  type: 'normal' | 'moving' | 'breaking';
  direction?: number;
  durability?: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'doubleJump' | 'speedBoost' | 'shield';
  collected: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 30;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const PLATFORM_HEIGHT = 15;

const PixelPlatformer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [player1, setPlayer1] = useState<Player>({
    x: 100,
    y: 300,
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    doubleJumpAvailable: false,
    hasSpeedBoost: false,
    hasShield: false,
    score: 0,
  });
  const [player2, setPlayer2] = useState<Player>({
    x: 700,
    y: 300,
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    doubleJumpAvailable: false,
    hasSpeedBoost: false,
    hasShield: false,
    score: 0,
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const animationFrameRef = useRef<number>();

  const generateLevel = () => {
    const newPlatforms: Platform[] = [
      // Ground platforms
      { x: 0, y: CANVAS_HEIGHT - 40, width: CANVAS_WIDTH, type: 'normal' },
    ];

    // Generate random platforms
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * (CANVAS_WIDTH - 100);
      const y = Math.random() * (CANVAS_HEIGHT - 200) + 100;
      const width = Math.random() * 100 + 50;
      const type = Math.random() < 0.7 ? 'normal' :
                  Math.random() < 0.85 ? 'moving' : 'breaking';

      newPlatforms.push({
        x,
        y,
        width,
        type,
        direction: type === 'moving' ? 1 : undefined,
        durability: type === 'breaking' ? 2 : undefined,
      });
    }

    // Generate power-ups
    const newPowerUps: PowerUp[] = [];
    const powerUpTypes: PowerUp['type'][] = ['doubleJump', 'speedBoost', 'shield'];

    for (let i = 0; i < 3; i++) {
      newPowerUps.push({
        x: Math.random() * (CANVAS_WIDTH - 30),
        y: Math.random() * (CANVAS_HEIGHT - 200) + 100,
        type: powerUpTypes[i],
        collected: false,
      });
    }

    setPlatforms(newPlatforms);
    setPowerUps(newPowerUps);
  };

  const updatePlayer = (player: Player, setPlayer: React.Dispatch<React.SetStateAction<Player>>, keys: Set<string>) => {
    let newPlayer = { ...player };

    // Horizontal movement
    const moveSpeed = player.hasSpeedBoost ? MOVE_SPEED * 1.5 : MOVE_SPEED;
    if ((keys.has('a') && player === player1) || (keys.has('ArrowLeft') && player === player2)) {
      newPlayer.velocityX = -moveSpeed;
    } else if ((keys.has('d') && player === player1) || (keys.has('ArrowRight') && player === player2)) {
      newPlayer.velocityX = moveSpeed;
    } else {
      newPlayer.velocityX = 0;
    }

    // Jumping
    if (
      ((keys.has('w') && player === player1) || (keys.has('ArrowUp') && player === player2)) &&
      !player.isJumping
    ) {
      newPlayer.velocityY = JUMP_FORCE;
      newPlayer.isJumping = true;
    } else if (
      ((keys.has('w') && player === player1) || (keys.has('ArrowUp') && player === player2)) &&
      player.doubleJumpAvailable
    ) {
      newPlayer.velocityY = JUMP_FORCE;
      newPlayer.doubleJumpAvailable = false;
    }

    // Apply gravity
    newPlayer.velocityY += GRAVITY;

    // Update position
    newPlayer.x += newPlayer.velocityX;
    newPlayer.y += newPlayer.velocityY;

    // Screen boundaries
    if (newPlayer.x < 0) newPlayer.x = 0;
    if (newPlayer.x > CANVAS_WIDTH - PLAYER_SIZE) newPlayer.x = CANVAS_WIDTH - PLAYER_SIZE;
    if (newPlayer.y > CANVAS_HEIGHT - PLAYER_SIZE) {
      newPlayer.y = CANVAS_HEIGHT - PLAYER_SIZE;
      newPlayer.velocityY = 0;
      newPlayer.isJumping = false;
      newPlayer.doubleJumpAvailable = true;
    }

    // Platform collision
    platforms.forEach((platform, index) => {
      if (
        newPlayer.x < platform.x + platform.width &&
        newPlayer.x + PLAYER_SIZE > platform.x &&
        newPlayer.y + PLAYER_SIZE > platform.y &&
        newPlayer.y < platform.y + PLATFORM_HEIGHT
      ) {
        if (newPlayer.velocityY > 0) {
          newPlayer.y = platform.y - PLAYER_SIZE;
          newPlayer.velocityY = 0;
          newPlayer.isJumping = false;
          newPlayer.doubleJumpAvailable = true;

          if (platform.type === 'breaking' && platform.durability) {
            const newPlatforms = [...platforms];
            newPlatforms[index].durability = platform.durability - 1;
            if (newPlatforms[index].durability === 0) {
              newPlatforms.splice(index, 1);
            }
            setPlatforms(newPlatforms);
          }
        }
      }
    });

    // Power-up collection
    powerUps.forEach((powerUp, index) => {
      if (
        !powerUp.collected &&
        newPlayer.x < powerUp.x + 30 &&
        newPlayer.x + PLAYER_SIZE > powerUp.x &&
        newPlayer.y < powerUp.y + 30 &&
        newPlayer.y + PLAYER_SIZE > powerUp.y
      ) {
        const newPowerUps = [...powerUps];
        newPowerUps[index].collected = true;
        setPowerUps(newPowerUps);

        switch (powerUp.type) {
          case 'doubleJump':
            newPlayer.doubleJumpAvailable = true;
            break;
          case 'speedBoost':
            newPlayer.hasSpeedBoost = true;
            setTimeout(() => {
              setPlayer(prev => ({ ...prev, hasSpeedBoost: false }));
            }, 5000);
            break;
          case 'shield':
            newPlayer.hasShield = true;
            setTimeout(() => {
              setPlayer(prev => ({ ...prev, hasShield: false }));
            }, 5000);
            break;
        }

        newPlayer.score += 100;
      }
    });

    setPlayer(newPlayer);
  };

  const updateMovingPlatforms = () => {
    setPlatforms(prevPlatforms =>
      prevPlatforms.map(platform => {
        if (platform.type === 'moving' && platform.direction) {
          const newX = platform.x + platform.direction * 2;
          if (newX < 0 || newX + platform.width > CANVAS_WIDTH) {
            return { ...platform, direction: -platform.direction };
          }
          return { ...platform, x: newX };
        }
        return platform;
      })
    );
  };

  const draw = () => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw platforms
    platforms.forEach(platform => {
      switch (platform.type) {
        case 'normal':
          ctx.fillStyle = '#4a4a4a';
          break;
        case 'moving':
          ctx.fillStyle = '#6a6a6a';
          break;
        case 'breaking':
          ctx.fillStyle = platform.durability === 2 ? '#8a8a8a' : '#5a5a5a';
          break;
      }
      ctx.fillRect(platform.x, platform.y, platform.width, PLATFORM_HEIGHT);
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        ctx.fillStyle = {
          doubleJump: '#ffff00',
          speedBoost: '#00ff00',
          shield: '#0000ff',
        }[powerUp.type];
        ctx.beginPath();
        ctx.arc(powerUp.x + 15, powerUp.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw players
    const drawPlayer = (player: Player, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);

      if (player.hasShield) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x - 2, player.y - 2, PLAYER_SIZE + 4, PLAYER_SIZE + 4);
      }

      // Draw score
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${player.score}`, player.x - 10, player.y - 10);
    };

    drawPlayer(player1, '#ff0000');
    drawPlayer(player2, '#0000ff');
  };

  const gameLoop = () => {
    const keys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => keys.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const update = () => {
      if (!gameStarted) return;

      updatePlayer(player1, setPlayer1, keys);
      updatePlayer(player2, setPlayer2, keys);
      updateMovingPlatforms();
      draw();

      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    contextRef.current = canvas.getContext('2d');

    generateLevel();
    const cleanup = gameLoop();

    return cleanup;
  }, [gameStarted]);

  return (
    <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center">
      {!gameStarted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-6 gradient-text">Pixel Platformer</h2>
          <div className="mb-8 text-left space-y-2">
            <p>Player 1 Controls:</p>
            <ul className="ml-4">
              <li>A/D - Move Left/Right</li>
              <li>W - Jump</li>
            </ul>
            <p className="mt-4">Player 2 Controls:</p>
            <ul className="ml-4">
              <li>Arrow Keys - Movement</li>
              <li>Up Arrow - Jump</li>
            </ul>
            <div className="mt-4 p-4 bg-gray-800 rounded">
              <p className="text-yellow-400">Power-ups:</p>
              <ul className="ml-4">
                <li>Yellow - Double Jump</li>
                <li>Green - Speed Boost</li>
                <li>Blue - Shield</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setGameStarted(true)}
            className="btn px-8 py-3"
          >
            Start Game
          </button>
        </motion.div>
      ) : (
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-700 rounded-lg shadow-lg"
        />
      )}
    </div>
  );
};

export default PixelPlatformer;