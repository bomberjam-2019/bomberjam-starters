const baseModel = require("./base-model");

const { RandomBot } = require("./randomBot");

module.exports = {
    RandomBot,
    bot: baseModel,
    botsToCompare: [baseModel, baseModel, baseModel, baseModel]
}