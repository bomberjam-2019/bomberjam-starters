function byDecreasing(property) {
    return function(bombA, bombB) {
        if (bombA[property] < bombB[property]) {
            return 1;
        }

        if (bombA[property] > bombB[property]) {
            return -1
        }

        return 0;
    }
}

function byIncreasing(property) {
    return function(bombA, bombB) {
        if (bombA[property] > bombB[property]) {
            return 1;
        }

        if (bombA[property] < bombB[property]) {
            return -1
        }

        return 0;
    }
}

module.exports = {
    byDecreasing,
    byIncreasing
};