const fs = require("fs");

function writeFileSync(filePath, content) {
    return fs.writeFileSync(filePath, JSON.stringify(content), handleWriteError);
}

function handleWriteError(error) {
    if (error) {
        throw error;
    }
}

function readFileSync(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = {
    readFileSync,
    writeFileSync
};