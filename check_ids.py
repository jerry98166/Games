import os
import re

games = {
    '2048': ('games/2048.html', 'js/game2048.js'),
    'breakout': ('games/breakout.html', 'js/breakout.js'),
    'flappy': ('games/flappy.html', 'js/flappy.js'),
    'hangman': ('games/hangman.html', 'js/hangman.js'),
    'memory': ('games/memory.html', 'js/memory.js'),
    'minesweeper': ('games/minesweeper.html', 'js/minesweeper.js'),
    'pong': ('games/pong.html', 'js/pong.js'),
    'racing': ('games/racing.html', 'js/racing.js'),
    'simon': ('games/simon.html', 'js/simon.js'),
    'snake': ('games/snake.html', 'js/snake.js'),
    'tetris': ('games/tetris.html', 'js/game.js')
}

for game, (html_file, js_file) in games.items():
    with open(js_file, 'r') as f:
        js_content = f.read()
    with open(html_file, 'r') as f:
        html_content = f.read()
    
    # Find all getElementById calls
    ids = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js_content))
    
    missing_ids = []
    for element_id in ids:
        # Check if id="element_id" exists in html
        if f'id="{element_id}"' not in html_content and f"id='{element_id}'" not in html_content:
            missing_ids.append(element_id)
            
    if missing_ids:
        print(f"{game}: Missing IDs in HTML -> {', '.join(missing_ids)}")

