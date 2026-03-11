// 游戏配置
const CONFIG = {
    COLS: 10,
    ROWS: 20,
    BLOCK_SIZE: 30,
    INITIAL_SPEED: 1000,
    SPEED_DECREASE: 50,
    MIN_SPEED: 100,
    LINES_PER_LEVEL: 10,
    POINTS: {
        SOFT_DROP: 1,
        HARD_DROP: 2,
        SINGLE: 100,
        DOUBLE: 300,
        TRIPLE: 500,
        TETRIS: 800
    }
};

// 方块形状定义 (使用 SRS - Super Rotation System)
const SHAPES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f0a000'
    }
};

// 游戏类
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdPiece');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.soundEnabled = true;
        
        this.loadHighScore();
        this.initializeGame();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    createBoard() {
        return Array(CONFIG.ROWS).fill(null).map(() => Array(CONFIG.COLS).fill(0));
    }
    
    initializeGame() {
        this.nextPiece = this.randomPiece();
        this.spawnPiece();
    }
    
    randomPiece() {
        const shapes = Object.keys(SHAPES);
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        return {
            shape: SHAPES[randomShape].shape,
            color: SHAPES[randomShape].color,
            x: Math.floor(CONFIG.COLS / 2) - Math.floor(SHAPES[randomShape].shape[0].length / 2),
            y: 0,
            type: randomShape
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.canHold = true;
        
        if (this.collision()) {
            this.gameOver = true;
            this.endGame();
        }
        
        this.drawNextPiece();
    }
    
    collision(piece = this.currentPiece, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    
                    if (newX < 0 || newX >= CONFIG.COLS || newY >= CONFIG.ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    merge() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        const previousShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        // Wall kick - 尝试多个位置
        const kicks = [0, 1, -1, 2, -2];
        for (let kick of kicks) {
            if (!this.collision(this.currentPiece, kick, 0)) {
                this.currentPiece.x += kick;
                this.playSound('rotate');
                return;
            }
        }
        
        // 如果所有位置都不行，恢复原状
        this.currentPiece.shape = previousShape;
    }
    
    move(dir) {
        this.currentPiece.x += dir;
        if (this.collision()) {
            this.currentPiece.x -= dir;
            return false;
        }
        this.playSound('move');
        return true;
    }
    
    drop() {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.merge();
            const linesCleared = this.clearLines();
            this.updateScore(linesCleared);
            this.spawnPiece();
            this.dropCounter = 0;
        } else {
            this.score += CONFIG.POINTS.SOFT_DROP;
        }
        this.updateDisplay();
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (!this.collision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.score += dropDistance * CONFIG.POINTS.HARD_DROP;
        this.merge();
        const linesCleared = this.clearLines();
        this.updateScore(linesCleared);
        this.spawnPiece();
        this.playSound('drop');
        this.updateDisplay();
    }
    
    clearLines() {
        let linesCleared = 0;
        const rowsToClear = [];
        
        for (let y = CONFIG.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                rowsToClear.push(y);
                linesCleared++;
            }
        }
        
        if (linesCleared > 0) {
            // 动画效果
            this.animateClearedLines(rowsToClear);
            
            // 移除满行
            rowsToClear.forEach(row => {
                this.board.splice(row, 1);
                this.board.unshift(Array(CONFIG.COLS).fill(0));
            });
            
            this.playSound('clear');
        }
        
        return linesCleared;
    }
    
    animateClearedLines(rows) {
        rows.forEach(row => {
            for (let x = 0; x < CONFIG.COLS; x++) {
                this.board[row][x] = '#ffffff';
            }
        });
        this.draw();
    }
    
    updateScore(linesCleared) {
        if (linesCleared > 0) {
            const points = [0, CONFIG.POINTS.SINGLE, CONFIG.POINTS.DOUBLE, 
                          CONFIG.POINTS.TRIPLE, CONFIG.POINTS.TETRIS];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            
            // 升级检查
            const newLevel = Math.floor(this.lines / CONFIG.LINES_PER_LEVEL) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.playSound('levelup');
            }
            
            // 更新最高分
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }
        }
    }
    
    hold() {
        if (!this.canHold) return;
        
        this.playSound('hold');
        
        if (this.holdPiece === null) {
            this.holdPiece = this.currentPiece;
            this.spawnPiece();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = this.currentPiece;
            this.currentPiece = temp;
            this.currentPiece.x = Math.floor(CONFIG.COLS / 2) - 
                                  Math.floor(this.currentPiece.shape[0].length / 2);
            this.currentPiece.y = 0;
        }
        
        this.canHold = false;
        this.drawHoldPiece();
    }
    
    getDropSpeed() {
        return Math.max(
            CONFIG.MIN_SPEED,
            CONFIG.INITIAL_SPEED - (this.level - 1) * CONFIG.SPEED_DECREASE
        );
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制已固定的方块
        this.drawBoard();
        
        // 绘制幽灵方块（预览位置）
        this.drawGhost();
        
        // 绘制当前方块
        this.drawPiece();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2a2a3e';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= CONFIG.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * CONFIG.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= CONFIG.ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let y = 0; y < CONFIG.ROWS; y++) {
            for (let x = 0; x < CONFIG.COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x], this.ctx);
                }
            }
        }
    }
    
    drawPiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawBlock(
                        this.currentPiece.x + x,
                        this.currentPiece.y + y,
                        this.currentPiece.color,
                        this.ctx
                    );
                }
            }
        }
    }
    
    drawGhost() {
        if (!this.currentPiece) return;
        
        const ghost = { ...this.currentPiece };
        while (!this.collision(ghost, 0, 1)) {
            ghost.y++;
        }
        
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < ghost.shape.length; y++) {
            for (let x = 0; x < ghost.shape[y].length; x++) {
                if (ghost.shape[y][x]) {
                    this.drawBlock(ghost.x + x, ghost.y + y, ghost.color, this.ctx);
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
    }
    
    drawBlock(x, y, color, ctx) {
        const px = x * CONFIG.BLOCK_SIZE;
        const py = y * CONFIG.BLOCK_SIZE;
        
        // 主体
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
        
        // 高光效果
        const gradient = ctx.createLinearGradient(px, py, px + CONFIG.BLOCK_SIZE, py + CONFIG.BLOCK_SIZE);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
        
        // 边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#1a1a2e';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * CONFIG.BLOCK_SIZE) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * CONFIG.BLOCK_SIZE) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    const px = offsetX + x * CONFIG.BLOCK_SIZE;
                    const py = offsetY + y * CONFIG.BLOCK_SIZE;
                    
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
                    
                    this.nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    this.nextCtx.strokeRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.fillStyle = '#1a1a2e';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const offsetX = (this.holdCanvas.width - this.holdPiece.shape[0].length * CONFIG.BLOCK_SIZE) / 2;
        const offsetY = (this.holdCanvas.height - this.holdPiece.shape.length * CONFIG.BLOCK_SIZE) / 2;
        
        for (let y = 0; y < this.holdPiece.shape.length; y++) {
            for (let x = 0; x < this.holdPiece.shape[y].length; x++) {
                if (this.holdPiece.shape[y][x]) {
                    const px = offsetX + x * CONFIG.BLOCK_SIZE;
                    const py = offsetY + y * CONFIG.BLOCK_SIZE;
                    
                    this.holdCtx.fillStyle = this.holdPiece.color;
                    this.holdCtx.fillRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
                    
                    this.holdCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    this.holdCtx.strokeRect(px + 1, py + 1, CONFIG.BLOCK_SIZE - 2, CONFIG.BLOCK_SIZE - 2);
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('highScore').textContent = this.highScore;
        
        const goalLines = CONFIG.LINES_PER_LEVEL - (this.lines % CONFIG.LINES_PER_LEVEL);
        document.getElementById('goalLines').textContent = goalLines;
        
        const progress = ((this.lines % CONFIG.LINES_PER_LEVEL) / CONFIG.LINES_PER_LEVEL) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
    }
    
    gameLoop(time = 0) {
        if (this.gameOver || this.isPaused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.getDropSpeed()) {
            this.drop();
            this.dropCounter = 0;
        }
        
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    start() {
        if (this.gameOver) {
            this.reset();
        }
        this.isPaused = false;
        document.getElementById('gameOverlay').classList.add('hidden');
        document.getElementById('pauseButton').textContent = '⏸️ 暂停';
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('gameOverlay').classList.remove('hidden');
            document.getElementById('overlayTitle').textContent = '遊戲暫停';
            document.getElementById('overlayMessage').textContent = '按 P 鍵或點擊繼續按鈕繼續';
            document.getElementById('startButton').textContent = '繼續遊戲';
            document.getElementById('pauseButton').textContent = '▶️ 繼續';
        } else {
            document.getElementById('gameOverlay').classList.add('hidden');
            document.getElementById('pauseButton').textContent = '⏸️ 暫停';
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
        }
    }
    
    reset() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.holdPiece = null;
        this.canHold = true;
        this.dropCounter = 0;
        this.initializeGame();
        this.updateDisplay();
        this.drawHoldPiece();
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('gameOverlay').classList.remove('hidden');
        document.getElementById('overlayTitle').textContent = '遊戲結束！';
        document.getElementById('overlayMessage').textContent = `最終得分: ${this.score}`;
        document.getElementById('startButton').textContent = '重新開始';
        this.playSound('gameover');
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // 简单的音效提示（使用Web Audio API可以添加真实音效）
        const frequencies = {
            move: 200,
            rotate: 300,
            drop: 150,
            clear: 500,
            hold: 350,
            levelup: 600,
            gameover: 100
        };
        
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequencies[type] || 400;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundButton');
        btn.textContent = this.soundEnabled ? '🔊 音效' : '🔇 音效';
        btn.classList.toggle('active');
    }
    
    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('tetrisHighScore', this.highScore.toString());
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) {
                if (e.code === 'Space' || e.code === 'KeyP') {
                    if (this.gameOver) {
                        this.start();
                    } else {
                        this.pause();
                    }
                }
                return;
            }
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.move(-1);
                    break;
                case 'ArrowRight':
                    this.move(1);
                    break;
                case 'ArrowDown':
                    this.drop();
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case 'Space':
                    this.hardDrop();
                    break;
                case 'KeyC':
                    this.hold();
                    break;
                case 'KeyP':
                    this.pause();
                    break;
            }
            
            e.preventDefault();
        });
        
        // 按钮控制
        document.getElementById('startButton').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('pauseButton').addEventListener('click', () => {
            if (!this.gameOver) {
                this.pause();
            }
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.reset();
            this.start();
        });
        
        document.getElementById('soundButton').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // 移动端控制
        document.getElementById('mobileLeft').addEventListener('click', () => {
            if (!this.gameOver && !this.isPaused) this.move(-1);
        });
        
        document.getElementById('mobileRight').addEventListener('click', () => {
            if (!this.gameOver && !this.isPaused) this.move(1);
        });
        
        document.getElementById('mobileDown').addEventListener('click', () => {
            if (!this.gameOver && !this.isPaused) this.drop();
        });
        
        document.getElementById('mobileRotate').addEventListener('click', () => {
            if (!this.gameOver && !this.isPaused) this.rotate();
        });
        
        document.getElementById('mobileDrop').addEventListener('click', () => {
            if (!this.gameOver && !this.isPaused) this.hardDrop();
        });
        
        document.getElementById('mobileHold').addEventListener('click', () => {
            if (!this.gameOver && !this.isPaused) this.hold();
        });
    }
}

// 初始化游戏
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new TetrisGame();
});
