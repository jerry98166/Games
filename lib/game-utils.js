/**
 * 遊戲工具庫 - 共用函數和工具
 * @author 遊戲開發團隊
 * @version 1.0
 */

// ==================== 音效管理器 ====================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            const audioContext = window.AudioContext || window.webkitAudioContext;
            if (audioContext) {
                this.audioContext = new audioContext();
            }
        } catch(e) {
            console.warn('Audio Context not available');
        }
    }
    
    play(type = 'click', duration = 0.1, frequency = 400) {
        if (!this.enabled || !this.audioContext) return;
        
        const frequencies = {
            click: 400,
            success: 800,
            error: 200,
            warning: 300,
            score: 600,
            levelup: 700,
            gameover: 100,
            button: 500
        };
        
        frequency = frequencies[type] || frequency;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch(e) {
            console.error('Audio play error:', e);
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// ==================== 遠程存儲管理器 ====================
class StorageManager {
    constructor(prefix = 'game_') {
        this.prefix = prefix;
    }
    
    // 保存高分
    saveHighScore(gameName, score) {
        const key = `${this.prefix}${gameName}_highscore`;
        try {
            localStorage.setItem(key, score.toString());
            return true;
        } catch(e) {
            console.warn('Failed to save high score:', e);
            return false;
        }
    }
    
    // 獲取高分
    getHighScore(gameName, defaultValue = 0) {
        const key = `${this.prefix}${gameName}_highscore`;
        try {
            const value = localStorage.getItem(key);
            return value ? parseInt(value) : defaultValue;
        } catch(e) {
            return defaultValue;
        }
    }
    
    // 保存遊戲數據
    saveGameData(gameName, data) {
        const key = `${this.prefix}${gameName}_data`;
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch(e) {
            console.warn('Failed to save game data:', e);
            return false;
        }
    }
    
    // 獲取遊戲數據
    getGameData(gameName, defaultValue = null) {
        const key = `${this.prefix}${gameName}_data`;
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch(e) {
            return defaultValue;
        }
    }
    
    // 清理遊戲數據
    clearGameData(gameName) {
        const key = `${this.prefix}${gameName}_data`;
        try {
            localStorage.removeItem(key);
            return true;
        } catch(e) {
            return false;
        }
    }
    
    // 通用獲取
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch(e) {
            return defaultValue;
        }
    }
    
    // 通用保存
    set(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch(e) {
            console.warn('Failed to save data:', e);
            return false;
        }
    }
}

// ==================== 繪畫工具 ====================
class DrawingUtils {
    // 繪製圓形按鈕
    static drawButton(ctx, x, y, radius, text, color = '#667eea') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }
    
    // 繪製矩形按鈕
    static drawRect(ctx, x, y, width, height, text, color = '#667eea') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
    }
    
    // 繪製進度條
    static drawProgressBar(ctx, x, y, width, height, progress, color = '#667eea') {
        // 背景
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.fillRect(x, y, width, height);
        
        // 進度
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * progress, height);
        
        // 邊框
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }
    
    // 清除畫布
    static clearCanvas(ctx, width, height, color = '#1a1a2e') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    }
    
    // 繪製文本（帶背景）
    static drawText(ctx, text, x, y, fontSize = 16, color = '#fff', bgColor = null) {
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (bgColor) {
            const metrics = ctx.measureText(text);
            const padding = 10;
            ctx.fillStyle = bgColor;
            ctx.fillRect(
                x - metrics.width / 2 - padding,
                y - fontSize / 2 - padding,
                metrics.width + padding * 2,
                fontSize + padding * 2
            );
            ctx.fillStyle = color;
        }
        
        ctx.fillText(text, x, y);
    }
}

// ==================== 輸入處理器 ====================
class InputHandler {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.mousePosition = { x: 0, y: 0 };
        this.setupListeners();
    }
    
    setupListeners() {
        // 鍵盤
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 滑鼠
        document.addEventListener('mousemove', (e) => {
            this.mousePosition = { x: e.clientX, y: e.clientY };
        });
        
        // 觸控
        document.addEventListener('touchstart', (e) => {
            for (let touch of e.touches) {
                this.touches[touch.identifier] = {
                    x: touch.clientX,
                    y: touch.clientY
                };
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            for (let touch of e.touches) {
                this.touches[touch.identifier] = {
                    x: touch.clientX,
                    y: touch.clientY
                };
            }
        });
        
        document.addEventListener('touchend', (e) => {
            for (let touch of e.changedTouches) {
                delete this.touches[touch.identifier];
            }
        });
    }
    
    isKeyPressed(code) {
        return this.keys[code] || false;
    }
    
    isAnyKeyPressed(...codes) {
        return codes.some(code => this.keys[code]);
    }
    
    getMousePos() {
        return this.mousePosition;
    }
    
    getTouchPositions() {
        return Object.values(this.touches);
    }
    
    clearKeys() {
        this.keys = {};
    }
}

// ==================== 計時器 ====================
class GameTimer {
    constructor() {
        this.startTime = 0;
        this.pausedTime = 0;
        this.isRunning = false;
    }
    
    start() {
        this.startTime = Date.now() - this.pausedTime;
        this.isRunning = true;
    }
    
    pause() {
        this.pausedTime = Date.now() - this.startTime;
        this.isRunning = false;
    }
    
    resume() {
        this.startTime = Date.now() - this.pausedTime;
        this.isRunning = true;
    }
    
    reset() {
        this.startTime = 0;
        this.pausedTime = 0;
        this.isRunning = false;
    }
    
    getElapsedTime() {
        if (!this.isRunning) return this.pausedTime;
        return Date.now() - this.startTime;
    }
    
    getFormattedTime() {
        const ms = this.getElapsedTime();
        const seconds = Math.floor(ms / 1000);
        const milliseconds = ms % 1000;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
}

// ==================== 距離計算 ====================
class MathUtils {
    // 計算兩點之間的距離
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 檢查矩形碰撞
    static rectCollide(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    // 檢查圓形碰撞
    static circleCollide(x1, y1, r1, x2, y2, r2) {
        const dist = this.distance(x1, y1, x2, y2);
        return dist < r1 + r2;
    }
    
    // 隨機數
    static random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }
    
    // 隨機整數
    static randomInt(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // 限制數值範圍
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    // 線性插值
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
}

// ==================== 動畫幀管理 ====================
class AnimationFrame {
    constructor(fps = 60) {
        this.fps = fps;
        this.frameTime = 1000 / fps;
        this.lastTime = 0;
        this.callback = null;
    }
    
    start(callback) {
        this.callback = callback;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }
    
    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= this.frameTime) {
            this.callback(deltaTime);
            this.lastTime = currentTime - (deltaTime % this.frameTime);
        }
        
        requestAnimationFrame(this.loop.bind(this));
    }
}

// 全局管理器實例
const soundManager = new SoundManager();
const storageManager = new StorageManager();
const inputHandler = new InputHandler();
