let player;
let cursors;
let spacebar;
let sword;
let score = 0;
let scoreText;
let isAttacking = false;
let enemies;
let background;
let enemyType = 'enemy'; // Tracks which enemy type to spawn next
let winText;
let health = 100; // Player's health
let healthText; // Text to display health
let projectiles;
let gameOverState = false; // A flag to track if the game is over
let gameOverText; // Text for "Game Over"
let defeatedEnemies = 0; // Track the number of defeated enemies

const config = {
    type: Phaser.AUTO,
    width: 1385,  // Updated width for a larger game
    height: 630,  // Updated height for a larger game
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Load assets
    this.load.image('player', 'asset/walk.gif');
    this.load.image('sword', 'asset/Sword.png');
    this.load.image('enemy', 'asset/enemy.png');
    this.load.image('enemy2', 'asset/enemy2.png');
    this.load.image('background', 'asset/sky2.jpg');
    this.load.image('projectile', 'asset/projectile.png'); // Assuming projectile is named 'projectile.png'
}

function create() {
    // Add background image
    background = this.add.image(600, 450, 'background'); // Adjusted background position for new size

    // Add player sprite and enable physics
    player = this.physics.add.sprite(600, 450, 'player');
    player.setScale(0.8);
    player.setCollideWorldBounds(true);

    // Reset velocity to ensure player doesn't move on its own
    player.setVelocity(0);

    // Create sword (set to invisible initially)
    sword = this.physics.add.sprite(player.x - 40, player.y, 'sword');
    sword.setScale(0.8);
    sword.visible = false;

    // Set up keyboard input for movement and attack
    cursors = this.input.keyboard.createCursorKeys();
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Score text (displaying on the top left of the screen)
    scoreText = this.add.text(20, 20, `Score: ${score}`, { fontSize: '24px', fill: '#ffffff' });

    // Add win message (hidden initially)
    winText = this.add.text(500, 400, 'You Win!', {
        fontSize: '48px',
        fill: '#ff0000',
        fontFamily: 'Arial'
    }).setAlpha(0); // Set initial alpha to 0 (hidden)

    // Health text (displaying on the top left of the screen)
    healthText = this.add.text(20, 60, `Health: ${health}`, { fontSize: '24px', fill: '#ffffff' });

    // Start spawning enemies and projectiles
    spawnEnemies.call(this);
}

function update() {
    // Check if the game is over. If so, stop movement and projectiles
    if (gameOverState) {
        return; // Prevent further updates if the game is over
    }

    // Reset player velocity to 0 at the start of each update
    player.setVelocity(0);

    // Move player left or right
    if (cursors.left.isDown) {
        player.setVelocityX(-200);  // Move left
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);   // Move right
    }

    // Move player up or down
    if (cursors.up.isDown) {
        player.setVelocityY(-200);  // Move up
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);   // Move down
    }

    // Attack when spacebar is pressed
    if (Phaser.Input.Keyboard.JustDown(spacebar)) {
        isAttacking = true;
        sword.visible = true;
        this.time.delayedCall(300, () => {
            sword.visible = false;
            isAttacking = false;
        });
    }

    // Update sword position relative to player
    sword.x = player.x - (isAttacking ? 0 : 40);  // Adjust sword position when attacking
    sword.y = player.y;

    // Check for enemy collisions with sword
    if (enemies) {
        this.physics.add.overlap(sword, enemies, attackEnemy, null, this);
    }

    // Check for projectile collisions with player
    if (projectiles) {
        this.physics.add.overlap(player, projectiles, hitByProjectile, null, this);
    }

    // Update health text
    healthText.setText(`Health: ${health}`);

    // Check win condition
    if (score >= 30) {
        winGame.call(this); // Now winGame is defined
    }

    // Check if health is zero and end the game
    if (health <= 0) {
        gameOver.call(this);
    }

    // Disable projectiles if they go off-screen
    if (projectiles) {
        projectiles.children.iterate((projectile) => {
            if (projectile.x < 0 || projectile.x > 1200 || projectile.y < 0 || projectile.y > 900) {
                projectile.disableBody(true, true); // Disable projectiles that go off-screen
            }
        });
    }
}

