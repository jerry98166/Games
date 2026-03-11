// ==================== 游戏配置 ====================
const CONFIG = {
    // 赛道配置
    roadWidth: 2000,
    segmentLength: 200,
    rumbleLength: 3,
    trackLength: 25,
    lanes: 3,
    
    // 摄像机配置
    cameraHeight: 1000,
    cameraDepth: 0.84,
    fieldOfView: 100,
    fogDensity: 5,
    
    // 玩家配置
    maxSpeed: 12000,
    acceleration: 120,
    deceleration: -120,
    braking: -400,
    offRoadDecel: -200,
    turnSpeed: 3,
    centrifugal: 0.3,
    
    // 赛车数量
    totalRacers: 8,
    
    // 圈数
    totalLaps: 3
};

// ==================== 角色和赛道数据 ====================
const CHARACTERS = {
    speed: {
        maxSpeed: 13000,
        acceleration: 100,
        handling: 2.5,
        emoji: '🏎️'
    },
    balanced: {
        maxSpeed: 12000,
        acceleration: 120,
        handling: 3,
        emoji: '🚗'
    },
    handling: {
        maxSpeed: 11000,
        acceleration: 140,
        handling: 3.8,
        emoji: '🏁'
    }
};

const TRACKS = {
    city: {
        name: '城市賽道',
        theme: 'city',
        difficulty: 2,
        curves: 'medium',
        hills: 'low'
    },
    desert: {
        name: '沙漠賽道',
        theme: 'desert',
        difficulty: 3,
        curves: 'high',
        hills: 'medium'
    },
    mountain: {
        name: '山地賽道',
        theme: 'mountain',
        difficulty: 4,
        curves: 'high',
        hills: 'high'
    }
};

// ==================== 道具系统 ====================
const ITEMS = {
    boost: { name: '加速', emoji: '🚀', duration: 2000 },
    star: { name: '無敵星星', emoji: '⭐', duration: 5000 },
    bomb: { name: '炸彈', emoji: '💣', duration: 0 },
    shield: { name: '護盾', emoji: '🛡️', duration: 8000 }
};

