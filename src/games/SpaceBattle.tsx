import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface Spaceship {
  mesh: THREE.Mesh;
  health: number;
  shield: number;
  bullets: THREE.Mesh[];
  powerUps: {
    rapidFire: boolean;
    tripleShot: boolean;
  };
  score: number;
}

interface PowerUp {
  mesh: THREE.Mesh;
  type: 'health' | 'shield' | 'rapidFire' | 'tripleShot';
}

const SpaceBattle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const player1Ref = useRef<Spaceship>();
  const player2Ref = useRef<Spaceship>();
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<THREE.Points>();
  const starsRef = useRef<THREE.Points>();
  const [gameStarted, setGameStarted] = useState(false);

  const createSpaceship = (position: THREE.Vector3, color: number): Spaceship => {
    const geometry = new THREE.ConeGeometry(0.5, 1, 8);
    const material = new THREE.MeshPhongMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.x = Math.PI / 2;
    sceneRef.current?.add(mesh);

    return {
      mesh,
      health: 100,
      shield: 0,
      bullets: [],
      powerUps: {
        rapidFire: false,
        tripleShot: false,
      },
      score: 0,
    };
  };

  const createStarfield = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    sceneRef.current?.add(stars);
    return stars;
  };

  const createParticleSystem = (color: number) => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color,
      size: 0.05,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    sceneRef.current?.add(particles);
    return particles;
  };

  const createPowerUp = (type: PowerUp['type']): PowerUp => {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const color = {
      health: 0xff0000,
      shield: 0x00ff00,
      rapidFire: 0xffff00,
      tripleShot: 0xff00ff,
    }[type];
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      0
    );
    sceneRef.current?.add(mesh);
    return { mesh, type };
  };

  const shoot = (player: Spaceship, direction: number) => {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const createBullet = (offset: number = 0) => {
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
      bullet.position.copy(player.mesh.position);
      bullet.position.x += offset;
      sceneRef.current?.add(bullet);
      player.bullets.push(bullet);
    };

    if (player.powerUps.tripleShot) {
      createBullet(-0.3);
      createBullet();
      createBullet(0.3);
    } else {
      createBullet();
    }
  };

  const updateBullets = () => {
    const bulletSpeed = 0.2;
    const players = [player1Ref.current, player2Ref.current];

    players.forEach((player, playerIndex) => {
      if (!player) return;

      const opponent = players[(playerIndex + 1) % 2];
      if (!opponent) return;

      player.bullets.forEach((bullet, index) => {
        bullet.position.y += bulletSpeed * (playerIndex === 0 ? 1 : -1);

        // Check collision with opponent
        if (bullet.position.distanceTo(opponent.mesh.position) < 0.7) {
          sceneRef.current?.remove(bullet);
          player.bullets.splice(index, 1);

          if (opponent.shield > 0) {
            opponent.shield -= 10;
          } else {
            opponent.health -= 10;
          }

          if (opponent.health <= 0) {
            player.score += 1;
            onGameEnd(playerIndex);
          }
        }

        // Remove bullets that are out of bounds
        if (Math.abs(bullet.position.y) > 10) {
          sceneRef.current?.remove(bullet);
          player.bullets.splice(index, 1);
        }
      });
    });
  };

  const checkPowerUpCollisions = () => {
    const players = [player1Ref.current, player2Ref.current];

    powerUpsRef.current.forEach((powerUp, index) => {
      players.forEach(player => {
        if (!player) return;

        if (powerUp.mesh.position.distanceTo(player.mesh.position) < 1) {
          sceneRef.current?.remove(powerUp.mesh);
          powerUpsRef.current.splice(index, 1);

          switch (powerUp.type) {
            case 'health':
              player.health = Math.min(player.health + 30, 100);
              break;
            case 'shield':
              player.shield = Math.min(player.shield + 50, 100);
              break;
            case 'rapidFire':
              player.powerUps.rapidFire = true;
              setTimeout(() => {
                player.powerUps.rapidFire = false;
              }, 5000);
              break;
            case 'tripleShot':
              player.powerUps.tripleShot = true;
              setTimeout(() => {
                player.powerUps.tripleShot = false;
              }, 5000);
              break;
          }
        }
      });
    });
  };

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    const container = canvasRef.current.parentElement;
    if (container) {
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 0, 5);
    sceneRef.current.add(ambientLight, directionalLight);

    // Camera position
    cameraRef.current.position.z = 15;

    // Create game objects
    player1Ref.current = createSpaceship(new THREE.Vector3(0, -5, 0), 0x0000ff);
    player2Ref.current = createSpaceship(new THREE.Vector3(0, 5, 0), 0xff0000);
    starsRef.current = createStarfield();
    particlesRef.current = createParticleSystem(0x888888);

    // Power-up spawning
    const spawnPowerUp = () => {
      if (powerUpsRef.current.length < 3) {
        const types: PowerUp['type'][] = ['health', 'shield', 'rapidFire', 'tripleShot'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        powerUpsRef.current.push(createPowerUp(randomType));
      }
    };

    const powerUpInterval = setInterval(spawnPowerUp, 5000);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

      requestAnimationFrame(animate);

      // Rotate starfield
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0005;
      }

      // Player controls
      const speed = 0.15;
      const player1 = player1Ref.current;
      const player2 = player2Ref.current;

      if (player1 && player1.mesh) {
        if (keys.a && player1.mesh.position.x > -8) player1.mesh.position.x -= speed;
        if (keys.d && player1.mesh.position.x < 8) player1.mesh.position.x += speed;
        if (keys.w && player1.mesh.position.y < 0) player1.mesh.position.y += speed;
        if (keys.s && player1.mesh.position.y > -8) player1.mesh.position.y -= speed;
      }

      if (player2 && player2.mesh) {
        if (keys.ArrowLeft && player2.mesh.position.x > -8) player2.mesh.position.x -= speed;
        if (keys.ArrowRight && player2.mesh.position.x < 8) player2.mesh.position.x += speed;
        if (keys.ArrowUp && player2.mesh.position.y < 8) player2.mesh.position.y += speed;
        if (keys.ArrowDown && player2.mesh.position.y > 0) player2.mesh.position.y -= speed;
      }

      // Shooting
      if (player1 && keys.space) {
        const shootDelay = player1.powerUps.rapidFire ? 100 : 300;
        if (Date.now() - lastShot.player1 > shootDelay) {
          shoot(player1, 1);
          lastShot.player1 = Date.now();
        }
      }

      if (player2 && keys.enter) {
        const shootDelay = player2.powerUps.rapidFire ? 100 : 300;
        if (Date.now() - lastShot.player2 > shootDelay) {
          shoot(player2, -1);
          lastShot.player2 = Date.now();
        }
      }

      updateBullets();
      checkPowerUpCollisions();

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};
    const lastShot = { player1: 0, player2: 0 };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === 'Enter') keys.enter = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      if (e.key === 'Enter') keys.enter = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    animate();

    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const container = canvasRef.current.parentElement;
      if (container) {
        rendererRef.current.setSize(container.clientWidth, container.clientHeight);
        cameraRef.current.aspect = container.clientWidth / container.clientHeight;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      clearInterval(powerUpInterval);
    };
  }, [gameStarted]);

  const onGameEnd = (winner: number) => {
    setGameStarted(false);
    // Additional game end logic here
  };

  return (
    <div className="relative w-full h-[calc(100vh-200px)] bg-black overflow-hidden">
      {!gameStarted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-6 gradient-text">Space Battle</h2>
            <div className="mb-8 text-left space-y-2">
              <p>Player 1 Controls:</p>
              <ul className="ml-4">
                <li>WASD - Movement</li>
                <li>SPACE - Shoot</li>
              </ul>
              <p className="mt-4">Player 2 Controls:</p>
              <ul className="ml-4">
                <li>Arrow Keys - Movement</li>
                <li>Enter - Shoot</li>
              </ul>
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
        <>
          <canvas ref={canvasRef} />
          <div className="absolute top-4 left-4 text-white">
            <p>Player 1</p>
            <p>Health: {player1Ref.current?.health}</p>
            <p>Shield: {player1Ref.current?.shield}</p>
          </div>
          <div className="absolute top-4 right-4 text-white text-right">
            <p>Player 2</p>
            <p>Health: {player2Ref.current?.health}</p>
            <p>Shield: {player2Ref.current?.shield}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default SpaceBattle;