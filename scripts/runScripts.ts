import { checkJsonFiles } from './suite/checkJsons';
import { generateEnumList } from './suite/generateEnumList';
import { writePackageData } from './suite/writePackageData';
import { generateEnumAtlas } from './suite/generateEnumAtlas';

const callbacks: (() => void)[] = [
    checkJsonFiles,
    generateEnumAtlas,
    generateEnumList,
    writePackageData,
];

const separator = '-----------------' as const;

console.log(separator);
for (const callback of callbacks) {
    console.log(`Executing ${callback.name}...`);
    try {
        callback();
    } catch (error) {
        console.error(`Error executing ${callback.name}`);
        throw error;
    }
    console.log(separator);
}