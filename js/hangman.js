/**
 * Hangman Game
 * 猜字遊戲 - 經典單詞猜測遊戲
 */

const WORD_LISTS = {
    '動物': ['貓', '狗', '大象', '獅子', '老虎', '斑馬', '長頸鹿', '猴子', '熊貓', '企鵝', '鷹', '蛇', '魚', '馬', '鹿'],
    '水果': ['蘋果', '香蕉', '榴槤', '芒果', '葡萄', '草莓', '西瓜', '檸檬', '橙子', '黑莓', '藍莓', '桃子', '梨', '鳳梨'],
    '國家': ['中國', '日本', '韓國', '美國', '加拿大', '英國', '法國', '德國', '意大利', '西班牙', '澳大利亞', '巴西', '墨西哥'],
    '職業': ['醫生', '律師', '教師', '工程師', '建築師', '設計師', '廚師', '演員', '畫家', '音樂家', '運動員', '記者', '護士'],
    '顏色': ['紅色', '藍色', '綠色', '黃色', '橙色', '紫色', '黑色', '白色', '灰色', '粉紅色', '金色', '銀色', '青色']
};

class HangmanGame {
    constructor() {
        this.guessedLetters = [];
        this.wrongGuesses = [];
        this.maxWrong = 6;
        this.word = '';
        this.category = '';
        this.wins = parseInt(storageManager.get('hangman_wins')) || 0;
        
        this.hangmanStages = ['😊', '😐', '😕', '😟', '😨', '😵', '💀'];
        
        this.initDOM();
        this.setupEventListeners();
        this.newGame();
    }
    
    initDOM() {
        this.hangmanEl = document.getElementById('hangman');
        this.wordDisplayEl = document.getElementById('wordDisplay');
        this.mistakesEl = document.getElementById('mistakes');
        this.winsEl = document.getElementById('wins');
        this.categoryEl = document.getElementById('category');
        this.guessListEl = document.getElementById('guessList');
        this.alphabetEl = document.getElementById('alphabet');
        this.newGameBtn = document.getElementById('newGameBtn');
    }
    
    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
    }
    
    createAlphabet() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.alphabetEl.innerHTML = '';
        
        for (let char of chars) {
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = char;
            btn.dataset.letter = char.toLowerCase();
            
            btn.addEventListener('click', (e) => {
                const letter = char.toLowerCase();
                this.guessLetter(letter);
                e.target.disabled = true;
            });
            
            this.alphabetEl.appendChild(btn);
        }
    }
    
    guessLetter(letter) {
        if (this.guessedLetters.includes(letter) || this.wrongGuesses.includes(letter)) return;
        
        const wordLetters = this.word.toLowerCase().split('');
        
        if (wordLetters.includes(letter)) {
            soundManager.play('success');
            this.guessedLetters.push(letter);
        } else {
            soundManager.play('error');
            this.wrongGuesses.push(letter);
        }
        
        this.checkGameStatus();
        this.render();
    }
    
    checkGameStatus() {
        const wordLetters = new Set(this.word.toLowerCase().split(''));
        const guessedSet = new Set(this.guessedLetters);
        const won = Array.from(wordLetters).every(letter => guessedSet.has(letter));
        
        if (won) {
            soundManager.play('success');
            this.wins++;
            storageManager.set('hangman_wins', this.wins.toString());
            this.newGameBtn.textContent = '🎉 勝利！按新遊戲继续';
            return true;
        }
        
        if (this.wrongGuesses.length >= this.maxWrong) {
            soundManager.play('error');
            this.newGameBtn.textContent = '💀 遊戲結束！';
            return true;
        }
        
        return false;
    }
    
    render() {
        // Update hangman display
        const stage = Math.min(this.wrongGuesses.length, this.maxWrong);
        this.hangmanEl.textContent = this.hangmanStages[stage];
        
        // Update word display
        let displayWord = '';
        for (let char of this.word.toLowerCase()) {
            if (this.guessedLetters.includes(char)) {
                displayWord += char.toUpperCase() + ' ';
            } else {
                displayWord += '_ ';
            }
        }
        this.wordDisplayEl.innerHTML = displayWord.split('').map(c => `<span>${c}</span>`).join('');
        
        // Update guessed letters
        const allGuessed = [...this.guessedLetters, ...this.wrongGuesses].sort();
        const guessList = allGuessed.length > 0 
            ? allGuessed.map((l, i, arr) => {
                const isWrong = this.wrongGuesses.includes(l);
                return `<span style="color: ${isWrong ? '#ff6b6b' : '#4db8a8'}; font-weight: bold;">${l.toUpperCase()}</span>`;
              }).join(', ')
            : '無';
        this.guessListEl.innerHTML = guessList;
        
        // Update stats
        this.mistakesEl.textContent = `${this.wrongGuesses.length} / ${this.maxWrong}`;
        this.winsEl.textContent = this.wins;
        this.categoryEl.textContent = this.category;
        
        // Disable guessed buttons
        document.querySelectorAll('.letter-btn').forEach(btn => {
            const letter = btn.dataset.letter;
            if (allGuessed.includes(letter)) {
                btn.disabled = true;
                if (this.wrongGuesses.includes(letter)) {
                    btn.classList.add('wrong');
                }
            }
        });
    }
    
    newGame() {
        // Pick random category
        const categories = Object.keys(WORD_LISTS);
        this.category = categories[Math.floor(Math.random() * categories.length)];
        
        // Pick random word from category
        const words = WORD_LISTS[this.category];
        this.word = words[Math.floor(Math.random() * words.length)];
        
        // Reset guesses
        this.guessedLetters = [];
        this.wrongGuesses = [];
        this.newGameBtn.textContent = '🎮 新遊戲';
        
        this.createAlphabet();
        this.render();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.hangmanGame = new HangmanGame();
});
