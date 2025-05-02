class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isRunning = false;
        this.groundY = this.canvas.height - 50;
        
        // Get the actual display size of the canvas
        this.displayRatio = this.canvas.getBoundingClientRect().width / this.canvas.width;
        
        // Debug info
        this.frameCount = 0;
        this.lastDebugTime = performance.now();
        this.debugInterval = 1000; // Log every second
        
        // Fixed time step variables
        this.fixedTimeStep = 1000 / 60; // 60 updates per second
        this.accumulator = 0;
        this.lastTime = 0;
        this.updateCount = 0;  // Track number of updates
        
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
            { name: 'Tomi', image: 'biker1-tomi.png', speed: 9 },    // Base speed
            { name: 'Pipe', image: 'biker2-pipe.png', speed: 9 },    // Faster
            { name: 'Fio', image: 'biker3-fio.png', speed: 9 },      // Slower
            { name: 'Ema', image: 'biker4-ema.png', speed: 9 },    // Slightly faster
            { name: 'Gigi', image: 'biker5-gigi.png', speed: 9 },  // Slightly slower
            { name: 'Lola', image: 'biker6-lola.png', speed: 16 }   // Slightly faster
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
        
        // Add resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
        
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
            // Check if button was clicked first
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (x >= this.button.x && x <= this.button.x + this.button.width &&
                y >= this.button.y && y <= this.button.y + this.button.height) {
                this.currentState = this.gameState.CHARACTER_SELECT;
                this.reset();
            } else if (this.currentState === this.gameState.PLAYING && !this.biker.jumping) {
                // If in playing state, not clicking the button, and not already jumping, make the biker jump
                this.biker.jumping = true;
                this.biker.velocity = -15;
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

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        // Debug logging
        this.frameCount++;
        if (currentTime - this.lastDebugTime >= this.debugInterval) {
            const fps = this.frameCount;
            const rect = this.canvas.getBoundingClientRect();
            console.log('Debug Info:', {
                fps,
                updatesPerSecond: this.updateCount,
                canvasInternalWidth: this.canvas.width,
                canvasDisplayWidth: rect.width,
                displayRatio: this.displayRatio,
                currentSpeed: this.selectedCharacter ? this.selectedCharacter.speed * this.displayRatio : 0,
                devicePixelRatio: window.devicePixelRatio,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            });
            this.frameCount = 0;
            this.updateCount = 0;
            this.lastDebugTime = currentTime;
        }

        // Calculate delta time
        if (!this.lastTime) this.lastTime = currentTime;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Accumulate time
        this.accumulator += deltaTime;

        // Update game state at fixed intervals
        let updatesThisFrame = 0;
        while (this.accumulator >= this.fixedTimeStep && updatesThisFrame < 2) {
            this.update();
            this.accumulator -= this.fixedTimeStep;
            this.updateCount++;
            updatesThisFrame++;
        }

        // Always draw
        this.draw();

        // Continue the loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        // Only update if we're in PLAYING state AND have a selected character
        if (this.currentState !== this.gameState.PLAYING || !this.selectedCharacter) return;
        if (this.currentState === this.gameState.GAME_OVER) return;

        const song = document.getElementById('song');
        song.volume = 0.2;
        song.play();

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
        this.obstacleTimer += this.fixedTimeStep;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = this.getRandomInterval();
        }

        // Move obstacles and check for collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            // Scale the speed based on the display ratio and ensure consistent speed
            obstacle.x -= (this.selectedCharacter.speed * this.displayRatio);

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
        } else if (this.selectedCharacter) {  // Only draw game elements if we have a selected character
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
        this.ctx.fillText('Seleccione un jugador:', this.canvas.width / 2, 50);

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
        this.ctx.fillText('ESPACIO PARA SALTAR', this.canvas.width / 2, this.canvas.height - 15);
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

    start() {
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Add window resize handler
    handleResize() {
        this.displayRatio = this.canvas.getBoundingClientRect().width / this.canvas.width;
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 