const { ALL_ACTIONS } = require("../classification/src/game-constants");

function dumbBot() {
    const actionStrings = Object.keys(ALL_ACTIONS);
    const action = actionStrings[Math.floor(Math.random() * actionStrings.length)]
    // console.log(actionStrings, action);

    return action;
}

module.exports = {
    dumbBot
}