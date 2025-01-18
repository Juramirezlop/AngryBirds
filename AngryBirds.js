const {
  World,
  Engine,
  Bodies,
  Body,
  Mouse,
  MouseConstraint,
  Constraint,
  Events,
} = Matter;

let engine,
  world,
  ground,
  boxes,
  pigs,
  birds = [],
  mouseConstraint,
  slingShot;
let redImg, pigImg, boxImg, backgroundImg, groundImg, SlingShotImg;
//numero de pajaros disponibles equivale al numero de intentos del usuarios
let Nbirds = 10;
let birdIndex = 0;
//numero de cerdos
let Npigs = 7;
//tiempo de expiracion
let birdTimeout = 4000;

function preload() {
  redImg = loadImage("red.png");
  pigImg = loadImage("pig.png");
  boxImg = loadImage("box.png");
  backgroundImg = loadImage("background.jpeg");
  groundImg = loadImage("ground.jpeg");
  SlingShotImg = loadImage("Slingshot.png");
}

function setup() {
  const canvas = createCanvas(1400, 700);

  engine = Engine.create();
  world = engine.world;

  const mouse = Mouse.create(canvas.elt);
  mouse.pixelRatio = pixelDensity();

  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    collisionFilter: { mask: 2 },
  });
  World.add(world, mouseConstraint);

  ground = new Ground(width / 2, height - 10, width, 20, null, groundImg);

  boxes = [];
  pigs = [];

  createComplexStructure();
  createPigs();
  createNewBird();

  slingShot = new SlingShot(birds[0]); // El primer pájaro es el que se lanza inicialmente

  Events.on(engine, "afterUpdate", () => {
    slingShot.fly(mouseConstraint);
    if (
      !slingShot.hasBird() &&
      birds.length > 0 &&
      slingShot.shouldRemoveBird()
    ) {
      World.remove(world, birds[0].body); // Elimina el pájaro del mundo
      birds.shift(); // Elimina el pájaro lanzado del array
      birdIndex++;
      if (birdIndex < Nbirds) {
        const newBird = createNewBird();
        slingShot.attach(newBird); // Adjunta el nuevo pájaro al lanzador
      }
    }
  });
}

function gameOver() {
  background(70, 45, 90);
  //msj fin de juego
  textSize(40);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  text(
    "Fin del juego, no mas intentos disponibles!",
    width / 2,
    height / 2 - 20
  );
  //reinicio
  textSize(30);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Presiona F5 para reiniciar juego!", width / 2, height / 2 + 20);
}

function winGame() {
  console.log("Level finished!");
  background(0, 140, 90);
  //msj fin de juego
  textSize(40);
  fill(20, 100, 10);
  textAlign(CENTER, CENTER);
  text("Felicidades, has ganado!", width / 2, height / 2 - 20);
  //reinicio
  textSize(30);
  fill(0, 0, 121);
  textAlign(CENTER, CENTER);
  text("Presiona F5 para reiniciar juego!", width / 2, height / 2 + 20);
}

function createNewBird() {
  const newBird = new Bird(150, height - 150, 30, 10, redImg);
  birds.push(newBird);
  return newBird;
}

function createComplexStructure() {
  const boxWidth = 60;
  const boxHeight = 60;

  createPyramid(700, height, 5, boxWidth, boxHeight);
  createTower(900, height, 4, boxWidth, boxHeight);
  createTower(1100, height, 6, boxWidth, boxHeight);
  createPyramid(1300, height, 3, boxWidth, boxHeight);
  createRandomBlocks();
}

function createPyramid(startX, startY, layers, boxWidth, boxHeight) {
  for (let i = 0; i < layers; i++) {
    for (let j = 0; j < layers - i; j++) {
      let box = new Box(
        startX + j * boxWidth,
        startY - i * boxHeight,
        boxWidth,
        boxHeight,
        1,
        boxImg
      );
      boxes.push(box);
    }
  }
}

