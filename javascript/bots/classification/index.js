const { ClassifierBot } = require("./bot");
const model = require("./src/model");
const { stateToModelInput } = require("./src/data");

module.exports = {
    buildModel: () => model.make(),
    new: () => new ClassifierBot("./trained-models/cnn-3x3-2d-all-1000"),
    convertGameStateToModelInput: stateToModelInput
}