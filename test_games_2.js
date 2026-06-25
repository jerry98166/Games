const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const games = [
    '2048', 'breakout', 'flappy', 'hangman', 'memory', 
    'minesweeper', 'pong', 'racing', 'simon', 'snake', 'tetris'
];

async function testGames() {
    for (const game of games) {
        const htmlPath = `games/${game}.html`;
        try {
            const html = fs.readFileSync(htmlPath, 'utf8');
            
            const virtualConsole = new VirtualConsole();
            virtualConsole.on("jsdomError", (error) => {
                if (error.message.includes('getContext') || error.message.includes('alert')) return;
                console.log(`${game} JSDOM Error:`, error.message);
            });
            virtualConsole.on("error", (error) => {
                if (error && error.message && (error.message.includes('getContext') || error.message.includes('alert'))) return;
                console.log(`${game} Console Error:`, error);
            });

            const dom = new JSDOM(html, {
                runScripts: "dangerously",
                resources: "usable",
                url: `file://${process.cwd()}/${htmlPath}`,
                virtualConsole
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (dom.window.errors && dom.window.errors.length > 0) {
                const realErrors = dom.window.errors.filter(e => !e.message.includes('getContext') && !e.message.includes('alert'));
                if (realErrors.length > 0) {
                    console.log(`${game} WINDOW ERRORS:`, realErrors);
                }
            }
        } catch (e) {
            console.log(`Error running ${game}:`, e.message);
        }
    }
}

testGames();