function createTower(startX, startY, height, boxWidth, boxHeight) {
  for (let i = 0; i < height; i++) {
    let box = new Box(
      startX,
      startY - i * boxHeight,
      boxWidth,
      boxHeight,
      1,
      boxImg
    );
    boxes.push(box);
  }
}

function createRandomBlocks() {
  for (let i = 0; i < 10; i++) {
    let x = random(width / 2, width - 200);
    let y = random(height, height - 100);
    let w = random(40, 80);
    let h = random(40, 80);
    let box = new Box(x, y, w, h, 1, boxImg);
    boxes.push(box);
  }
}

function createPigs() {
  //crear la cantidad de cerdos indicada
  for (let i = 0; i < Npigs; i++) {
    pigs.push(
      new Pig(random(700, 1000), height - random(100, 200), 25, 1, pigImg)
    );
  }
}
function draw() {
  background(0);
  image(backgroundImg, 0, 0, width, height);

  Engine.update(engine);

  //actualizar barra de informacion
  textSize(22);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  //numero de aves = 10, numero de cerdos
  text(
    `| Birds: ${Nbirds - birdIndex - 1} | Pigs: ${pigs.length} | Points: ${
      (Npigs - pigs.length) * 100
    } |`,
    160,
    30
  );

  if (birdIndex == Nbirds) {
    gameOver();
  }

  if (pigs.length == 0) {
    winGame();
  }

  ground.render();

  // Comprobar colisiones y aplicar daño en cada fotograma
  for (const box of boxes) {
    box.render();
  }

  for (const pig of pigs) {
    pig.render();

    // Revisamos la colisión entre el cerdo y el pájaro
    for (const bird of birds) {
      const distance = dist(
        bird.body.position.x,
        bird.body.position.y,
        pig.body.position.x,
        pig.body.position.y
      );

      // Si los cuerpos están suficientemente cerca (colisión)
      if (distance < bird.body.circleRadius + pig.body.circleRadius) {
        // Calcular el impacto en función de la velocidad de los objetos
        const birdVelocity = createVector(
          bird.body.velocity.x,
          bird.body.velocity.y
        );
        const pigVelocity = createVector(
          pig.body.velocity.x,
          pig.body.velocity.y
        );
        const relativeVelocity = birdVelocity.sub(pigVelocity);
        const impactForce = relativeVelocity.mag(); // Magnitud de la velocidad relativa

        // Si el impacto es lo suficientemente fuerte, aplicar daño al cerdo
        if (impactForce > 2) {
          // Umbral ajustable para daño
          pig.takeDamage(impactForce * 5); // Aplica el daño
        }
      }
    }

    // Revisar colisiones entre el cerdo y las cajas
    for (const box of boxes) {
      const distance = dist(
        box.body.position.x,
        box.body.position.y,
        pig.body.position.x,
        pig.body.position.y
      );

      if (distance < box.body.width / 2 + pig.body.circleRadius) {
        // Calcular el impacto en función de la velocidad de los objetos
        const boxVelocity = createVector(
          box.body.velocity.x,
          box.body.velocity.y
        );
        const pigVelocity = createVector(
          pig.body.velocity.x,
          pig.body.velocity.y
        );
        const relativeVelocity = boxVelocity.sub(pigVelocity);
        const impactForce = relativeVelocity.mag(); // Magnitud de la velocidad relativa

        // Si el impacto es lo suficientemente fuerte, aplicar daño al cerdo
        if (impactForce > 2) {
          // Umbral ajustable para daño
          pig.takeDamage(impactForce); // Aplica el daño
        }
      }
    }
  }

  slingShot.render();
  for (const bird of birds) {
    bird.render();
  }
}

class Box {
  constructor(x, y, w, h, m, img, options = {}) {
    this.body = Bodies.rectangle(x, y, w, h, options);
    World.add(world, this.body);

    this.w = w;
    this.h = h;
    this.img = img;

    if (m) {
      Body.setMass(this.body, m);
    }
  }

