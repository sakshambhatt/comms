import kaboom from "kaboom";

// Initialize kaboom context
kaboom({
  global: true,
  width: 800,
  height: 600,
  scale: 1,
  debug: true,
});

// Load assets
loadSprite("player", "https://kaboomjs.com/sprites/bean.png");
loadSprite("enemy", "https://kaboomjs.com/sprites/ghosty.png");
loadSprite("heart", "https://kaboomjs.com/sprites/heart.png");
loadSprite("powerup", "https://kaboomjs.com/sprites/egg.png");

// Define game variables
let health = 100;
let isImmune = false;
let immuneTimer = 0;
let healthDepletionTimer = 0;

// Define game scene
scene("game", () => {
  // Set up gravity
  setGravity(1600);

  // Add a background
  add([rect(width(), height()), color(0, 200, 255)]);

  // Add player
  const MOVE_SPEED = 320;
  const JUMP_FORCE = 800;
  const player = add([
    sprite("player"),
    pos(50, height() - 50),
    area(),
    scale(0.5),
    body(),
    "player",
  ]);

  // Add enemy
  const ENEMY_SPEED = 100;
  const ENEMY_JUMP_FORCE = 600;
  const enemy = add([
    sprite("enemy"),
    pos(width() - 50, height() - 50),
    area(),
    scale(0.5),
    body(),
    "enemy",
  ]);

  // Player movement
  onKeyDown("left", () => {
    player.move(-MOVE_SPEED, 0);
  });

  onKeyDown("right", () => {
    player.move(MOVE_SPEED, 0);
  });

  // Jumping
  onKeyPress("space", () => {
    if (player.isGrounded()) {
      player.jump(JUMP_FORCE);
    }
  });

  // Enemy AI to chase the player and jump
  onUpdate(() => {
    const dir = player.pos.sub(enemy.pos).unit();
    enemy.move(dir.scale(ENEMY_SPEED));

    if (enemy.isGrounded() && Math.random() < 0.02) {
      enemy.jump(ENEMY_JUMP_FORCE);
    }
  });

  // Collision detection
  onCollide("player", "enemy", () => {
    if (!isImmune) {
      go("gameOver");
    }
  });

  // Add platforms
  const groundY = height() - 10;
  const platformY = height() - 150;

  add([
    rect(width(), 20),
    pos(0, groundY),
    outline(4),
    area(),
    body({ isStatic: true }),
    color(127, 200, 255),
    "ground",
  ]);

  add([
    rect(200, 20),
    pos(300, platformY),
    outline(4),
    area(),
    body({ isStatic: true }),
    color(127, 200, 255),
    "platform",
  ]);

  // Enemy spawns hearts and eggs
  function enemySpawn() {
    const spawnX = enemy.pos.x;

    // Always spawn a heart
    add([
      sprite("heart"),
      pos(spawnX - 20, groundY - 20),
      area(),
      scale(0.5),
      "heart",
      { timeLeft: 20 },
    ]);

    // 90% chance to spawn an egg
    if (Math.random() < 0.1) {
      add([
        sprite("powerup"),
        pos(spawnX + 20, groundY - 20),
        area(),
        scale(0.5),
        "powerup",
        { timeLeft: 10 },
      ]);
    }

    wait(rand(3, 6), enemySpawn);
  }

  enemySpawn();

  // Collect hearts
  onCollide("player", "heart", (p, h) => {
    destroy(h);
    health = Math.min(health + 10, 100);
    updateHealth();
  });

  // Collect power-ups
  onCollide("player", "powerup", (p, pu) => {
    destroy(pu);
    isImmune = true;
    immuneTimer = 5;
    player.opacity = 0.5; // Make player semi-transparent when immune
  });

  // Update immunity timer and health depletion
  onUpdate(() => {
    if (isImmune) {
      immuneTimer -= dt();
      if (immuneTimer <= 0) {
        isImmune = false;
        player.opacity = 1; // Reset player opacity when immunity ends
      }
    }

    healthDepletionTimer += dt();
    if (healthDepletionTimer >= 10) {
      health = Math.max(health - 10, 0);
      updateHealth();
      healthDepletionTimer = 0;
      if (health <= 0) {
        go("gameOver");
      }
    }

    // Update and destroy hearts and eggs based on their timers
    get("heart").forEach((h) => {
      h.timeLeft -= dt();
      if (h.timeLeft <= 0) {
        destroy(h);
      }
    });

    get("powerup").forEach((p) => {
      p.timeLeft -= dt();
      if (p.timeLeft <= 0) {
        destroy(p);
      }
    });
  });

  // Display health and immunity timer
  const healthText = add([text("Health: 100"), pos(50, 10), scale(0.5)]);
  const immuneText = add([text(""), pos(50, 30), scale(0.5)]);

  function updateHealth() {
    healthText.text = `Health: ${health}`;
    if (health <= 30) {
      healthText.color = rgb(255, 0, 0);
    } else if (health <= 60) {
      healthText.color = rgb(255, 165, 0);
    } else {
      healthText.color = rgb(0, 255, 0);
    }
  }

  function updateImmuneTimer() {
    if (isImmune) {
      immuneText.text = `Immune: ${immuneTimer.toFixed(1)}s`;
    } else {
      immuneText.text = "";
    }
  }

  onUpdate(() => {
    updateImmuneTimer();
  });

  // Add left and right boundaries
  add([
    rect(20, height()),
    pos(0, 0),
    outline(4),
    area(),
    body({ isStatic: true }),
    color(127, 200, 255),
  ]);

  add([
    rect(20, height()),
    pos(width() - 20, 0),
    outline(4),
    area(),
    body({ isStatic: true }),
    color(127, 200, 255),
  ]);

  // Keep player within bounds
  player.onUpdate(() => {
    if (player.pos.x < 20) player.pos.x = 20;
    if (player.pos.x > width() - 20) player.pos.x = width() - 20;
    if (player.pos.y < 0) player.pos.y = 0;
  });

  // Check if player or enemy falls off the screen
  onUpdate(() => {
    if (player.pos.y >= height() || enemy.pos.y >= height()) {
      go("gameOver");
    }
  });
});

// Game over scene
scene("gameOver", () => {
  add([
    text(`Game Over!\nPress space to restart`),
    pos(width() / 2, height() / 2),
    anchor("center"),
    scale(0.5),
  ]);

  onKeyPress("space", () => {
    go("game");
    health = 100;
  });
});

// Start the game
go("game");
