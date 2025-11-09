import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Zap, Coins, Skull } from 'lucide-react';

const DobbyTokenEater = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [size, setSize] = useState(30);
  const [player, setPlayer] = useState({ x: 400, y: 300, vx: 0, vy: 0 });
  const [tokens, setTokens] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [isInvincible, setIsInvincible] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [lastEatTime, setLastEatTime] = useState(0);
  const [particles, setParticles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [timeAlive, setTimeAlive] = useState(0);
  const mousePos = useRef({ x: 400, y: 300 });
  const animationRef = useRef(null);
  const gameStartTime = useRef(0);
  const dobbyImage = useRef(null);

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 600;
  const BASE_SPEED = 3;

  // Load Dobby image
  useEffect(() => {
    const img = new Image();
    img.src = 'https://i.postimg.cc/qqrhgmg2/image.png';
    img.onload = () => {
      dobbyImage.current = img;
    };
    img.onerror = () => {
      console.error('Failed to load Dobby image');
    };
  }, []);

  const dobbyQuips = [
    "NGMI? Not me!",
    "Stacking sats like a boss",
    "Decentralize everything!",
    "To the moon! 🚀",
    "HODL mode activated",
    "Bullish on freedom",
    "GM to my bags",
    "Few understand this",
    "Wen lambo? Soon.",
    "Diamond hands only"
  ];

  const initGame = useCallback(() => {
    const newTokens = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      value: Math.floor(Math.random() * 3) + 1,
      collected: false
    }));

    const newEnemies = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: 40 + Math.random() * 30,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      color: ['#ef4444', '#dc2626', '#b91c1c'][Math.floor(Math.random() * 3)]
    }));

    setTokens(newTokens);
    setEnemies(newEnemies);
    setPlayer({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 0, vy: 0 });
    setSize(30);
    setScore(0);
    setComboMultiplier(1);
    setPowerUps([]);
    setParticles([]);
    setFloatingTexts([]);
    setTimeAlive(0);
    gameStartTime.current = Date.now();
  }, []);

  const spawnToken = useCallback(() => {
    const id = Date.now() + Math.random();
    const newToken = {
      id,
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      value: Math.floor(Math.random() * 3) + 1,
      collected: false
    };
    setTokens(prev => [...prev, newToken]);
  }, []);

  const spawnPowerUp = useCallback(() => {
    if (Math.random() > 0.7) {
      const id = Date.now();
      setPowerUps(prev => [...prev, {
        id,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        type: 'invincible'
      }]);
    }
  }, []);

  const updateCombo = useCallback(() => {
    const now = Date.now();
    if (now - lastEatTime < 1000) {
      setComboMultiplier(prev => Math.min(prev + 0.5, 5));
    } else {
      setComboMultiplier(1);
    }
    setLastEatTime(now);
  }, [lastEatTime]);

  const createParticles = useCallback((x, y, color, count = 8) => {
    const newParticles = Array.from({ length: count }, () => ({
      id: Date.now() + Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      color,
      life: 1,
      size: 3 + Math.random() * 3
    }));
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const addFloatingText = useCallback((x, y, text, color = '#fbbf24') => {
    setFloatingTexts(prev => [...prev, {
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 1
    }]);
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Update player position based on mouse
    setPlayer(prev => {
      const dx = mousePos.current.x - prev.x;
      const dy = mousePos.current.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        const speed = BASE_SPEED * (50 / size);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        let newX = prev.x + vx;
        let newY = prev.y + vy;

        // Wrap around edges
        if (newX < -size) newX = CANVAS_WIDTH + size;
        if (newX > CANVAS_WIDTH + size) newX = -size;
        if (newY < -size) newY = CANVAS_HEIGHT + size;
        if (newY > CANVAS_HEIGHT + size) newY = -size;

        return { ...prev, x: newX, y: newY, vx, vy };
      }
      return prev;
    });

    // Check token collection
    setTokens(prev => {
      const updated = prev.map(token => {
        if (!token.collected) {
          const dx = player.x - token.x;
          const dy = player.y - token.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < size / 2 + 10) {
            const points = token.value * 100 * comboMultiplier;
            setScore(s => s + points);
            setSize(s => Math.min(s + token.value * 2, 150));
            updateCombo();
            spawnToken();
            createParticles(token.x, token.y, ['#fbbf24', '#f59e0b', '#d97706'][token.value - 1]);
            addFloatingText(token.x, token.y, `+${Math.floor(points)}`);
            return { ...token, collected: true };
          }
        }
        return token;
      });
      return updated.filter(t => !t.collected);
    });

    // Check power-up collection
    setPowerUps(prev => {
      return prev.filter(powerUp => {
        const dx = player.x - powerUp.x;
        const dy = player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < size / 2 + 15) {
          setIsInvincible(true);
          setTimeout(() => setIsInvincible(false), 5000);
          createParticles(powerUp.x, powerUp.y, '#10b981', 15);
          addFloatingText(powerUp.x, powerUp.y, 'INVINCIBLE!', '#10b981');
          return false;
        }
        return true;
      });
    });

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      let newVx = enemy.vx;
      let newVy = enemy.vy;

      // AI: Chase player if bigger, flee if smaller
      if (!isInvincible) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          const shouldChase = enemy.size > size;
          const factor = shouldChase ? 0.05 : -0.05;
          newVx += (dx / distance) * factor;
          newVy += (dy / distance) * factor;
        }
      }

      // Limit speed
      const speed = Math.sqrt(newVx * newVx + newVy * newVy);
      if (speed > 2.5) {
        newVx = (newVx / speed) * 2.5;
        newVy = (newVy / speed) * 2.5;
      }

      let newX = enemy.x + newVx;
      let newY = enemy.y + newVy;

      // Wrap around
      if (newX < -enemy.size) newX = CANVAS_WIDTH + enemy.size;
      if (newX > CANVAS_WIDTH + enemy.size) newX = -enemy.size;
      if (newY < -enemy.size) newY = CANVAS_HEIGHT + enemy.size;
      if (newY > CANVAS_HEIGHT + enemy.size) newY = -enemy.size;

      // Check collision with player
      const dx = player.x - newX;
      const dy = player.y - newY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < size / 2 + enemy.size / 2) {
        if (isInvincible || size > enemy.size) {
          // Player eats enemy
          setScore(s => s + 500);
          setSize(s => Math.min(s + 10, 150));
          createParticles(newX, newY, enemy.color, 12);
          addFloatingText(newX, newY, '+500', '#ef4444');
          return { ...enemy, x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT, size: 40 + Math.random() * 30 };
        } else {
          // Game over
          if (score > highScore) setHighScore(score);
          setGameState('gameover');
        }
      }

      return { ...enemy, x: newX, y: newY, vx: newVx, vy: newVy };
    }));

    // Spawn power-up occasionally
    if (Math.random() < 0.002) {
      spawnPowerUp();
    }

    // Update particles
    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.2,
      life: p.life - 0.02
    })).filter(p => p.life > 0));

    // Update floating texts
    setFloatingTexts(prev => prev.map(t => ({
      ...t,
      y: t.y - 2,
      life: t.life - 0.015
    })).filter(t => t.life > 0));

    // Update time alive
    if (gameStartTime.current) {
      setTimeAlive(Math.floor((Date.now() - gameStartTime.current) / 1000));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, player, size, isInvincible, comboMultiplier, updateCombo, spawnToken, spawnPowerUp, score, highScore, createParticles, addFloatingText]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw tokens
    tokens.forEach(token => {
      const colors = ['#fbbf24', '#f59e0b', '#d97706'];
      ctx.fillStyle = colors[token.value - 1];
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[token.value - 1];
      ctx.beginPath();
      ctx.arc(token.x, token.y, 8 + token.value * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const pulse = Math.sin(Date.now() / 200) * 3 + 15;
      ctx.fillStyle = '#10b981';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', powerUp.x, powerUp.y);
    });

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      const eyeOffset = enemy.size / 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(enemy.x - eyeOffset, enemy.y - eyeOffset, enemy.size / 8, 0, Math.PI * 2);
      ctx.arc(enemy.x + eyeOffset, enemy.y - eyeOffset, enemy.size / 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player (Dobby)
    const playerColor = isInvincible ? '#10b981' : '#06b6d4';
    ctx.fillStyle = playerColor;
    ctx.shadowBlur = 25;
    ctx.shadowColor = playerColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dobby image or fallback emoji
    if (dobbyImage.current) {
      // Draw the actual Dobby image
      const imgSize = size * 1.2; // Make image slightly bigger than the circle
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.drawImage(
        dobbyImage.current,
        -imgSize / 2,
        -imgSize / 2,
        imgSize,
        imgSize
      );
      ctx.restore();
    } else {
      // Fallback to emoji if image fails to load
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${size / 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤖', player.x, player.y);
    }

    // Combo multiplier text
    if (comboMultiplier > 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${comboMultiplier.toFixed(1)}x COMBO!`, player.x, player.y - size / 2 - 20);
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw floating texts
    floatingTexts.forEach(text => {
      ctx.globalAlpha = text.life;
      ctx.fillStyle = text.color;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 5;
      ctx.shadowColor = text.color;
      ctx.fillText(text.text, text.x, text.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

  }, [player, size, tokens, enemies, powerUps, isInvincible, comboMultiplier, particles, floatingTexts]);

  useEffect(() => {
    if (gameState === 'playing') {
      const loop = () => {
        gameLoop();
        draw();
        animationRef.current = requestAnimationFrame(loop);
      };
      animationRef.current = requestAnimationFrame(loop);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState, gameLoop, draw]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mousePos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const startGame = () => {
    initGame();
    setGameState('playing');
  };

  if (gameState === 'menu') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
        <div className="text-center space-y-8 p-8 max-w-2xl">
          <div className="mb-8">
            <div className="text-8xl mb-4 animate-bounce">
              <img 
                src="https://i.postimg.cc/qqrhgmg2/image.png" 
                alt="Dobby" 
                className="w-32 h-32 mx-auto"
              />
            </div>
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4 animate-pulse">
              DOBBY.IO
            </h1>
            <p className="text-cyan-300 text-2xl font-mono">Stack Tokens, Grow Bigger, Dominate!</p>
          </div>

          <div className="bg-gradient-to-br from-black/70 to-purple-900/30 backdrop-blur-xl p-8 rounded-3xl border-2 border-cyan-500/50 shadow-2xl">
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-4 bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30">
                <Coins className="text-yellow-400 w-8 h-8" />
                <p className="text-white text-lg">Collect tokens to grow bigger and earn points</p>
              </div>

              <div className="flex items-center gap-4 bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
                <Trophy className="text-purple-400 w-8 h-8" />
                <p className="text-white text-lg">Build combos by collecting tokens rapidly!</p>
              </div>

              <div className="flex items-center gap-4 bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                <Skull className="text-red-400 w-8 h-8" />
                <p className="text-white text-lg">Avoid bigger enemies or eat smaller ones!</p>
              </div>

              <div className="flex items-center gap-4 bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                <Zap className="text-green-400 w-8 h-8" />
                <p className="text-white text-lg">Grab power-ups for temporary invincibility</p>
              </div>
            </div>

            {highScore > 0 && (
              <div className="mt-6 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/50">
                <p className="text-yellow-400 text-xl font-bold">🏆 HIGH SCORE: {highScore}</p>
              </div>
            )}

            <p className="text-cyan-400 text-lg mt-6 italic font-semibold">
              "{dobbyQuips[Math.floor(Math.random() * dobbyQuips.length)]}"
            </p>
          </div>

          <button
            onClick={startGame}
            className="group relative px-16 py-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-black text-3xl rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-purple-500/50"
          >
            <span className="relative z-10">START GAME</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <p className="text-gray-500 text-sm">Built for sentient.xyz</p>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    const survivalTime = timeAlive;
    const minutes = Math.floor(survivalTime / 60);
    const seconds = survivalTime % 60;
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-black">
        <div className="text-center space-y-8 p-12 bg-black/70 backdrop-blur-xl rounded-3xl border-2 border-red-500 max-w-lg">
          <div className="text-8xl mb-4 animate-bounce">💀</div>
          <h2 className="text-6xl font-black text-red-400 mb-4 animate-pulse">REKT!</h2>
          
          <div className="space-y-3">
            <p className="text-white text-3xl font-bold">Score: {score}</p>
            <p className="text-cyan-400 text-xl">
              Survived: {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
            </p>
            <p className="text-purple-400 text-lg">Final Size: {size.toFixed(0)}</p>
          </div>
          
          {score > highScore && (
            <p className="text-yellow-400 text-2xl font-bold animate-bounce">🎉 NEW HIGH SCORE! 🎉</p>
          )}
          {highScore > 0 && score !== highScore && (
            <p className="text-gray-400 text-xl">High Score: {highScore}</p>
          )}
          <p className="text-cyan-400 text-xl italic">
            "{dobbyQuips[Math.floor(Math.random() * dobbyQuips.length)]}"
          </p>
          <div className="space-y-4 mt-8">
            <button
              onClick={startGame}
              className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-2xl rounded-xl hover:from-cyan-400 hover:to-blue-500 transform hover:scale-105 transition-all shadow-lg"
            >
              PLAY AGAIN
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="w-full px-8 py-4 bg-gray-700 text-white font-bold text-xl rounded-xl hover:bg-gray-600 transition-all"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <div className="mb-4 w-full max-w-[1000px] bg-black/80 backdrop-blur p-4 rounded-xl border-2 border-cyan-500/50 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400" size={24} />
            <span className="text-white font-bold text-2xl">{score}</span>
          </div>
          <div className="text-cyan-400 font-bold text-xl">
            Size: {size.toFixed(0)}
          </div>
          <div className="text-purple-400 font-bold text-lg">
            ⏱️ {Math.floor(timeAlive / 60)}:{(timeAlive % 60).toString().padStart(2, '0')}
          </div>
          {comboMultiplier > 1 && (
            <div className="text-yellow-400 font-bold text-xl animate-pulse">
              {comboMultiplier.toFixed(1)}x COMBO
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isInvincible && (
            <div className="flex items-center gap-2 text-green-400 font-bold text-xl animate-pulse">
              <Zap size={24} />
              INVINCIBLE
            </div>
          )}
          {highScore > 0 && (
            <div className="text-yellow-400 font-bold text-lg">
              🏆 Best: {highScore}
            </div>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-cyan-500 rounded-2xl shadow-2xl shadow-cyan-500/50 cursor-none"
      />

      <div className="mt-4 text-gray-400 text-lg">
        Move your mouse to control Dobby • Collect tokens • Avoid bigger enemies!
      </div>
    </div>
  );
};

export default DobbyTokenEater;