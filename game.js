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
            PLAYING: 'playing',
            GAME_OVER: 'gameOver'
        };
        this.currentState = this.gameState.PLAYING;

        // Add key state tracking
        this.keys = {
            space: {
                pressed: false,
                lastPressed: 0
            }
        };

        // Bind event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
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
    }

    handleKeyDown(event) {
        if (event.code === 'Space') {
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
        }
    }

    // Add key up handler
    handleKeyUp(event) {
        if (event.code === 'Space') {
            this.keys.space.pressed = false;
        }
    }

    createObstacle() {
        const obstacle = {
            x: this.canvas.width,
            y: this.groundY,
            width: 25,
            height: 20 + Math.random() * 28, // Random height between 40 and 60
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
            obstacle.x -= 5;

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

        // Draw ground
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY + 30);
        this.ctx.lineTo(this.canvas.width, this.groundY + 30);
        this.ctx.stroke();

        // Draw biker
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
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

        // Draw game over message
        if (this.currentState === this.gameState.GAME_OVER) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            
            // Draw main game over text
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            // Draw restart instruction
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Presione Espacio para jugar otra vez', this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            // Draw final score
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Puntaje: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
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