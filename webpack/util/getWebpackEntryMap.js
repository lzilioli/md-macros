const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = function getWebpackEntryMap(forFolder) {
    const resolvedFolder = path.resolve(forFolder);
    let results;
    try {
        results = fs.readdirSync(path.join(resolvedFolder, 'entries'));
    } catch (e) {
        return {};
    }
    const entryMap = {};
    _.chain(results)
    .filter(file => file.endsWith('.ts'))
    .each((file)=>{
        entryMap[path.basename(file, path.extname(file))] = path.join(resolvedFolder, 'entries', file);
    })
    .value();
    return entryMap;
}
