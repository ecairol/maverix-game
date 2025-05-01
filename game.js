class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isRunning = false;
        this.groundY = this.canvas.height - 50;
        
        // Game state
        this.biker = {
            x: 50,
            y: this.groundY,
            width: 50,
            height: 50,
            jumping: false,
            velocity: 0
        };

        // Obstacles array
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 1500; // Time between obstacles in milliseconds

        // Add game over state
        this.gameOver = false;
        
        // Add random obstacle properties
        this.minObstacleInterval = 1000; // Minimum time between obstacles
        this.maxObstacleInterval = 2500; // Maximum time between obstacles
        this.obstacleInterval = this.getRandomInterval();

        // Add game state enum
        this.gameState = {
            CHARACTER_SELECT: 'characterSelect',
            PLAYING: 'playing',
            GAME_OVER: 'gameOver'
        };
        this.currentState = this.gameState.CHARACTER_SELECT;

        // Add selected character index
        this.selectedCharacterIndex = 0;

        // Add key state tracking
        this.keys = {
            space: {
                pressed: false,
                lastPressed: 0
            },
            arrow: {
                pressed: false,
                lastPressed: 0
            }
        };

        // Add image loading for all characters with speed attributes
        this.bikerImages = {};
        this.characters = [
            { name: 'Tomi', image: 'biker1-tomi.png', speed: 7 },    // Base speed
            { name: 'Pipe', image: 'biker2-pipe.png', speed: 7 },    // Faster
            { name: 'Fio', image: 'biker3-fio.png', speed: 7 },      // Slower
            { name: 'Ema', image: 'biker4-ema.png', speed: 7 },    // Slightly faster
            { name: 'Gigi', image: 'biker5-gigi.png', speed: 7 },  // Slightly slower
            { name: 'Lola', image: 'biker6-lola.png', speed: 12 }   // Slightly faster
        ];

        // Load all character images
        this.characters.forEach(character => {
            const img = new Image();
            img.src = `assets/${character.image}`;
            this.bikerImages[character.name] = img;
        });

        this.selectedCharacter = null;

        // Add button properties
        this.button = {
            x: 5,
            y: 5,
            width: 50,
            height: 50,
            text: '⟲',
            hover: false,
            tooltip: 'P: Cambiar Personaje'
        };

        // Bind event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Start the game loop
        this.start();
    }

    // Add new method for random intervals
    getRandomInterval() {
        return Math.random() * (this.maxObstacleInterval - this.minObstacleInterval) + this.minObstacleInterval;
    }

    // Add collision detection method
    checkCollision(biker, obstacle) {
        return !(
            biker.x + biker.width < obstacle.x ||
            biker.x > obstacle.x + obstacle.width ||
            biker.y + biker.height < obstacle.y - obstacle.height ||
            biker.y > obstacle.y
        );
    }

    // Add reset method
    reset() {
        this.score = 0;
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = this.getRandomInterval();
        document.getElementById('score').textContent = '0';
        
        // Reset biker position
        this.biker.y = this.groundY;
        this.biker.jumping = false;
        this.biker.velocity = 0;
        
        // Reset to character select after game over
        if (this.currentState === this.gameState.GAME_OVER) {
            this.currentState = this.gameState.CHARACTER_SELECT;
        }
    }

    handleKeyDown(event) {
        if (this.currentState === this.gameState.CHARACTER_SELECT) {
            switch(event.code) {
                case 'ArrowRight':
                    this.selectedCharacterIndex = (this.selectedCharacterIndex + 1) % this.characters.length;
                    break;
                case 'ArrowLeft':
                    this.selectedCharacterIndex = (this.selectedCharacterIndex - 1 + this.characters.length) % this.characters.length;
                    break;
                case 'ArrowUp':
                    this.selectedCharacterIndex = (this.selectedCharacterIndex - 3 + this.characters.length) % this.characters.length;
                    break;
                case 'ArrowDown':
                    this.selectedCharacterIndex = (this.selectedCharacterIndex + 3) % this.characters.length;
                    break;
                case 'Space':
                case 'Enter':
                    this.selectedCharacter = this.characters[this.selectedCharacterIndex];
                    this.currentState = this.gameState.PLAYING;
                    this.reset();
                    break;
            }
        } else if (event.code === 'Space') {
            const now = Date.now();
            
            // Only trigger if the key wasn't pressed in the last 500ms
            if (now - this.keys.space.lastPressed > 500) {
                if (this.currentState === this.gameState.GAME_OVER) {
                    this.reset();
                    this.currentState = this.gameState.PLAYING;
                } else if (!this.biker.jumping) {
                    this.biker.jumping = true;
                    this.biker.velocity = -15;
                }
                this.keys.space.lastPressed = now;
            }
            this.keys.space.pressed = true;
        } else if (event.code === 'KeyP') {
            this.currentState = this.gameState.CHARACTER_SELECT;
            this.reset();
        }
    }

    // Add key up handler
    handleKeyUp(event) {
        if (event.code === 'Space') {
            this.keys.space.pressed = false;
        }
    }

    handleCanvasClick(event) {
        if (this.currentState === this.gameState.CHARACTER_SELECT) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Calculate which character was clicked
            const characterWidth = 80;
            const characterHeight = 80;
            const padding = 20;
            const startX = (this.canvas.width - (characterWidth * 3 + padding * 2)) / 2;
            const startY = (this.canvas.height - (characterHeight * 2 + padding)) / 2;

            for (let i = 0; i < this.characters.length; i++) {
                const row = Math.floor(i / 3);
                const col = i % 3;
                const charX = startX + col * (characterWidth + padding);
                const charY = startY + row * (characterHeight + padding);

                if (x >= charX && x <= charX + characterWidth &&
                    y >= charY && y <= charY + characterHeight) {
                    this.selectedCharacter = this.characters[i];
                    this.currentState = this.gameState.PLAYING;
                    this.reset();
                    break;
                }
            }
        } else if (this.currentState === this.gameState.PLAYING || this.currentState === this.gameState.GAME_OVER) {
            // Check if button was clicked (now works in both PLAYING and GAME_OVER states)
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (x >= this.button.x && x <= this.button.x + this.button.width &&
                y >= this.button.y && y <= this.button.y + this.button.height) {
                this.currentState = this.gameState.CHARACTER_SELECT;
                this.reset();
            }
        }
    }

    // Add mouse move handler for button hover effect
    handleMouseMove(event) {
        if (this.currentState === this.gameState.PLAYING || this.currentState === this.gameState.GAME_OVER) {
            // Update hover state for both PLAYING and GAME_OVER states
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.button.hover = (
                x >= this.button.x && x <= this.button.x + this.button.width &&
                y >= this.button.y && y <= this.button.y + this.button.height
            );
        }
    }

    createObstacle() {
        const obstacle = {
            x: this.canvas.width,
            y: this.groundY,
            width: 12,
            height: 20 + Math.random() * 25, // Random height between 40 and 60
            passed: false
        };
        this.obstacles.push(obstacle);
        // Set new random interval for next obstacle
        this.obstacleInterval = this.getRandomInterval();
    }

    update() {
        if (this.currentState === this.gameState.GAME_OVER) return;

        // Update biker position
        if (this.biker.jumping) {
            this.biker.y += this.biker.velocity;
            this.biker.velocity += 0.8;

            if (this.biker.y >= this.groundY) {
                this.biker.y = this.groundY;
                this.biker.jumping = false;
                this.biker.velocity = 0;
            }
        }

        // Update obstacles
        this.obstacleTimer += 16;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
        }

        // Move obstacles and check for collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            // Use the selected character's speed for obstacle movement, or default to 5 if no character selected
            const speed = this.selectedCharacter ? this.selectedCharacter.speed : 5;
            obstacle.x -= speed;

            // Check for collision
            if (this.checkCollision(this.biker, obstacle)) {
                this.currentState = this.gameState.GAME_OVER;
                return;
            }

            // Check if obstacle is passed
            if (!obstacle.passed && obstacle.x + obstacle.width < this.biker.x) {
                obstacle.passed = true;
                this.score += 1;
                document.getElementById('score').textContent = this.score;
            }

            // Remove obstacles that are off screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentState === this.gameState.CHARACTER_SELECT) {
            this.drawCharacterSelect();
        } else {
            // Draw ground
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.groundY + 30);
            this.ctx.lineTo(this.canvas.width, this.groundY + 30);
            this.ctx.stroke();

            // Draw biker using selected character's image
            this.ctx.drawImage(
                this.bikerImages[this.selectedCharacter.name],
                this.biker.x,
                this.biker.y,
                this.biker.width,
                this.biker.height
            );

            // Draw obstacles
            this.ctx.fillStyle = '#666';
            this.obstacles.forEach(obstacle => {
                this.ctx.fillRect(
                    obstacle.x,
                    obstacle.y - obstacle.height,
                    obstacle.width,
                    obstacle.height
                );
            });

            // Draw change character button
            this.drawButton();

            // Draw game over message
            if (this.currentState === this.gameState.GAME_OVER) {
                this.drawGameOver();
            }
        }
    }

    drawCharacterSelect() {
        // Draw title
        this.ctx.fillStyle = '#000';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Select Your Character', this.canvas.width / 2, 50);

        // Draw character options
        const characterWidth = 80;
        const characterHeight = 80;
        const padding = 20;
        const startX = (this.canvas.width - (characterWidth * 3 + padding * 2)) / 2;
        const startY = (this.canvas.height - (characterHeight * 2 + padding)) / 2;

        this.characters.forEach((character, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = startX + col * (characterWidth + padding);
            const y = startY + row * (characterHeight + padding);

            // Draw character image
            this.ctx.drawImage(
                this.bikerImages[character.name],
                x,
                y,
                characterWidth,
                characterHeight
            );

            // Draw selection border if this is the selected character
            if (i === this.selectedCharacterIndex) {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - 2, y - 2, characterWidth + 4, characterHeight + 4);
            }

            // Draw character name
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(character.name, x + characterWidth / 2, y + characterHeight + 20);
        });

        // Draw instructions
        this.ctx.fillStyle = '#000';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('Use las teclas para mover, Enter para seleccionar', this.canvas.width / 2, this.canvas.height - 30);
    }

    drawButton() {
        // Draw button background
        this.ctx.fillStyle = this.button.hover ? '#e0e0e0' : '#f0f0f0';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(this.button.x, this.button.y, this.button.width, this.button.height);
        this.ctx.strokeRect(this.button.x, this.button.y, this.button.width, this.button.height);

        // Draw button text
        this.ctx.fillStyle = '#000';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.button.text,
            this.button.x + this.button.width / 2,
            this.button.y + this.button.height / 2
        );

        // Draw tooltip when hovering
        if (this.button.hover) {
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#000';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                this.button.tooltip,
                this.button.x + this.button.width + 10,
                this.button.y + this.button.height / 2
            );
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        
        // Draw main game over text
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // Draw restart instruction
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Presione Espacio para jugar otra vez', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Draw final score
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Puntaje: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    gameLoop() {
        if (this.isRunning) {
            this.update();
            this.draw();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 