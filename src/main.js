import kaboom from "kaboom";

// Check if the device is mobile
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Function to check orientation
function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

// Create orientation message element
const orientationMessage = document.createElement("div");
orientationMessage.id = "orientation-message";
orientationMessage.innerHTML = "Please rotate your device to landscape mode";
orientationMessage.style.cssText = `
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 24px;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
document.body.appendChild(orientationMessage);

// Function to handle orientation changes
function handleOrientation() {
  if (!isMobile || (isMobile && isLandscape())) {
    orientationMessage.style.display = "none";
    if (!window.game) {
      initGame();
    }
  } else {
    orientationMessage.style.display = "flex";
  }
}

// Check orientation on load and resize
window.addEventListener("load", handleOrientation);
window.addEventListener("resize", handleOrientation);

// Game variables
let health = 100;
let isImmune = false;
let immuneTimer = 0;
let healthDepletionTimer = 0;
let score = 0;
let scoreTimer = 0;

// Function to get top scores from localStorage
function getTopScores() {
  const topScores = JSON.parse(localStorage.getItem("topScores")) || [0, 0, 0];
  return topScores;
}

// Function to update top scores
function updateTopScores(newScore) {
  let topScores = getTopScores();
  topScores.push(newScore);
  topScores.sort((a, b) => b - a);
  topScores = topScores.slice(0, 3);
  localStorage.setItem("topScores", JSON.stringify(topScores));
  return topScores;
}

// Function to initialize the game
function initGame() {
  const k = kaboom({
    global: true,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
    debug: true,
  });

  // Load assets
  k.loadSprite("player", "assets/sprites/bean.png");
  k.loadSprite("enemy", "assets/sprites/ghosty.png");
  k.loadSprite("heart", "assets/sprites/heart.png");
  k.loadSprite("powerup", "assets/sprites/egg.png");

  k.loadSound("death", "assets/sounds/death.wav");
  k.loadSound("egg", "assets/sounds/egg.wav");
  k.loadSound("health", "assets/sounds/health.wav");
  k.loadSound("jump", "assets/sounds/jump.wav");

  const gotoGameOver = () => {
    k.play("death");
    k.go("gameOver");
  };

  // Define game scene
  k.scene("game", () => {
    // Set up gravity
    k.setGravity(1600);

    // Add a background
    k.add([k.rect(k.width(), k.height()), k.color(0, 200, 255)]);

    // Add player
    const MOVE_SPEED = 320;
    const JUMP_FORCE = 800;
    const player = k.add([
      k.sprite("player"),
      k.pos(50, k.height() - 50),
      k.area(),
      k.scale(0.5),
      k.body(),
      "player",
    ]);

    // Add enemy
    const ENEMY_SPEED = 100;
    const ENEMY_JUMP_FORCE = 600;
    const enemy = k.add([
      k.sprite("enemy"),
      k.pos(k.width() - 50, k.height() - 50),
      k.area(),
      k.scale(0.5),
      k.body(),
      "enemy",
    ]);

    // Player movement functions
    function moveLeft() {
      player.move(-MOVE_SPEED, 0);
    }

    function moveRight() {
      player.move(MOVE_SPEED, 0);
    }

    function jump() {
      if (player.isGrounded()) {
        player.jump(JUMP_FORCE);
        k.play("jump");
      }
    }

    // Keyboard controls
    k.onKeyDown("left", moveLeft);
    k.onKeyDown("right", moveRight);
    k.onKeyPress("space", jump);

    // Touch controls for mobile
    if (isMobile) {
      const buttonSize = Math.min(k.width(), k.height()) * 0.2; // Slightly smaller buttons
      const buttonGap = buttonSize * 1.2; // Gap between buttons
      const leftOffset = k.width() * 0.05; // Move controls to the right
      const topOffset = 70; // Place buttons below health and immunity displays

      let touchingLeft = false;
      let touchingRight = false;

      // Left button
      const leftBtn = k.add([
        k.pos(leftOffset, topOffset),
        k.rect(buttonSize * 1.5, buttonSize),
        k.color(128, 128, 128),
        k.outline(4),
        k.area(),
        "leftBtn",
      ]);
      leftBtn.add([
        k.text("L"),
        k.color(0, 0, 0),
        k.anchor("center"),
        k.pos(buttonSize / 2, buttonSize / 2),
      ]);

      // Right button
      const rightBtn = k.add([
        k.pos(leftOffset + buttonSize + buttonGap, topOffset),
        k.rect(buttonSize * 1.5, buttonSize),
        k.color(128, 128, 128),
        k.outline(4),
        k.area(),
        "rightBtn",
      ]);
      rightBtn.add([
        k.text("R"),
        k.color(0, 0, 0),
        k.anchor("center"),
        k.pos(buttonSize / 2, buttonSize / 2),
      ]);

      // Jump button
      const jumpBtn = k.add([
        k.pos(k.width() - buttonSize - leftOffset, topOffset),
        k.rect(buttonSize * 1.3, buttonSize),
        k.color(128, 128, 128),
        k.outline(4),
        k.area(),
        "jumpBtn",
      ]);
      jumpBtn.add([
        k.text("J"),
        k.color(0, 0, 0),
        k.anchor("center"),
        k.pos(buttonSize / 2, buttonSize / 2),
      ]);

      k.onTouchStart((id, pos) => {
        if (leftBtn.isHovering()) {
          touchingLeft = true;
        }
        if (rightBtn.isHovering()) {
          touchingRight = true;
        }
        if (jumpBtn.isHovering()) {
          jump();
        }
      });

      k.onTouchEnd((id, pos) => {
        touchingLeft = false;
        touchingRight = false;
      });

      k.onUpdate(() => {
        if (touchingLeft) {
          moveLeft();
        }
        if (touchingRight) {
          moveRight();
        }
      });
    }

    k.onUpdate(() => {
      // score updation
      scoreTimer += k.dt();
      if (scoreTimer >= 1) {
        score++;
        scoreText.text = `Score: ${score}`;
        scoreTimer = 0;
      }

      // Enemy AI to chase the player and jump
      const dir = player.pos.sub(enemy.pos).unit();
      enemy.move(dir.scale(ENEMY_SPEED));

      if (enemy.isGrounded() && Math.random() < 0.02) {
        enemy.jump(ENEMY_JUMP_FORCE);
      }
    });

    // Collision detection
    k.onCollide("player", "enemy", () => {
      if (!isImmune) {
        gotoGameOver();
      }
    });

    // Add platforms
    const groundY = k.height() - 10;
    const platformY = k.height() - 150;

    k.add([
      k.rect(k.width(), 20),
      k.pos(0, groundY),
      k.outline(4),
      k.area(),
      k.body({ isStatic: true }),
      k.color(127, 200, 255),
      "ground",
    ]);

    k.add([
      k.rect(200, 20),
      k.pos(300, platformY),
      k.outline(4),
      k.area(),
      k.body({ isStatic: true }),
      k.color(127, 200, 255),
      "platform",
    ]);

    // Enemy spawns hearts and eggs
    function enemySpawn() {
      const spawnX = enemy.pos.x;

      // Always spawn a heart
      k.add([
        k.sprite("heart"),
        k.pos(spawnX - 20, groundY - 20),
        k.area(),
        k.scale(0.5),
        "heart",
        { timeLeft: 20 },
      ]);

      // 10% chance to spawn an egg
      if (Math.random() < 0.1) {
        k.add([
          k.sprite("powerup"),
          k.pos(spawnX + 20, groundY - 20),
          k.area(),
          k.scale(0.5),
          "powerup",
          { timeLeft: 10 },
        ]);
      }

      k.wait(k.rand(3, 6), enemySpawn);
    }

    enemySpawn();

    // Collect hearts
    k.onCollide("player", "heart", (p, h) => {
      k.destroy(h);
      health = Math.min(health + 10, 100);
      updateHealth();
      k.play("health");

      score++; // Add 1 point for heart collision
      scoreText.text = `Score: ${score}`;
    });

    // Collect power-ups
    k.onCollide("player", "powerup", (p, pu) => {
      k.destroy(pu);
      isImmune = true;
      immuneTimer = 5;
      player.opacity = 0.5; // Make player semi-transparent when immune
      k.play("egg");

      score += 5; // Add 5 points for egg collision
      scoreText.text = `Score: ${score}`;
    });

    // Update immunity timer and health depletion
    k.onUpdate(() => {
      scoreTimer += k.dt();
      if (scoreTimer >= 1) {
        score++;
        updateScore();
        scoreTimer = 0;
      }

      if (isImmune) {
        immuneTimer -= k.dt();
        if (immuneTimer <= 0) {
          isImmune = false;
          player.opacity = 1; // Reset player opacity when immunity ends
        }
      }

      healthDepletionTimer += k.dt();
      if (healthDepletionTimer >= 2.5) {
        health = Math.max(health - 10, 0);
        updateHealth();
        healthDepletionTimer = 0;
        if (health <= 0) {
          gotoGameOver();
        }
      }

      // Update and destroy hearts and eggs based on their timers
      k.get("heart").forEach((h) => {
        h.timeLeft -= k.dt();
        if (h.timeLeft <= 0) {
          k.destroy(h);
        }
      });

      k.get("powerup").forEach((p) => {
        p.timeLeft -= k.dt();
        if (p.timeLeft <= 0) {
          k.destroy(p);
        }
      });
    });

    // Display score, health and immunity timer
    const scoreText = k.add([k.text("Score: 0"), k.pos(30, 10), k.scale(0.5)]);

    const healthText = k.add([
      k.text("Health: 100"),
      k.pos(150, 10),
      k.scale(0.5),
      k.color(k.rgb(0, 255, 0)),
    ]);

    const immuneText = k.add([k.text(""), k.pos(30, 30), k.scale(0.5)]);

    function updateScore() {
      scoreText.text = `Score: ${score}`;
    }

    function updateHealth() {
      healthText.text = `Health: ${health}`;
      if (health <= 30) {
        healthText.color = k.rgb(255, 0, 0);
      } else if (health <= 60) {
        healthText.color = k.rgb(255, 165, 0);
      } else {
        healthText.color = k.rgb(0, 255, 0);
      }
    }

    function updateImmuneTimer() {
      if (isImmune) {
        immuneText.text = `Immune: ${immuneTimer.toFixed(1)}s`;
      } else {
        immuneText.text = "";
      }
    }

    k.onUpdate(() => {
      updateImmuneTimer();
    });

    // Add left and right boundaries
    k.add([
      k.rect(20, k.height()),
      k.pos(0, 0),
      k.outline(4),
      k.area(),
      k.body({ isStatic: true }),
      k.color(127, 200, 255),
    ]);

    k.add([
      k.rect(20, k.height()),
      k.pos(k.width() - 20, 0),
      k.outline(4),
      k.area(),
      k.body({ isStatic: true }),
      k.color(127, 200, 255),
    ]);

    // Keep player within bounds
    player.onUpdate(() => {
      if (player.pos.x < 20) player.pos.x = 20;
      if (player.pos.x > k.width() - 20) player.pos.x = k.width() - 20;
      if (player.pos.y < 0) player.pos.y = 0;
    });

    // Check if player or enemy falls off the screen
    k.onUpdate(() => {
      if (player.pos.y >= k.height() || enemy.pos.y >= k.height()) {
        gotoGameOver();
      }
    });
  });

  // Game over scene
  // Game over scene
  k.scene("gameOver", () => {
    k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0)]);

    k.add([
      k.text("Game Over!"),
      k.pos(k.width() / 2, k.height() / 4),
      k.anchor("center"),
      k.scale(0.75),
      k.color(255, 255, 255),
    ]);

    const topScores = updateTopScores(score);

    k.add([
      k.text(`Your Score: ${score}`),
      k.pos(k.width() / 2, k.height() / 2 - 50),
      k.anchor("center"),
      k.scale(0.5),
      k.color(255, 255, 255),
    ]);

    k.add([
      k.text("Top Scores:"),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"),
      k.scale(0.5),
      k.color(255, 255, 255),
    ]);

    topScores.forEach((topScore, index) => {
      k.add([
        k.text(`${index + 1}. ${topScore}`),
        k.pos(k.width() / 2, k.height() / 2 + 30 + index * 30),
        k.anchor("center"),
        k.scale(0.5),
        k.color(255, 255, 255),
      ]);
    });

    k.add([
      k.text("Press space or tap to restart"),
      k.pos(k.width() / 2, (k.height() * 3) / 4),
      k.anchor("center"),
      k.scale(0.5),
      k.color(255, 255, 255),
    ]);

    k.onKeyPress("space", () => {
      k.go("game");
      health = 100;
      score = 0;
    });

    k.onClick(() => {
      k.go("game");
      health = 100;
      score = 0;
    });
  });

  // Start the game
  k.go("game");
}
