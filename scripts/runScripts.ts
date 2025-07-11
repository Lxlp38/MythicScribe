import { checkJsonFiles } from './suite/checkJsons';
import { generateEnumList } from './suite/generateEnumList';
import { writePackageData } from './suite/writePackageData';

const callbacks = [
    generateEnumList,
    writePackageData,
    checkJsonFiles
];

for (const callback of callbacks) {
    console.log(`Executing ${callback.name}...`);
    try {
        callback();
    } catch (error) {
        console.error(`Error executing ${callback.name}:`, error);
    }
    console.log(`\n`);
}