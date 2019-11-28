const { classifierBot } = require("./classification/bot");
const { scriptedBot } = require("./scripted/bot");
const { dumbBot } = require("./dumb/bot");

module.exports = [dumbBot, dumbBot, classifierBot, dumbBot];