// ==================== 主游戏类 ====================
class RacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // 游戏状态
        this.gameState = 'menu'; // menu, countdown, racing, finished
        this.selectedCharacter = 'speed';
        this.selectedTrack = 'city';
        
        // 玩家数据
        this.playerPos = 0;
        this.playerX = 0;
        this.speed = 0;
        this.position = 1;
        this.currentLap = 1;
        this.currentItem = null;
        this.itemActive = false;
        this.itemEndTime = 0;
        
        // 计时
        this.raceStartTime = 0;
        this.raceTime = 0;
        this.lapStartTime = 0;
        this.bestLapTime = Infinity;
        this.lapTimes = [];
        
        // 统计
        this.maxSpeedReached = 0;
        this.itemsUsed = 0;
        
        // 赛道
        this.segments = [];
        this.cars = [];
        this.items = [];
        
        // 键盘输入
        this.keys = {};
        
        // AI赛车
        this.aiRacers = [];
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'p' || e.key === 'P') {
                if (this.gameState === 'racing') {
                    this.togglePause();
                }
            }
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'racing' && !this.isPaused) {
                    this.useItem();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // 角色选择
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.selectedCharacter = card.dataset.character;
            });
        });
        
        // 赛道选择
        document.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.track-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.selectedTrack = card.dataset.track;
            });
        });
        
        // 菜单按钮
        document.getElementById('startRaceBtn').addEventListener('click', () => {
            this.startRace();
        });
        
        document.getElementById('tutorialBtn').addEventListener('click', () => {
            document.getElementById('tutorialScreen').classList.remove('hidden');
        });
        
        document.getElementById('closeTutorialBtn').addEventListener('click', () => {
            document.getElementById('tutorialScreen').classList.add('hidden');
        });
        
        // 暂停菜单
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartRace();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.backToMenu();
        });
        
        // 结果界面
        document.getElementById('raceAgainBtn').addEventListener('click', () => {
            this.restartRace();
        });
        
        document.getElementById('backMenuBtn').addEventListener('click', () => {
            this.backToMenu();
        });
    }
    
    // ==================== 赛道生成 ====================
    buildTrack() {
        this.segments = [];
        
        const trackConfig = TRACKS[this.selectedTrack];
        const segmentCount = CONFIG.trackLength * 100;
        
        for (let i = 0; i < segmentCount; i++) {
            const segment = {
                index: i,
                p1: { world: { z: i * CONFIG.segmentLength }, camera: {}, screen: {} },
                p2: { world: { z: (i + 1) * CONFIG.segmentLength }, camera: {}, screen: {} },
                color: Math.floor(i / CONFIG.rumbleLength) % 2 ? 
                    { road: '#696969', grass: '#10AA10', rumble: '#FFFFFF' } :
                    { road: '#808080', grass: '#009A00', rumble: '#FF0000' },
                curve: 0,
                sprites: [],
                cars: []
            };
            
            // 添加弯道
            if (trackConfig.curves === 'high') {
                if (i > 200 && i < 300) segment.curve = 4;
                if (i > 500 && i < 600) segment.curve = -5;
                if (i > 800 && i < 900) segment.curve = 6;
                if (i > 1200 && i < 1300) segment.curve = -4;
            } else if (trackConfig.curves === 'medium') {
                if (i > 300 && i < 400) segment.curve = 3;
                if (i > 700 && i < 800) segment.curve = -3;
            }
            
            // 添加坡度
            if (trackConfig.hills === 'high') {
                if (i > 400 && i < 600) segment.p1.world.y = Math.sin(i / 30) * 1500;
                if (i > 1000 && i < 1200) segment.p1.world.y = Math.sin(i / 20) * 2000;
            } else if (trackConfig.hills === 'medium') {
                if (i > 500 && i < 700) segment.p1.world.y = Math.sin(i / 30) * 1000;
            } else {
                segment.p1.world.y = 0;
            }
            
            this.segments.push(segment);
        }
        
        // 添加道具方块
        for (let i = 0; i < 50; i++) {
            const segmentIndex = Math.floor(Math.random() * segmentCount);
            const x = (Math.random() - 0.5) * CONFIG.roadWidth * 0.8;
            this.segments[segmentIndex].sprites.push({
                type: 'item',
                x: x,
                emoji: '❓',
                collected: false
            });
        }
        
        // 添加装饰物
        for (let i = 0; i < segmentCount; i += 20) {
            if (Math.random() > 0.5) {
                const side = Math.random() > 0.5 ? 1 : -1;
                this.segments[i].sprites.push({
                    type: 'decoration',
                    x: side * CONFIG.roadWidth * 0.7,
                    emoji: ['🌳', '🌴', '🏘️', '🏢'][Math.floor(Math.random() * 4)]
                });
            }
        }
    }
    
    // ==================== AI赛车 ====================
    createAIRacers() {
        this.aiRacers = [];
        const aiEmojis = ['🚙', '🚕', '🚐', '🚓', '🚑', '🏎️', '🚗'];
        
        for (let i = 0; i < CONFIG.totalRacers - 1; i++) {
            this.aiRacers.push({
                position: (i + 2) * 500,
                x: (Math.random() - 0.5) * CONFIG.roadWidth * 0.5,
                speed: CONFIG.maxSpeed * (0.7 + Math.random() * 0.2),
                emoji: aiEmojis[i % aiEmojis.length],
                targetX: 0,
                bestTime: Infinity
            });
        }
    }
    
    updateAIRacers(dt) {
        this.aiRacers.forEach(ai => {
            // AI移动
            ai.position += ai.speed * dt;
            
            // 简单的AI转向逻辑
            const segment = this.segments[Math.floor(ai.position / CONFIG.segmentLength) % this.segments.length];
            ai.targetX = -segment.curve * 50;
            
            const dx = ai.targetX - ai.x;
            ai.x += dx * 0.1;
            
            // 限制在赛道内
            ai.x = Math.max(-CONFIG.roadWidth * 0.4, Math.min(CONFIG.roadWidth * 0.4, ai.x));
            
            // 完成圈数检查
            if (ai.position > this.segments.length * CONFIG.segmentLength) {
                ai.position -= this.segments.length * CONFIG.segmentLength;
            }
        });
    }
    
    // ==================== 游戏循环 ====================
    startRace() {
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        
        this.gameState = 'countdown';
        this.buildTrack();
        this.createAIRacers();
        this.resetPlayer();
        this.startCountdown();
    }
    
    resetPlayer() {
        this.playerPos = 0;
        this.playerX = 0;
        this.speed = 0;
        this.currentLap = 1;
        this.position = 1;
        this.currentItem = null;
        this.itemActive = false;
        this.maxSpeedReached = 0;
        this.itemsUsed = 0;
        this.lapTimes = [];
        this.bestLapTime = Infinity;
    }
    
    startCountdown() {
        let count = 3;
        const countdownEl = document.getElementById('countdown');
        countdownEl.style.display = 'block';
        countdownEl.textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
                countdownEl.style.animation = 'none';
                setTimeout(() => countdownEl.style.animation = 'countdownPulse 1s ease', 10);
            } else if (count === 0) {
                countdownEl.textContent = 'GO!';
                countdownEl.style.color = '#2ed573';
                countdownEl.style.animation = 'none';
                setTimeout(() => countdownEl.style.animation = 'countdownPulse 1s ease', 10);
            } else {
                countdownEl.style.display = 'none';
                this.gameState = 'racing';
                this.raceStartTime = Date.now();
                this.lapStartTime = Date.now();
                this.gameLoop();
            }
        }, 1000);
    }
    
    gameLoop() {
        if (this.gameState !== 'racing' || this.isPaused) return;
        
        const now = Date.now();
        const dt = Math.min(1 / 60, (now - (this.lastTime || now)) / 1000);
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        this.updateHUD();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(dt) {
        // 更新计时
        this.raceTime = Date.now() - this.raceStartTime;
        
        const character = CHARACTERS[this.selectedCharacter];
        
        // 处理输入
        if (this.keys['ArrowUp']) {
            this.speed = Math.min(this.speed + character.acceleration * dt, character.maxSpeed);
        } else if (this.keys['ArrowDown']) {
            this.speed = Math.max(this.speed + CONFIG.braking * dt, -character.maxSpeed / 2);
        } else {
            this.speed = Math.max(0, this.speed + CONFIG.deceleration * dt);
        }
        
        // 转向
        if (this.keys['ArrowLeft']) {
            this.playerX -= character.handling * dt * 1000;
        }
        if (this.keys['ArrowRight']) {
            this.playerX += character.handling * dt * 1000;
        }
        
        // 更新位置
        this.playerPos += this.speed * dt;
        
        // 获取当前路段
        const playerSegment = this.segments[Math.floor(this.playerPos / CONFIG.segmentLength) % this.segments.length];
        
        // 应用弯道效果
        this.playerX -= playerSegment.curve * this.speed * dt * CONFIG.centrifugal;
        
        // 限制在赛道内
        const roadEdge = CONFIG.roadWidth * 0.45;
        if (Math.abs(this.playerX) > roadEdge) {
            this.playerX = Math.sign(this.playerX) * roadEdge;
            this.speed *= 0.95; // 撞墙减速
        }
        
        // 道具效果
        if (this.itemActive) {
            if (Date.now() > this.itemEndTime) {
                this.itemActive = false;
                this.currentItem = null;
                document.getElementById('itemDisplay').innerHTML = '<div class="no-item">按空格使用</div>';
            }
        }
        
        // 检查道具拾取
        if (playerSegment.sprites) {
            playerSegment.sprites.forEach(sprite => {
                if (sprite.type === 'item' && !sprite.collected) {
                    const distance = Math.abs(sprite.x - this.playerX);
                    if (distance < 300) {
                        sprite.collected = true;
                        this.collectItem();
                    }
                }
            });
        }
        
        // 更新统计
        const speedKmh = Math.floor((this.speed / CONFIG.maxSpeed) * 300);
        this.maxSpeedReached = Math.max(this.maxSpeedReached, speedKmh);
        
        // 完成圈数检查
        if (this.playerPos > this.segments.length * CONFIG.segmentLength) {
            this.completeLap();
        }
        
        // 更新AI
        this.updateAIRacers(dt);
        
        // 计算排名
        this.calculatePosition();
    }
    
    calculatePosition() {
        let ahead = 0;
        this.aiRacers.forEach(ai => {
            const aiLap = Math.floor(ai.position / (this.segments.length * CONFIG.segmentLength)) + 1;
            const playerLap = this.currentLap;
            const aiProgress = ai.position % (this.segments.length * CONFIG.segmentLength);
            const playerProgress = this.playerPos % (this.segments.length * CONFIG.segmentLength);
            
            if (aiLap > playerLap || (aiLap === playerLap && aiProgress > playerProgress)) {
                ahead++;
            }
        });
        this.position = ahead + 1;
    }
    
    completeLap() {
        const lapTime = Date.now() - this.lapStartTime;
        this.lapTimes.push(lapTime);
        this.bestLapTime = Math.min(this.bestLapTime, lapTime);
        
        this.currentLap++;
        this.playerPos -= this.segments.length * CONFIG.segmentLength;
        this.lapStartTime = Date.now();
        
        if (this.currentLap > CONFIG.totalLaps) {
            this.finishRace();
        }
    }
    
    collectItem() {
        const itemTypes = Object.keys(ITEMS);
        const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        this.currentItem = randomItem;
        
        const itemEl = document.getElementById('itemDisplay');
        itemEl.innerHTML = `<div class="item-icon">${ITEMS[randomItem].emoji}</div>`;
    }
    
    useItem() {
        if (!this.currentItem || this.itemActive) return;
        
        this.itemsUsed++;
        const item = ITEMS[this.currentItem];
        
        switch(this.currentItem) {
            case 'boost':
                this.speed = Math.min(this.speed * 1.5, CONFIG.maxSpeed * 1.3);
                break;
            case 'star':
                // 无敌效果
                break;
            case 'bomb':
                // 炸弹效果（减慢前方的AI）
                this.aiRacers.forEach(ai => {
                    if (ai.position > this.playerPos && ai.position < this.playerPos + 1000) {
                        ai.speed *= 0.5;
                        setTimeout(() => ai.speed *= 2, 2000);
                    }
                });
                break;
            case 'shield':
                // 护盾效果
                break;
        }
        
        if (item.duration > 0) {
            this.itemActive = true;
            this.itemEndTime = Date.now() + item.duration;
        } else {
            this.currentItem = null;
            document.getElementById('itemDisplay').innerHTML = '<div class="no-item">按空格使用</div>';
        }
    }
    
    // ==================== 渲染 ====================
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 清空画布
        this.ctx.fillStyle = '#72D8FF';
        this.ctx.fillRect(0, 0, width, height);
        
        // 绘制地平线
        const horizon = height / 2;
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, horizon, width, height - horizon);
        
        // 绘制赛道
        const baseSegment = Math.floor(this.playerPos / CONFIG.segmentLength);
        
        for (let n = 0; n < 300; n++) {
            const segment = this.segments[(baseSegment + n) % this.segments.length];
            
            segment.p1.camera.z = (segment.p1.world.z - this.playerPos);
            segment.p2.camera.z = (segment.p2.world.z - this.playerPos);
            segment.p1.camera.y = segment.p1.world.y - CONFIG.cameraHeight;
            segment.p2.camera.y = segment.p2.world.y - CONFIG.cameraHeight;
            
            if (segment.p1.camera.z <= CONFIG.cameraDepth) continue;
            
            segment.p1.screen.scale = CONFIG.cameraDepth / segment.p1.camera.z;
            segment.p2.screen.scale = CONFIG.cameraDepth / segment.p2.camera.z;
            
            segment.p1.screen.x = Math.round(width / 2 + (segment.p1.screen.scale * segment.p1.camera.x * width / 2));
            segment.p1.screen.y = Math.round(height / 2 - (segment.p1.screen.scale * segment.p1.camera.y * height / 2));
            segment.p1.screen.w = Math.round(segment.p1.screen.scale * CONFIG.roadWidth * width / 2);
            
            segment.p2.screen.x = Math.round(width / 2 + (segment.p2.screen.scale * segment.p2.camera.x * width / 2));
            segment.p2.screen.y = Math.round(height / 2 - (segment.p2.screen.scale * segment.p2.camera.y * height / 2));
            segment.p2.screen.w = Math.round(segment.p2.screen.scale * CONFIG.roadWidth * width / 2);
            
            if (segment.p1.camera.z <= CONFIG.cameraDepth || segment.p2.screen.y >= height) continue;
            
            this.drawSegment(segment);
        }
        
        // 绘制AI赛车
        this.drawAICars();
        
        // 绘制玩家赛车
        this.drawPlayerCar();
        
        // 绘制小地图
        this.drawMinimap();
    }
    
    drawSegment(segment) {
        const { p1, p2, color } = segment;
        
        // 草地
        this.ctx.fillStyle = color.grass;
        this.ctx.fillRect(0, p2.screen.y, this.canvas.width, p1.screen.y - p2.screen.y);
        
        // 路肩
        this.drawTrapezoid(
            p1.screen.x, p1.screen.y, p1.screen.w * 1.2,
            p2.screen.x, p2.screen.y, p2.screen.w * 1.2,
            color.rumble
        );
        
        // 道路
        this.drawTrapezoid(
            p1.screen.x, p1.screen.y, p1.screen.w,
            p2.screen.x, p2.screen.y, p2.screen.w,
            color.road
        );
        
        // 绘制精灵（道具和装饰物）
        if (segment.sprites) {
            segment.sprites.forEach(sprite => {
                if (sprite.collected) return;
                
                const spriteScale = p1.screen.scale;
                const spriteX = p1.screen.x + (spriteScale * sprite.x * this.canvas.width / 2);
                const spriteY = p1.screen.y;
                
                this.ctx.font = `${40 * spriteScale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(sprite.emoji, spriteX, spriteY);
            });
        }
    }
    
    drawTrapezoid(x1, y1, w1, x2, y2, w2, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 - w1, y1);
        this.ctx.lineTo(x1 + w1, y1);
        this.ctx.lineTo(x2 + w2, y2);
        this.ctx.lineTo(x2 - w2, y2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawPlayerCar() {
        const character = CHARACTERS[this.selectedCharacter];
        const scale = 0.3;
        const carX = this.canvas.width / 2;
        const carY = this.canvas.height * 0.75;
        
        this.ctx.font = `${100 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.emoji, carX, carY);
    }
    
    drawAICars() {
        this.aiRacers.forEach(ai => {
            const relativeZ = ai.position - this.playerPos;
            if (relativeZ < 0 || relativeZ > 5000) return;
            
            const segmentIndex = Math.floor(ai.position / CONFIG.segmentLength) % this.segments.length;
            const segment = this.segments[segmentIndex];
            
            if (!segment.p1.screen.scale) return;
            
            const scale = segment.p1.screen.scale;
            const screenX = this.canvas.width / 2 + (scale * ai.x * this.canvas.width / 2);
            const screenY = segment.p1.screen.y;
            
            this.ctx.font = `${60 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ai.emoji, screenX, screenY);
        });
    }
    
    drawMinimap() {
        const ctx = this.minimapCtx;
        const size = 150;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);
        
        // 绘制赛道轮廓
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(size * 0.2, size * 0.2, size * 0.6, size * 0.6);
        
        // 玩家位置
        const playerProgress = (this.playerPos % (this.segments.length * CONFIG.segmentLength)) / 
                              (this.segments.length * CONFIG.segmentLength);
        const playerY = size * 0.2 + playerProgress * size * 0.6;
        
        ctx.fillStyle = '#ffa502';
        ctx.beginPath();
        ctx.arc(size / 2, playerY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // AI位置
        this.aiRacers.forEach(ai => {
            const aiProgress = (ai.position % (this.segments.length * CONFIG.segmentLength)) / 
                              (this.segments.length * CONFIG.segmentLength);
            const aiY = size * 0.2 + aiProgress * size * 0.6;
            
            ctx.fillStyle = '#4facfe';
            ctx.beginPath();
            ctx.arc(size / 2, aiY, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // ==================== HUD更新 ====================
    updateHUD() {
        // 速度表
        const speedKmh = Math.floor((this.speed / CONFIG.maxSpeed) * 300);
        document.getElementById('speedometer').textContent = speedKmh;
        
        // 圈数
        document.getElementById('currentLap').textContent = Math.min(this.currentLap, CONFIG.totalLaps);
        
        // 排名
        document.getElementById('position').textContent = this.position;
        
        // 计时器
        const minutes = Math.floor(this.raceTime / 60000);
        const seconds = Math.floor((this.raceTime % 60000) / 1000);
        const milliseconds = this.raceTime % 1000;
        document.getElementById('raceTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        
        // 排名列表
        this.updateRankings();
    }
    
    updateRankings() {
        const rankingsList = document.getElementById('rankingsList');
        const allRacers = [
            { name: '你', position: this.playerPos, isPlayer: true },
            ...this.aiRacers.map((ai, i) => ({ name: `AI ${i + 1}`, position: ai.position, isPlayer: false }))
        ];
        
        allRacers.sort((a, b) => b.position - a.position);
        
        rankingsList.innerHTML = allRacers.slice(0, 8).map((racer, index) => `
            <div class="ranking-item ${racer.isPlayer ? 'player' : ''}">
                <span class="rank">${index + 1}</span>
                <span class="name">${racer.name}</span>
            </div>
        `).join('');
    }
    
    // ==================== 游戏控制 ====================
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseMenu = document.getElementById('pauseMenu');
        
        if (this.isPaused) {
            pauseMenu.classList.remove('hidden');
        } else {
            pauseMenu.classList.add('hidden');
            this.lastTime = Date.now();
            this.gameLoop();
        }
    }
    
    restartRace() {
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('resultScreen').classList.add('hidden');
        this.isPaused = false;
        this.startRace();
    }
    
    backToMenu() {
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('resultScreen').classList.add('hidden');
        document.getElementById('menuScreen').classList.remove('hidden');
        this.gameState = 'menu';
        this.isPaused = false;
    }
    
    finishRace() {
        this.gameState = 'finished';
        
        // 显示结果
        document.getElementById('resultScreen').classList.remove('hidden');
        document.getElementById('finalPosition').textContent = this.position;
        document.getElementById('finalTime').textContent = this.formatTime(this.raceTime);
        document.getElementById('maxSpeed').textContent = this.maxSpeedReached;
        document.getElementById('itemsUsed').textContent = this.itemsUsed;
        document.getElementById('bestLap').textContent = this.formatTime(this.bestLapTime);
        
        // 设置奖杯
        const trophy = document.getElementById('trophyAnimation');
        const title = document.getElementById('resultTitle');
        
        if (this.position === 1) {
            trophy.textContent = '🏆';
            title.textContent = '勝利!';
            title.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
        } else if (this.position === 2) {
            trophy.textContent = '🥈';
            title.textContent = '第二名!';
            title.style.background = 'linear-gradient(135deg, #C0C0C0, #808080)';
        } else if (this.position === 3) {
            trophy.textContent = '🥉';
            title.textContent = '第三名!';
            title.style.background = 'linear-gradient(135deg, #CD7F32, #8B4513)';
        } else {
            trophy.textContent = '🏁';
            title.textContent = '完成比賽!';
            title.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        title.style.webkitBackgroundClip = 'text';
        title.style.webkitTextFillColor = 'transparent';
        title.style.backgroundClip = 'text';
    }
    
    formatTime(ms) {
        if (ms === Infinity) return '--:--.---';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
}

// ==================== 启动游戏 ====================
window.addEventListener('DOMContentLoaded', () => {
    const game = new RacingGame();
});
