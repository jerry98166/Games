/**
 * 磚塊破壞者遊戲
 * @author 遊戲開發團隊
 * @version 1.0
 */

class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 球
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            radius: 6,
            vx: 0,
            vy: 0,
            speed: 4
        };
        
        // 球拍
        this.paddle = {
            x: this.canvas.width / 2 - 50,
            y: this.canvas.height - 20,
            width: 100,
            height: 15,
            speed: 6
        };
        
        // 磚塊
        this.bricks = [];
        this.createBricks();
        
        // 遊戲狀態
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameRunning = false;
        this.gamePaused = false;
        this.ballLaunched = false;
        this.soundEnabled = true;
        this.keys = {};
        
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    createBricks() {
        this.bricks = [];
        const cols = 8;
        const rows = 3 + this.level;
        const brickWidth = (this.canvas.width - 20) / cols;
        const brickHeight = 15;
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3'];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.bricks.push({
                    x: 10 + c * brickWidth,
                    y: 50 + r * (brickHeight + 5),
                    width: brickWidth - 2,
                    height: brickHeight,
                    color: colors[r % colors.length],
                    hit: false
                });
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                if (!this.gameRunning) {
                    this.start();
                } else {
                    this.launchBall();
                }
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 滑鼠控制
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            this.paddle.x = Math.max(0, Math.min(mouseX - this.paddle.width / 2, 
                                               this.canvas.width - this.paddle.width));
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
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
            this.gameLoop();
        }
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) this.gameLoop();
    }
    
    launchBall() {
        if (!this.ballLaunched && this.gameRunning) {
            this.ballLaunched = true;
            const angle = (Math.random() - 0.5) * 0.5;
            this.ball.vx = Math.sin(angle) * this.ball.speed;
            this.ball.vy = -Math.abs(Math.cos(angle) * this.ball.speed);
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // 移動球拍
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.paddle.x = Math.min(this.canvas.width - this.paddle.width, 
                                    this.paddle.x + this.paddle.speed);
        }
        
        // 更新球
        if (this.ballLaunched) {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            
            // 邊界碰撞
            if (this.ball.x - this.ball.radius < 0 || 
                this.ball.x + this.ball.radius > this.canvas.width) {
                this.ball.vx = -this.ball.vx;
                this.ball.x = Math.max(this.ball.radius, 
                                      Math.min(this.canvas.width - this.ball.radius, this.ball.x));
            }
            
            if (this.ball.y - this.ball.radius < 0) {
                this.ball.vy = -this.ball.vy;
            }
            
            // 檢查與球拍的碰撞
            if (this.checkPaddleCollision()) {
                this.ball.vy = -Math.abs(this.ball.vy);
                this.playSound('paddle');
            }
            
            // 檢查與磚塊的碰撞
            this.checkBrickCollision();
            
            // 球掉出屏幕
            if (this.ball.y > this.canvas.height) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    this.resetBall();
                }
            }
        }
        
        // 檢查是否贏了
        if (this.bricks.length === 0 || this.bricks.every(b => b.hit)) {
            this.nextLevel();
        }
        
        this.updateDisplay();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkPaddleCollision() {
        if (this.ball.vy > 0 &&
            this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width - 0.5;
            this.ball.vx = hitPos * 6;
            return true;
        }
        return false;
    }
    
    checkBrickCollision() {
        for (let brick of this.bricks) {
            if (brick.hit) continue;
            
            if (this.ball.x > brick.x && 
                this.ball.x < brick.x + brick.width &&
                this.ball.y > brick.y &&
                this.ball.y < brick.y + brick.height) {
                
                brick.hit = true;
                this.score += 10 * this.level;
                this.playSound('brick');
                
                const brickCenterY = brick.y + brick.height / 2;
                if (Math.abs(this.ball.y - brickCenterY) < this.ball.radius) {
                    this.ball.vy = -this.ball.vy;
                } else {
                    this.ball.vx = -this.ball.vx;
                }
                
                return;
            }
        }
    }
    
    resetBall() {
        this.ballLaunched = false;
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - 15;
        this.ball.vx = 0;
        this.ball.vy = 0;
    }
    
    nextLevel() {
        this.level++;
        this.ball.speed = Math.min(6, this.ball.speed + 0.5);
        this.createBricks();
        this.resetBall();
    }
    
    gameOver() {
        this.gameRunning = false;
        this.playSound('gameover');
        alert(`遊戲結束！\n分數: ${this.score}\n達到等級: ${this.level}`);
        document.getElementById('startBtn').textContent = '🎮 開始遊戲';
        this.lives = 3;
    }
    
    draw() {
        // 背景
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 磚塊
        for (let brick of this.bricks) {
            if (!brick.hit) {
                this.ctx.fillStyle = brick.color;
                this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        }
        
        // 球拍
        this.ctx.fillStyle = '#a8edea';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // 球
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
        
        // 提示
        if (!this.ballLaunched && this.gameRunning) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('按 Space 發射', this.canvas.width / 2, this.canvas.height - 50);
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        const frequencies = {
            paddle: 400,
            brick: 600,
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
}

// 初始化遊戲
let breakoutGame;
window.addEventListener('DOMContentLoaded', () => {
    breakoutGame = new BreakoutGame();
    breakoutGame.draw();
});
