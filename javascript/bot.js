const { classifierBot } = require("./classification/bots");
const { scriptedBot } = require("./scripted/bots");

function dumbBot() {
    return "bomb";
}

module.exports = [classifierBot, dumbBot, dumbBot, dumbBot];