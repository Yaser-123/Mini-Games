import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface Player {
  mesh: THREE.Mesh;
  position: { x: number; z: number };
}

interface MazeCell {
  x: number;
  z: number;
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  visited: boolean;
}

const MazeRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const player1Ref = useRef<Player>();
  const player2Ref = useRef<Player>();
  const mazeRef = useRef<MazeCell[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const MAZE_SIZE = 15;
  const CELL_SIZE = 2;

  const generateMaze = () => {
    // Initialize maze grid
    const maze: MazeCell[][] = [];
    for (let x = 0; x < MAZE_SIZE; x++) {
      maze[x] = [];
      for (let z = 0; z < MAZE_SIZE; z++) {
        maze[x][z] = {
          x,
          z,
          walls: { north: true, south: true, east: true, west: true },
          visited: false,
        };
      }
    }

    // Recursive backtracking algorithm
    const stack: MazeCell[] = [];
    const startCell = maze[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = getUnvisitedNeighbors(current, maze);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        removeWallsBetween(current, next);
        next.visited = true;
        stack.push(next);
      }
    }

    return maze;
  };

  const getUnvisitedNeighbors = (cell: MazeCell, maze: MazeCell[][]) => {
    const neighbors: MazeCell[] = [];
    const { x, z } = cell;

    if (x > 0 && !maze[x - 1][z].visited) neighbors.push(maze[x - 1][z]); // West
    if (x < MAZE_SIZE - 1 && !maze[x + 1][z].visited) neighbors.push(maze[x + 1][z]); // East
    if (z > 0 && !maze[x][z - 1].visited) neighbors.push(maze[x][z - 1]); // North
    if (z < MAZE_SIZE - 1 && !maze[x][z + 1].visited) neighbors.push(maze[x][z + 1]); // South

    return neighbors;
  };

  const removeWallsBetween = (cell1: MazeCell, cell2: MazeCell) => {
    const dx = cell2.x - cell1.x;
    const dz = cell2.z - cell1.z;

    if (dx === 1) {
      cell1.walls.east = false;
      cell2.walls.west = false;
    } else if (dx === -1) {
      cell1.walls.west = false;
      cell2.walls.east = false;
    } else if (dz === 1) {
      cell1.walls.south = false;
      cell2.walls.north = false;
    } else if (dz === -1) {
      cell1.walls.north = false;
      cell2.walls.south = false;
    }
  };

  const createPlayer = (color: number, startPosition: { x: number; z: number }): Player => {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      startPosition.x * CELL_SIZE,
      0.3,
      startPosition.z * CELL_SIZE
    );
    sceneRef.current?.add(mesh);

    return {
      mesh,
      position: startPosition,
    };
  };

  const createMazeWalls = (maze: MazeCell[][]) => {
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, 1, 0.1);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.7,
    });

    for (let x = 0; x < MAZE_SIZE; x++) {
      for (let z = 0; z < MAZE_SIZE; z++) {
        const cell = maze[x][z];
        const position = new THREE.Vector3(x * CELL_SIZE, 0.5, z * CELL_SIZE);

        if (cell.walls.north) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(position.x, position.y, position.z - CELL_SIZE / 2);
          sceneRef.current?.add(wall);
        }

        if (cell.walls.south) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(position.x, position.y, position.z + CELL_SIZE / 2);
          sceneRef.current?.add(wall);
        }

        if (cell.walls.east) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.rotation.y = Math.PI / 2;
          wall.position.set(position.x + CELL_SIZE / 2, position.y, position.z);
          sceneRef.current?.add(wall);
        }

        if (cell.walls.west) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.rotation.y = Math.PI / 2;
          wall.position.set(position.x - CELL_SIZE / 2, position.y, position.z);
          sceneRef.current?.add(wall);
        }
      }
    }

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(
      (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2,
      0,
      (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2
    );
    sceneRef.current?.add(floor);
  };

  const checkWin = (player: Player) => {
    return (
      player.position.x === MAZE_SIZE - 1 && player.position.z === MAZE_SIZE - 1
    );
  };

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x000000);

    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    rendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    sceneRef.current.add(ambientLight, directionalLight);

    // Generate and create maze
    const maze = generateMaze();
    mazeRef.current = maze;
    createMazeWalls(maze);

    // Create players
    player1Ref.current = createPlayer(0x0000ff, { x: 0, z: 0 });
    player2Ref.current = createPlayer(0xff0000, { x: 0, z: 1 });

    // Camera position
    cameraRef.current.position.set(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * 1.5, MAZE_SIZE * CELL_SIZE);
    cameraRef.current.lookAt(new THREE.Vector3(
      (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2,
      0,
      (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2
    ));

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

      requestAnimationFrame(animate);

      // Player movement
      const movePlayer = (player: Player, dx: number, dz: number) => {
        const newX = player.position.x + dx;
        const newZ = player.position.z + dz;

        if (
          newX >= 0 &&
          newX < MAZE_SIZE &&
          newZ >= 0 &&
          newZ < MAZE_SIZE
        ) {
          const currentCell = mazeRef.current[player.position.x][player.position.z];
          if (
            (dx === 1 && !currentCell.walls.east) ||
            (dx === -1 && !currentCell.walls.west) ||
            (dz === 1 && !currentCell.walls.south) ||
            (dz === -1 && !currentCell.walls.north)
          ) {
            player.position.x = newX;
            player.position.z = newZ;
            player.mesh.position.x = newX * CELL_SIZE;
            player.mesh.position.z = newZ * CELL_SIZE;

            if (checkWin(player)) {
              onGameEnd(player === player1Ref.current ? 1 : 2);
            }
          }
        }
      };

      // Handle keyboard input
      if (player1Ref.current) {
        if (keys.w) movePlayer(player1Ref.current, 0, -1);
        if (keys.s) movePlayer(player1Ref.current, 0, 1);
        if (keys.a) movePlayer(player1Ref.current, -1, 0);
        if (keys.d) movePlayer(player1Ref.current, 1, 0);
      }

      if (player2Ref.current) {
        if (keys.ArrowUp) movePlayer(player2Ref.current, 0, -1);
        if (keys.ArrowDown) movePlayer(player2Ref.current, 0, 1);
        if (keys.ArrowLeft) movePlayer(player2Ref.current, -1, 0);
        if (keys.ArrowRight) movePlayer(player2Ref.current, 1, 0);
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    animate();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted]);

  const onGameEnd = (winner: number) => {
    setGameStarted(false);
    // Additional game end logic here
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {!gameStarted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-6 gradient-text">Maze Runner</h2>
            <div className="mb-8 text-left space-y-2">
              <p>Player 1 Controls:</p>
              <ul className="ml-4">
                <li>WASD - Movement</li>
              </ul>
              <p className="mt-4">Player 2 Controls:</p>
              <ul className="ml-4">
                <li>Arrow Keys - Movement</li>
              </ul>
              <p className="mt-4 text-yellow-400">
                Race to the bottom-right corner of the maze!
              </p>
            </div>
            <button
              onClick={() => setGameStarted(true)}
              className="btn px-8 py-3"
            >
              Start Game
            </button>
          </motion.div>
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

export default MazeRunner;