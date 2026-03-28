/**
 * 西蒙說遊戲 - Simon Says
 * @author 遊戲開發團隊
 * @version 1.0
 */

class SimonGame {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 0;
        this.gameRunning = false;
        this.canPlayerMove = false;
        this.colors = ['red', 'blue', 'green', 'yellow'];
        this.colorFrequencies = {
            red: 400,
            blue: 600,
            green: 800,
            yellow: 1000
        };
        
        this.setupEventListeners();
        this.loadBestLevel();
    }
    
    setupEventListeners() {
        // 顏色按鈕
        document.querySelectorAll('.simon-pad').forEach(pad => {
            pad.addEventListener('click', () => {
                if (this.canPlayerMove) {
                    this.playerInput(pad.dataset.color);
                }
            });
        });
        
        // 控制按鈕
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }
    
    start() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            document.getElementById('startBtn').disabled = true;
            this.nextLevel();
        }
    }
    
    reset() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 0;
        this.gameRunning = false;
        this.canPlayerMove = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('message').textContent = '準備好了嗎？按開始遊戲！';
        this.updateDisplay();
    }
    
    nextLevel() {
        this.level++;
        this.playerSequence = [];
        this.canPlayerMove = false;
        document.getElementById('message').textContent = `第 ${this.level} 關`;
        
        // 添加隨機顏色
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);
        
        // 播放序列
        setTimeout(() => this.playSequence(), 500);
    }
    
    playSequence() {
        let delay = 0;
        
        this.sequence.forEach((color, index) => {
            delay += 600;
            setTimeout(() => {
                this.lightUpColor(color);
                soundManager.play('click', 0.2, this.colorFrequencies[color]);
            }, delay);
        });
        
        setTimeout(() => {
            this.canPlayerMove = true;
            document.getElementById('message').textContent = '輪到你了！';
        }, delay + 600);
    }
    
    playerInput(color) {
        this.playerSequence.push(color);
        this.lightUpColor(color);
        soundManager.play('click', 0.2, this.colorFrequencies[color]);
        
        // 檢查玩家的輸入
        const lastIndex = this.playerSequence.length - 1;
        
        if (this.playerSequence[lastIndex] !== this.sequence[lastIndex]) {
            // 失敗
            this.gameLose();
            return;
        }
        
        // 檢查是否完成本輪
        if (this.playerSequence.length === this.sequence.length) {
            this.canPlayerMove = false;
            document.getElementById('message').textContent = '正確！準備下一關...';
            
            setTimeout(() => this.nextLevel(), 1500);
        }
    }
    
    lightUpColor(color) {
        const pad = document.querySelector(`[data-color="${color}"]`);
        pad.classList.add('active');
        
        setTimeout(() => {
            pad.classList.remove('active');
        }, 300);
    }
    
    gameLose() {
        this.canPlayerMove = false;
        soundManager.play('gameover', 0.3, 100);
        
        document.getElementById('message').textContent = `遊戲結束！達到第 ${this.level} 關`;
        
        // 保存最高等級
        const bestLevel = storageManager.getHighScore('simon');
        if (this.level > bestLevel) {
            storageManager.saveHighScore('simon', this.level);
            this.loadBestLevel();
        }
        
        this.gameRunning = false;
        document.getElementById('startBtn').disabled = false;
    }
    
    loadBestLevel() {
        const best = storageManager.getHighScore('simon');
        document.getElementById('bestLevel').textContent = best > 0 ? best : '-';
    }
    
    updateDisplay() {
        document.getElementById('level').textContent = this.level;
    }
}

// 初始化遊戲
let simonGame;
window.addEventListener('DOMContentLoaded', () => {
    simonGame = new SimonGame();
});
