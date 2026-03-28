/**
 * 2048 遊戲
 * @author 遊戲開發團隊
 * @version 1.0
 */

class Game2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.won = false;
        this.history = [];
        
        this.colors = {
            0: '#cdc1b4',
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e',
            4096: '#3c3722',
            8192: '#3c3722',
        };
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.addNewTile();
        this.addNewTile();
        this.render();
    }
    
    addNewTile() {
        const empty = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    empty.push({ x: i, y: j });
                }
            }
        }
        
        if (empty.length > 0) {
            const { x, y } = empty[Math.floor(Math.random() * empty.length)];
            this.board[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            let moved = false;
            switch(e.code) {
                case 'ArrowLeft': moved = this.move('left'); break;
                case 'ArrowRight': moved = this.move('right'); break;
                case 'ArrowUp': moved = this.move('up'); break;
                case 'ArrowDown': moved = this.move('down'); break;
                default: return;
            }
            e.preventDefault();
            if (moved) {
                this.addNewTile();
                this.render();
                this.checkWin();
            }
        });
        
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    }
    
    move(direction) {
        this.history.push(JSON.parse(JSON.stringify(this.board)));
        let moved = false;
        
        switch(direction) {
            case 'left': moved = this.moveLeft(); break;
            case 'right': moved = this.moveRight(); break;
            case 'up': moved = this.moveUp(); break;
            case 'down': moved = this.moveDown(); break;
        }
        
        return moved;
    }
    
    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0);
            const newRow = [];
            
            for (let j = 0; j < row.length; j++) {
                if (j > 0 && row[j] === row[j-1]) {
                    newRow[newRow.length - 1] *= 2;
                    this.score += newRow[newRow.length - 1];
                } else {
                    newRow.push(row[j]);
                }
            }
            
            while (newRow.length < this.size) {
                newRow.push(0);
            }
            
            if (JSON.stringify(newRow) !== JSON.stringify(this.board[i])) {
                moved = true;
                this.board[i] = newRow;
            }
        }
        return moved;
    }
    
    moveRight() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0).reverse();
            const newRow = [];
            
            for (let j = 0; j < row.length; j++) {
                if (j > 0 && row[j] === row[j-1]) {
                    newRow[newRow.length - 1] *= 2;
                    this.score += newRow[newRow.length - 1];
                } else {
                    newRow.push(row[j]);
                }
            }
            
            while (newRow.length < this.size) {
                newRow.unshift(0);
            }
            
            if (JSON.stringify(newRow) !== JSON.stringify(this.board[i])) {
                moved = true;
                this.board[i] = newRow.reverse();
            }
        }
        return moved;
    }
    
    moveUp() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            const col = [];
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== 0) col.push(this.board[i][j]);
            }
            
            const newCol = [];
            for (let i = 0; i < col.length; i++) {
                if (i > 0 && col[i] === col[i-1]) {
                    newCol[newCol.length - 1] *= 2;
                    this.score += newCol[newCol.length - 1];
                } else {
                    newCol.push(col[i]);
                }
            }
            
            while (newCol.length < this.size) {
                newCol.push(0);
            }
            
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== newCol[i]) {
                    moved = true;
                    this.board[i][j] = newCol[i];
                }
            }
        }
        return moved;
    }
    
    moveDown() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            const col = [];
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== 0) col.push(this.board[i][j]);
            }
            col.reverse();
            
            const newCol = [];
            for (let i = 0; i < col.length; i++) {
                if (i > 0 && col[i] === col[i-1]) {
                    newCol[newCol.length - 1] *= 2;
                    this.score += newCol[newCol.length - 1];
                } else {
                    newCol.push(col[i]);
                }
            }
            
            while (newCol.length < this.size) {
                newCol.unshift(0);
            }
            newCol.reverse();
            
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== newCol[i]) {
                    moved = true;
                    this.board[i][j] = newCol[i];
                }
            }
        }
        return moved;
    }
    
    render() {
        const grid = document.getElementById('gameGrid');
        grid.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.board[i][j];
                const tile = document.createElement('div');
                tile.className = 'tile';
                
                if (value === 0) {
                    tile.textContent = '';
                    tile.style.backgroundColor = this.colors[0];
                } else {
                    tile.textContent = value;
                    tile.style.backgroundColor = this.colors[value] || '#f0932f';
                    tile.style.color = value >= 8 ? '#fff' : '#776e65';
                }
                
                grid.appendChild(tile);
            }
        }
        
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            document.getElementById('highScore').textContent = this.highScore;
        }
    }
    
    checkWin() {
        if (!this.won) {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.board[i][j] === 2048) {
                        this.won = true;
                        alert(`恭喜！您達成了 2048！\n當前分數: ${this.score}`);
                        return;
                    }
                }
            }
        }
    }
    
    newGame() {
        if (confirm('確定要開始新遊戲嗎？')) {
            this.score = 0;
            this.won = false;
            this.history = [];
            this.init();
        }
    }
    
    undo() {
        if (this.history.length > 0) {
            this.board = this.history.pop();
            this.render();
        }
    }
    
    loadHighScore() {
        return parseInt(localStorage.getItem('game2048HighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('game2048HighScore', this.highScore.toString());
    }
}

// 初始化遊戲
let game2048;
window.addEventListener('DOMContentLoaded', () => {
    game2048 = new Game2048();
});
