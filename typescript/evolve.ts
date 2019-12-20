import GenerationManager from './generationManager';
import LoadModel from './utils/loadModel';

(async () => {
  try {

    // Load Model
    const model = await LoadModel('file://./saved-models/base-model-best/model.json');

    const generationManager = new GenerationManager(4, model, true);

    while (true) {
      await generationManager.runGeneration();
      await generationManager.nextGeneration();
    }
  } catch (e) {
    console.log(e);
  }
})();
