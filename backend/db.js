const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Helper to ensure the data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(dataDir);
    } catch (e) {
        await fs.mkdir(dataDir);
    }
};

const getFilePath = (fileName) => path.join(dataDir, `${fileName}.json`);

const readData = async (fileName) => {
    try {
        const filePath = getFilePath(fileName);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist, return an empty array
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

const writeData = async (fileName, data) => {
    const filePath = getFilePath(fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const find = async (fileName, predicate) => {
    const data = await readData(fileName);
    return data.find(predicate);
};

const filter = async (fileName, predicate) => {
    const data = await readData(fileName);
    return data.filter(predicate);
};

const push = async (fileName, item) => {
    const data = await readData(fileName);
    data.push(item);
    await writeData(fileName, data);
    return item;
};

const update = async (fileName, predicate, updateFn) => {
    const data = await readData(fileName);
    let updatedItem = null;
    const newData = data.map(item => {
        if (predicate(item)) {
            updatedItem = updateFn(item);
            return updatedItem;
        }
        return item;
    });
    await writeData(fileName, newData);
    return updatedItem;
}

// Initialize data directory on startup
ensureDataDir();

module.exports = {
    readData,
    writeData,
    find,
    filter,
    push,
    update
};
