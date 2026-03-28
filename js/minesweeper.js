/**
 * Minesweeper Game
 * 掃雷遊戲 - 經典地雷遊戲
 */

const DIFFICULTIES = {
    easy: { rows: 8, cols: 8, mines: 10 },
    normal: { rows: 8, cols: 8, mines: 20 },
    hard: { rows: 10, cols: 10, mines: 30 }
};

class MinesweeperGame {
    constructor() {
        this.difficulty = 'easy';
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.won = false;
        this.startTime = null;
        this.timerInterval = null;
        
        this.initDOM();
        this.setupEventListeners();
        this.newGame();
    }
    
    initDOM() {
        this.gameGrid = document.getElementById('gameGrid');
        this.minesLeftEl = document.getElementById('minesLeft');
        this.flaggedEl = document.getElementById('flagged');
        this.timeEl = document.getElementById('time');
        this.newGameBtn = document.getElementById('newGameBtn');
        
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.difficulty;
                this.newGame();
            });
        });
    }
    
    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
    }
    
    createGrid() {
        const { rows, cols, mines } = DIFFICULTIES[this.difficulty];
        
        // Initialize empty grid
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
        this.revealed = Array(rows).fill(null).map(() => Array(cols).fill(false));
        this.flagged = Array(rows).fill(null).map(() => Array(cols).fill(false));
        
        // Place mines randomly
        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            
            if (this.grid[row][col] !== 'M') {
                this.grid[row][col] = 'M';
                minesPlaced++;
                
                // Update adjacent numbers
                for (let r = row - 1; r <= row + 1; r++) {
                    for (let c = col - 1; c <= col + 1; c++) {
                        if (r >= 0 && r < rows && c >= 0 && c < cols && this.grid[r][c] !== 'M') {
                            this.grid[r][c]++;
                        }
                    }
                }
            }
        }
    }
    
    renderGrid() {
        const { rows, cols } = DIFFICULTIES[this.difficulty];
        this.gameGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        this.gameGrid.innerHTML = '';
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                if (this.revealed[r][c]) {
                    cell.classList.add('revealed');
                    if (this.grid[r][c] === 'M') {
                        cell.textContent = '💣';
                        cell.classList.add('mine');
                    } else if (this.grid[r][c] > 0) {
                        cell.textContent = this.grid[r][c];
                    }
                } else if (this.flagged[r][c]) {
                    cell.classList.add('flag');
                    cell.textContent = '🚩';
                }
                
                cell.addEventListener('click', () => this.revealCell(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(r, c);
                });
                
                this.gameGrid.appendChild(cell);
            }
        }
    }
    
    revealCell(row, col) {
        if (this.gameOver || this.won || this.revealed[row][col]) return;
        
        if (this.flagged[row][col]) {
            this.toggleFlag(row, col);
            return;
        }
        
        if (this.grid[row][col] === 'M') {
            // Hit mine
            soundManager.play('error');
            this.revealAllMines();
            this.gameOver = true;
            this.updateUI();
            this.renderGrid();
            return;
        }
        
        // Reveal cell and surrounding empty cells
        soundManager.play('click');
        this.floodFill(row, col);
        this.checkWin();
        this.updateUI();
        this.renderGrid();
    }
    
    floodFill(row, col) {
        const { rows, cols } = DIFFICULTIES[this.difficulty];
        
        if (row < 0 || row >= rows || col < 0 || col >= cols) return;
        if (this.revealed[row][col]) return;
        
        this.revealed[row][col] = true;
        
        // If cell has no adjacent mines, reveal surrounding cells
        if (this.grid[row][col] === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    this.floodFill(r, c);
                }
            }
        }
    }
    
    toggleFlag(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;
        
        this.flagged[row][col] = !this.flagged[row][col];
        soundManager.play('click');
        this.updateUI();
        this.renderGrid();
    }
    
    revealAllMines() {
        const { rows, cols } = DIFFICULTIES[this.difficulty];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.grid[r][c] === 'M') {
                    this.revealed[r][c] = true;
                }
            }
        }
    }
    
    checkWin() {
        const { rows, cols, mines } = DIFFICULTIES[this.difficulty];
        let revealedCount = 0;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.revealed[r][c]) revealedCount++;
            }
        }
        
        if (revealedCount === rows * cols - mines) {
            soundManager.play('success');
            this.won = true;
            this.updateUI();
        }
    }
    
    updateUI() {
        if (!this.startTime) {
            this.startTime = Date.now();
            this.startTimer();
        }
        
        const { mines } = DIFFICULTIES[this.difficulty];
        const flaggedCount = this.flagged.flat().filter(f => f).length;
        
        this.minesLeftEl.textContent = Math.max(0, mines - flaggedCount);
        this.flaggedEl.textContent = flaggedCount;
        
        if (this.gameOver) {
            this.newGameBtn.textContent = '💀 遊戲結束！';
        } else if (this.won) {
            this.newGameBtn.textContent = '🎉 勝利！';
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.gameOver && !this.won) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this.timeEl.textContent = elapsed;
            }
        }, 1000);
    }
    
    newGame() {
        clearInterval(this.timerInterval);
        this.gameOver = false;
        this.won = false;
        this.startTime = null;
        this.createGrid();
        this.updateUI();
        this.renderGrid();
        this.timeEl.textContent = '0';
        this.newGameBtn.textContent = '🎮 新遊戲';
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.minesweeperGame = new MinesweeperGame();
});
