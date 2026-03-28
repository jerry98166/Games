/**
 * 貪食蛇遊戲
 * @author 遊戲開發團隊
 * @version 1.0
 */

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 遊戲配置
        this.gridSize = 20;
        this.cols = this.canvas.width / this.gridSize;
        this.rows = this.canvas.height / this.gridSize;
        
        // 遊戲狀態
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameSpeed = 100;
        this.soundEnabled = true;
        
        // 事件監聽
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    generateFood() {
        let food;
        let onSnake;
        do {
            onSnake = false;
            food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            
            for (let segment of this.snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    onSnake = true;
                    break;
                }
            }
        } while (onSnake);
        
        return food;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: 1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: -1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: 1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'Space':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });
        
        // 按鈕控制
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        // 移動端控制
        document.getElementById('btnUp')?.addEventListener('click', () => {
            if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
        });
        document.getElementById('btnDown')?.addEventListener('click', () => {
            if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
        });
        document.getElementById('btnLeft')?.addEventListener('click', () => {
            if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
        });
        document.getElementById('btnRight')?.addEventListener('click', () => {
            if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
        });
        
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            document.getElementById('soundToggle').textContent = this.soundEnabled ? '🔊' : '🔇';
        });
    }
    
    start() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            document.getElementById('startBtn').textContent = '▶️ 繼續';
            document.getElementById('pauseBtn').textContent = '⏸️ 暫停';
            this.update();
        }
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            document.getElementById('pauseBtn').textContent = '▶️ 繼續';
        } else {
            document.getElementById('pauseBtn').textContent = '⏸️ 暫停';
            this.update();
        }
    }
    
    restart() {
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameSpeed = 100;
        this.gameRunning = false;
        this.gamePaused = false;
        document.getElementById('startBtn').textContent = '🎮 開始';
        document.getElementById('pauseBtn').textContent = '⏸️ 暫停';
        this.updateDisplay();
        this.draw();
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.direction = this.nextDirection;
        
        // 計算新的頭位置
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 檢查碰撞
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver();
            return;
        }
        
        // 檢查自碰
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // 檢查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.gameSpeed = Math.max(50, this.gameSpeed - 1);
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }
            
            this.playSound('eat');
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
        
        this.updateDisplay();
        this.draw();
        
        setTimeout(() => this.update(), this.gameSpeed);
    }
    
    draw() {
        // 清空畫布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製網格
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // 繪製蛇
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            if (i === 0) {
                // 頭部
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                
                // 眼睛
                this.ctx.fillStyle = '#000';
                const eyeOffset = this.gridSize / 6;
                if (this.direction.x === 1) {
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset + 5, segment.y * this.gridSize + eyeOffset, 3, 3);
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset + 5, segment.y * this.gridSize + eyeOffset + 8, 3, 3);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset - 2, segment.y * this.gridSize + eyeOffset, 3, 3);
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset - 2, segment.y * this.gridSize + eyeOffset + 8, 3, 3);
                } else if (this.direction.y === -1) {
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + eyeOffset - 2, 3, 3);
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset + 8, segment.y * this.gridSize + eyeOffset - 2, 3, 3);
                } else {
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + eyeOffset + 5, 3, 3);
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset + 8, segment.y * this.gridSize + eyeOffset + 5, 3, 3);
                }
            } else {
                // 身體
                this.ctx.fillStyle = `hsl(120, 100%, ${40 + i * 3}%)`;
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize - 4
                );
            }
        }
        
        // 繪製食物
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 食物的光暈
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    gameOver() {
        this.gameRunning = false;
        this.playSound('gameover');
        alert(`遊戲結束！\n分數: ${this.score}\n最高分: ${this.highScore}`);
        document.getElementById('startBtn').textContent = '🎮 開始';
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('snakeLength').textContent = this.snake.length;
        document.getElementById('speed').textContent = (Math.round((150 - this.gameSpeed) / 10) / 10) + 'x';
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        const frequencies = {
            eat: 400,
            gameover: 100
        };
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequencies[type] || 400;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch(e) {}
    }
    
    loadHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
}

// 初始化遊戲
let snakeGame;
window.addEventListener('DOMContentLoaded', () => {
    snakeGame = new SnakeGame();
    snakeGame.draw();
});