// Function for attacking enemy
function attackEnemy(sword, enemy) {
    if (isAttacking) {
        enemy.disableBody(true, true);  // Disable enemy on hit
        defeatedEnemies += 1; // Increment defeated enemies counter
        updateScore(1);

        // Check if all enemies in the current batch are defeated
        if (defeatedEnemies === 5) {
            defeatedEnemies = 0; // Reset defeated counter
            spawnEnemies.call(this); // Spawn next batch of enemies
        }
    }
}

// Update score and display it
function updateScore(points) {
    score += points;
    scoreText.setText(`Score: ${score}`); // Update score text
}

// Function to spawn enemies
function spawnEnemies() {
    // Clear previous enemies
    if (enemies) {
        enemies.clear(true, true);
    }

    // Spawn a new set of enemies based on the current enemy type
    if (enemyType === 'enemy') {
        enemies = this.physics.add.group({
            key: 'enemy',
            repeat: 4,
            setXY: { x: 100, y: 100, stepX: 150 }
        });
        enemyType = 'enemy2'; // Switch to spawn the second type of enemies
    } else {
        enemies = this.physics.add.group({
            key: 'enemy2',
            repeat: 4,
            setXY: { x: 100, y: 100, stepX: 150 }
        });
        enemyType = 'enemy'; // Switch back to spawn the first type of enemies
    }

    // Set up the enemies' properties and ensure they move around
    enemies.children.iterate((enemy) => {
        enemy.setScale(0.2);
        enemy.setBounce(1); // Make the enemy bounce off walls
        enemy.setCollideWorldBounds(true); // Keep enemies within the bounds of the game
        enemy.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, 150)); // Initial random movement
        enemy.body.setAllowGravity(false);

        // Change enemy direction every 2 seconds
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (enemy.active) { // Ensure the enemy is still alive
                    enemy.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, 150));
                }
            },
            loop: true,
        });

        // Set up delayed projectile throwing for each enemy
        enemy.throwProjectile = this.time.addEvent({
            delay: 4000, // 4-second delay before throwing projectiles
            callback: () => {
                if (enemy.active) { // Check if the enemy is still alive before throwing projectile
                    throwProjectile.call(this, enemy); // Throw projectile
                }
            },
            loop: true, // Continue throwing projectiles until stopped
        });
    });
}

// Function to throw projectiles
function throwProjectile(enemy) {
    let projectile = this.physics.add.sprite(enemy.x, enemy.y, 'projectile');
    projectile.setScale(0.7); // Scale down the projectile
    projectile.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
    projectile.body.setAllowGravity(false);

    // Move the projectile towards the player
    this.physics.moveToObject(projectile, player, 100);

    // Check for collision with player
    this.physics.add.overlap(player, projectile, hitByProjectile, null, this);

    // Disable projectiles if they go off-screen (same as above)
    this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (projectile.x < 0 || projectile.x > 1200 || projectile.y < 0 || projectile.y > 900) {
                projectile.disableBody(true, true); // Disable projectiles that go off-screen
            }
        },
        loop: true,
    });
}

// Function when player is hit by a projectile
function hitByProjectile(player, projectile) {
    projectile.disableBody(true, true); // Disable the projectile
    health -= 20; // Decrease health
    healthText.setText(`Health: ${health}`); // Update health display
}

// Function to show win message
function winGame() {
    winText.setAlpha(1); // Show win message
    setTimeout(() => {
        winText.setAlpha(0); // Hide win message after 2 seconds
        gameOverState = true; // Set game state to "game over"
    }, 2000); // Wait for 2 seconds before hiding the win message
}

// Function to end the game when health reaches 0
function gameOver() {
    gameOverState = true; // Set game over state
    gameOverText = this.add.text(400, 400, 'Game Over', {
        fontSize: '48px',
        fill: '#ff0000',
        fontFamily: 'Arial'
    });
    gameOverText.setAlpha(1); // Display game over text
    this.time.delayedCall(2000, () => {
        // Restart the game after 2 seconds
        location.reload();
    });
}
