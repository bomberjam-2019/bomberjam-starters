const { startSimulation } = require('bomberjam-backend/dist/client');
const { ClassifierBot } = require("./classification/bot");
const { RandomBot } = require("./dumb/bot");

async function simulateGame() {
  const bots = [new ClassifierBot(), new RandomBot(), new RandomBot(), new RandomBot()];
  await bots[0].init();

  const saveGamelog = true;
  const simulation = startSimulation(bots, saveGamelog);

  while (!simulation.isFinished) {
    simulation.executeNextTick();
  }

  console.log(simulation.currentState);
}

simulateGame();
