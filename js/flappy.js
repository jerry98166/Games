/**
 * Flappy Bird 遊戲
 * @author 遊戲開發團隊
 * @version 1.0
 */

class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 小鳥設置
        this.bird = {
            x: 50,
            y: this.canvas.height / 2,
            width: 30,
            height: 30,
            gravity: 0.5,
            velocity: 0,
            jump: -10
        };
        
        // 管道設置
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 120;
        this.pipeDistance = 200;
        this.nextPipeX = this.canvas.width;
        
        // 遊戲狀態
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.soundEnabled = true;
        this.gameSpeed = 4;
        
        // 事件監聽
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // 滑鼠點擊
        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning) {
                this.start();
            } else {
                this.flap();
            }
        });
        
        // 鍵盤
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.gameRunning) {
                    this.start();
                } else {
                    this.flap();
                }
                e.preventDefault();
            }
        });
        
        // 按鈕
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            document.getElementById('soundToggle').textContent = this.soundEnabled ? '🔊' : '🔇';
        });
    }
    
    start() {
        if (!this.gameRunning) {
            this.reset();
            this.gameRunning = true;
            this.gamePaused = false;
            document.getElementById('startBtn').textContent = '▶️ 繼續';
            document.getElementById('pauseBtn').textContent = '⏸️ 暫停';
            this.gameLoop();
        }
    }
    
    reset() {
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.nextPipeX = this.canvas.width;
        this.gameSpeed = 4;
        this.updateDisplay();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            document.getElementById('pauseBtn').textContent = '▶️ 繼續';
        } else {
            document.getElementById('pauseBtn').textContent = '⏸️ 暫停';
            this.gameLoop();
        }
    }
    
    flap() {
        if (this.gameRunning && !this.gamePaused) {
            this.bird.velocity = this.bird.jump;
            this.playSound('flap');
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // 更新小鳥位置
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // 檢查邊界碰撞
        if (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0) {
            this.endGame();
            return;
        }
        
        // 生成管道
        if (this.nextPipeX < 0) {
            this.nextPipeX = this.canvas.width;
            this.gameSpeed = Math.min(this.gameSpeed + 0.2, 8);
        }
        
        if (this.nextPipeX <= this.canvas.width - this.pipeDistance) {
            const gap = this.pipeGap;
            const minY = 30;
            const maxY = this.canvas.height - gap - 30;
            const topY = Math.random() * (maxY - minY) + minY;
            
            this.pipes.push({
                x: this.canvas.width,
                topY: topY,
                bottomY: topY + gap,
                scored: false
            });
            
            this.nextPipeX = this.canvas.width;
        }
        
        // 更新管道位置並檢查碰撞
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.gameSpeed;
            
            // 移除出屏管道
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // 加分
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                this.score++;
                pipe.scored = true;
                this.playSound('score');
                
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.saveHighScore();
                }
                
                this.updateDisplay();
            }
            
            // 檢查碰撞
            if (this.checkCollision(pipe)) {
                this.endGame();
                return;
            }
        }
        
        this.nextPipeX -= this.gameSpeed;
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkCollision(pipe) {
        // 檢查與管道的碰撞
        if (this.bird.x + this.bird.width > pipe.x && 
            this.bird.x < pipe.x + this.pipeWidth) {
            
            if (this.bird.y < pipe.topY || 
                this.bird.y + this.bird.height > pipe.bottomY) {
                return true;
            }
        }
        return false;
    }
    
    draw() {
        // 背景
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 天空和地面
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F6FF');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 地面
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
        
        // 繪製管道
        this.ctx.fillStyle = '#228B22';
        this.ctx.strokeStyle = '#1a5c1a';
        this.ctx.lineWidth = 2;
        
        for (let pipe of this.pipes) {
            // 上管道
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topY);
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topY);
            
            // 下管道
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, 
                            this.canvas.height - pipe.bottomY);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, 
                              this.canvas.height - pipe.bottomY);
        }
        
        // 繪製小鳥
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + 8, this.bird.y - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 嘴巴
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.x + 10, this.bird.y);
        this.ctx.lineTo(this.bird.x + 15, this.bird.y + 2);
        this.ctx.stroke();
        
        // 顯示分數
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(this.score, this.canvas.width / 2 - 15, 50);
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        this.playSound('gameover');
        let message = `遊戲結束！\n分數: ${this.score}\n最高分: ${this.highScore}`;
        alert(message);
        document.getElementById('startBtn').textContent = '🎮 開始遊戲';
        document.getElementById('pauseBtn').textContent = '⏸️ 暫停';
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        const frequencies = {
            flap: 400,
            score: 800,
            gameover: 150
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
        return parseInt(localStorage.getItem('flappyHighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('flappyHighScore', this.highScore.toString());
    }
}

// 初始化遊戲
let flappyGame;
window.addEventListener('DOMContentLoaded', () => {
    flappyGame = new FlappyBirdGame();
    flappyGame.draw();
});
