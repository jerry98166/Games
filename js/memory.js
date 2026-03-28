/**
 * 記憶力遊戲 - Memory Game
 * @author 遊戲開發團隊
 * @version 1.0
 */

class MemoryGame {
    constructor() {
        this.cards = [];
        this.flipped = [];
        this.matched = 0;
        this.moves = 0;
        this.difficulty = 'normal'; // easy(4x4=16), normal(4x4=16), hard(4x5=20)
        this.gameRunning = false;
        this.canFlip = true;
        
        this.emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.createCards();
        this.shuffle();
        this.renderCards();
        this.gameRunning = true;
        this.updateDisplay();
    }
    
    createCards() {
        this.cards = [];
        const pairsCount = this.difficulty === 'hard' ? 10 : 8;
        const selectedEmojis = this.emojis.slice(0, pairsCount);
        
        // 建立配對
        selectedEmojis.forEach(emoji => {
            this.cards.push({ emoji, flipped: false, matched: false, id: emoji });
            this.cards.push({ emoji, flipped: false, matched: false, id: emoji });
        });
    }
    
    shuffle() {
        // Fisher-Yates 洗牌算法
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    renderCards() {
        const grid = document.getElementById('gameGrid');
        grid.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            if (card.flipped || card.matched) {
                cardEl.classList.add('flipped');
                cardEl.textContent = card.emoji;
            } else {
                cardEl.textContent = '?';
            }
            
            if (card.matched) {
                cardEl.classList.add('matched');
            }
            
            cardEl.addEventListener('click', () => this.flipCard(index));
            grid.appendChild(cardEl);
        });
    }
    
    flipCard(index) {
        if (!this.gameRunning || !this.canFlip) return;
        if (this.flipped.length >= 2) return;
        if (this.cards[index].matched) return;
        if (this.cards[index].flipped) return;
        
        this.cards[index].flipped = true;
        this.flipped.push(index);
        this.renderCards();
        
        soundManager.play('click');
        
        if (this.flipped.length === 2) {
            this.moves++;
            this.checkMatch();
        }
    }
    
    checkMatch() {
        this.canFlip = false;
        const [first, second] = this.flipped;
        
        setTimeout(() => {
            if (this.cards[first].id === this.cards[second].id) {
                // 配對成功
                this.cards[first].matched = true;
                this.cards[second].matched = true;
                this.matched += 1;
                soundManager.play('success');
                
                if (this.matched === (this.difficulty === 'hard' ? 10 : 8)) {
                    this.gameWon();
                    return;
                }
            } else {
                // 配對失敗
                this.cards[first].flipped = false;
                this.cards[second].flipped = false;
                soundManager.play('error');
            }
            
            this.flipped = [];
            this.canFlip = true;
            this.updateDisplay();
            this.renderCards();
        }, 600);
    }
    
    gameWon() {
        this.gameRunning = false;
        soundManager.play('success', 0.3, 800);
        
        const bestMoves = storageManager.getHighScore('memory_' + this.difficulty);
        if (this.moves < bestMoves || bestMoves === 0) {
            storageManager.saveHighScore('memory_' + this.difficulty, this.moves);
        }
        
        this.updateDisplay();
        alert(`🎉 恭喜！\n移動次數: ${this.moves}\n最佳紀錄: ${bestMoves > 0 ? bestMoves : '新紀錄!'}`);
    }
    
    newGame() {
        this.cards = [];
        this.flipped = [];
        this.matched = 0;
        this.moves = 0;
        this.init();
    }
    
    changeDifficulty() {
        const difficulties = ['easy', 'normal', 'hard'];
        const current = difficulties.indexOf(this.difficulty);
        this.difficulty = difficulties[(current + 1) % difficulties.length];
        
        const labels = { easy: '簡單', normal: '普通', hard: '困難' };
        document.getElementById('difficultyBtn').textContent = `⭐ 難度: ${labels[this.difficulty]}`;
        
        this.newGame();
    }
    
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('difficultyBtn').addEventListener('click', () => this.changeDifficulty());
    }
    
    updateDisplay() {
        document.getElementById('moves').textContent = this.moves;
        const totalPairs = this.difficulty === 'hard' ? 10 : 8;
        document.getElementById('matches').textContent = `${this.matched}/${totalPairs}`;
        
        const bestMoves = storageManager.getHighScore('memory_' + this.difficulty);
        document.getElementById('bestMoves').textContent = bestMoves > 0 ? bestMoves : '-';
    }
}

// 初始化遊戲
let memoryGame;
window.addEventListener('DOMContentLoaded', () => {
    memoryGame = new MemoryGame();
});
