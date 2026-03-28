/**
 * Pong Game
 * 乒乓球遊戲 - 經典雙邊球拍遊戲，對戰 AI
 */

class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Paddle properties
        this.paddleHeight = 80;
        this.paddleWidth = 10;
        this.paddleSpeed = 6;
        
        // Ball properties
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 8,
            speedX: 5,
            speedY: 5,
            maxSpeed: 10
        };
        
        // Players
        this.player = {
            y: this.height / 2 - this.paddleHeight / 2,
            score: parseInt(storageManager.get('pong_player_score')) || 0
        };
        
        this.ai = {
            y: this.height / 2 - this.paddleHeight / 2,
            score: parseInt(storageManager.get('pong_ai_score')) || 0
        };
        
        // Game state
        this.gameRunning = true;
        this.keysPressed = {};
        
        this.initDOM();
        this.setupEventListeners();
        this.update();
    }
    
    initDOM() {
        this.playerScoreEl = document.getElementById('playerScore');
        this.aiScoreEl = document.getElementById('aiScore');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keysPressed[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            this.player.y = mouseY - this.paddleHeight / 2;
            this.constrainPaddle(this.player);
        });
        
        this.startBtn.addEventListener('click', () => {
            this.gameRunning = !this.gameRunning;
            this.startBtn.textContent = this.gameRunning ? '⏸️ 暫停' : '▶️ 繼續';
        });
        
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }
    
    constrainPaddle(paddle) {
        if (paddle.y < 0) paddle.y = 0;
        if (paddle.y + this.paddleHeight > this.height) {
            paddle.y = this.height - this.paddleHeight;
        }
    }
    
    update() {
        if (this.gameRunning) {
            // Update player paddle
            if (this.keysPressed['ArrowUp'] || this.keysPressed['w']) {
                this.player.y -= this.paddleSpeed;
            }
            if (this.keysPressed['ArrowDown'] || this.keysPressed['s']) {
                this.player.y += this.paddleSpeed;
            }
            this.constrainPaddle(this.player);
            
            // Update AI paddle
            const aiCenter = this.ai.y + this.paddleHeight / 2;
            const ballCenter = this.ball.y;
            const error = 20; // AI imperfection
            
            if (aiCenter < ballCenter - error) {
                this.ai.y += this.paddleSpeed * 0.8;
            } else if (aiCenter > ballCenter + error) {
                this.ai.y -= this.paddleSpeed * 0.8;
            }
            this.constrainPaddle(this.ai);
            
            // Update ball
            this.ball.x += this.ball.speedX;
            this.ball.y += this.ball.speedY;
            
            // Ball collision with top/bottom
            if (this.ball.y - this.ball.radius < 0 || 
                this.ball.y + this.ball.radius > this.height) {
                this.ball.speedY *= -1;
                soundManager.play('click');
            }
            
            // Ball collision with paddles
            this.checkPaddleCollision();
            
            // Ball out of bounds
            if (this.ball.x < 0) {
                this.ai.score++;
                this.resetBall();
                soundManager.play('success');
            } else if (this.ball.x > this.width) {
                this.player.score++;
                this.resetBall();
                soundManager.play('success');
            }
            
            // Update scores
            this.updateScoreDisplay();
        }
        
        this.draw();
        requestAnimationFrame(() => this.update());
    }
    
    checkPaddleCollision() {
        // Player paddle (left side)
        if (this.ball.x - this.ball.radius < 15 &&
            this.ball.y > this.player.y &&
            this.ball.y < this.player.y + this.paddleHeight) {
            this.ball.speedX *= -1;
            this.ball.x = 15 + this.ball.radius;
            // Add angle based on hit location
            const hitPos = (this.ball.y - this.player.y) / this.paddleHeight - 0.5;
            this.ball.speedY += hitPos * 3;
            this.limitBallSpeed();
            soundManager.play('click');
        }
        
        // AI paddle (right side)
        if (this.ball.x + this.ball.radius > this.width - 15 &&
            this.ball.y > this.ai.y &&
            this.ball.y < this.ai.y + this.paddleHeight) {
            this.ball.speedX *= -1;
            this.ball.x = this.width - 15 - this.ball.radius;
            // Add angle based on hit location
            const hitPos = (this.ball.y - this.ai.y) / this.paddleHeight - 0.5;
            this.ball.speedY += hitPos * 3;
            this.limitBallSpeed();
            soundManager.play('click');
        }
    }
    
    limitBallSpeed() {
        const speed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
        if (speed > this.ball.maxSpeed) {
            this.ball.speedX = (this.ball.speedX / speed) * this.ball.maxSpeed;
            this.ball.speedY = (this.ball.speedY / speed) * this.ball.maxSpeed;
        }
    }
    
    resetBall() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.speedY = (Math.random() - 0.5) * 5;
    }
    
    updateScoreDisplay() {
        this.playerScoreEl.textContent = this.player.score;
        this.aiScoreEl.textContent = this.ai.score;
        storageManager.set('pong_player_score', this.player.score.toString());
        storageManager.set('pong_ai_score', this.ai.score.toString());
    }
    
    resetGame() {
        this.player.score = 0;
        this.ai.score = 0;
        this.resetBall();
        this.updateScoreDisplay();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw center line
        this.ctx.strokeStyle = '#4facfe';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw player paddle
        this.ctx.fillStyle = '#4facfe';
        this.ctx.fillRect(0, this.player.y, this.paddleWidth, this.paddleHeight);
        
        // Draw AI paddle
        this.ctx.fillStyle = '#00f2fe';
        this.ctx.fillRect(this.width - this.paddleWidth, this.ai.y, 
                         this.paddleWidth, this.paddleHeight);
        
        // Draw ball
        this.ctx.fillStyle = '#4facfe';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw ball glow
        this.ctx.strokeStyle = 'rgba(79, 172, 254, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 3, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pongGame = new PongGame();
});
