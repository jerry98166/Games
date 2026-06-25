const fs = require('fs');
const { JSDOM } = require('jsdom');

const games = [
    '2048', 'breakout', 'flappy', 'hangman', 'memory', 
    'minesweeper', 'pong', 'racing', 'simon', 'snake', 'tetris'
];

async function testGames() {
    for (const game of games) {
        const htmlPath = `games/${game}.html`;
        try {
            const html = fs.readFileSync(htmlPath, 'utf8');
            const dom = new JSDOM(html, {
                runScripts: "dangerously",
                resources: "usable",
                url: `file://${process.cwd()}/${htmlPath}`
            });
            
            // Wait a bit for scripts to execute
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (dom.window.errors && dom.window.errors.length > 0) {
                console.log(`${game} ERRORS:`, dom.window.errors);
            }
        } catch (e) {
            console.log(`Error running ${game}:`, e.message);
        }
    }
}

testGames();
