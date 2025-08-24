const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, 'data');

const getFilePath = (fileName) => path.join(dataDir, `${fileName}.json`);

const readData = async (fileName) => {
    try {
        const filePath = getFilePath(fileName);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create it with an empty array
            await writeData(fileName, []);
            return [];
        }
        throw error;
    }
};

const writeData = async (fileName, data) => {
    await fs.writeFile(getFilePath(fileName), JSON.stringify(data, null, 2), 'utf8');
};

const find = async (fileName, predicate) => {
    const data = await readData(fileName);
    return data.find(predicate);
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
    if (updatedItem) {
        await writeData(fileName, newData);
    }
    return updatedItem;
};

module.exports = { readData, writeData, find, push, update };