  render() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    if (this.img) {
      imageMode(CENTER);
      image(this.img, 0, 0, this.w, this.h);
    } else {
      rectMode(CENTER);
      rect(0, 0, this.w, this.h);
    }
    pop();
  }
}

class Ground extends Box {
  constructor(x, y, w, h, m, img) {
    super(x, y, w, h, m, img, { isStatic: true });
  }
}

class Animal {
  constructor(x, y, r, m, img, options = {}) {
    this.body = Bodies.circle(x, y, r, options);
    Body.setMass(this.body, m);
    this.img = img;
    World.add(world, this.body);
  }

  render() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    if (this.img) {
      imageMode(CENTER);
      image(
        this.img,
        0,
        0,
        this.body.circleRadius * 2,
        this.body.circleRadius * 2
      );
    } else {
      circle(0, 0, this.body.circleRadius * 2);
    }
    pop();
  }
}

class Bird extends Animal {
  constructor(x, y, r, m, img, options = {}) {
    super(x, y, r, m, img, {
      restitution: 0.7,
      collisionFilter: { category: 2 },
    });
  }
}

class Pig extends Animal {
  constructor(x, y, r, m, img, options = {}) {
    super(x, y, r, m, img, {});
    this.health = 100; // Salud inicial del cerdo
  }

  takeDamage(amount) {
    this.health -= amount; // Resta el daño
    if (this.health <= 0) {
      this.health = 0;
      World.remove(world, this.body); // Elimina el cerdo cuando su salud llega a 0
      pigs = pigs.filter((pig) => pig !== this); // Elimina el cerdo del array de cerdos
    }
  }

  render() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    // Barra de vida cerdo
    if (this.health > 0 && this.health <= 20) {
      fill(255, 0, 0); //rojo
    } else if (this.health > 20 && this.health <= 50) {
      fill(255, 128, 0); //naranja
    } else if (this.health > 50 && this.health <= 70) {
      fill(255, 255, 0); //amarillo
    } else if (this.health > 70 && this.health <= 100) {
      fill(0, 255, 0); //verde
    }

    noStroke();
    rectMode(CENTER);
    rect(0, -this.body.circleRadius - 10, this.health * 0.5, 10); // Tamaño relativo a la salud

    if (this.img) {
      imageMode(CENTER);
      image(
        this.img,
        0,
        0,
        this.body.circleRadius * 2,
        this.body.circleRadius * 2
      );
    } else {
      circle(0, 0, this.body.circleRadius * 2);
    }
    pop();
  }
}

class SlingShot {
  constructor(bird) {
    this.sling = Constraint.create({
      pointA: {
        x: bird.body.position.x,
        y: bird.body.position.y,
      },
      bodyB: bird.body,
      length: 10,
      stiffness: 0.05,
    });
    World.add(world, this.sling);
    this.launchTime = null;
    this.launched = false; // Indicador de si el pájaro ha sido lanzado
  }

  render() {
    push();
    image(
      SlingShotImg,
      this.sling.pointA.x - 85,
      this.sling.pointA.y - 25,
      160,
      160
    );
    if (this.sling.bodyB !== null) {
      line(
        this.sling.pointA.x,
        this.sling.pointA.y,
        this.sling.bodyB.position.x,
        this.sling.bodyB.position.y
      );
    }
    pop();
  }

  fly(mouseConstraint) {
    if (
      this.sling.bodyB !== null &&
      mouseConstraint.mouse.button === -1 &&
      this.sling.bodyB.position.x > this.sling.pointA.x + 30
    ) {
      this.sling.bodyB.collisionFilter.category = 1;
      this.launchTime = millis(); // Guardamos el tiempo de lanzamiento
      this.sling.bodyB = null;
      this.launched = true;
    }
  }

  hasBird() {
    return this.sling.bodyB !== null;
  }

  attach(bird) {
    this.sling.bodyB = bird.body;
  }

  shouldRemoveBird() {
    if (this.launched && millis() - this.launchTime > birdTimeout) {
      return true;
    }
    return false;
  }
}
