import { attributeAliasUsedInCompletions, CustomDatasetElementType, CustomDatasetSource, DatasetSource, LogLevel, MinecraftVersions } from './../../src/common/packageData';
import * as fs from 'fs';
import * as path from 'path';

const map: {[key: string]: { values: readonly string[], default?: string}} = {
    'minecraftVersion': {values: ['latest', ...MinecraftVersions]},
    'datasetSource': {values: DatasetSource, default: 'GitHub'},
    'attributeAliasUsedInCompletions': {values: attributeAliasUsedInCompletions},
    'customDatasets.elementType': {values: CustomDatasetElementType},
    'customDatasets.source': {values: CustomDatasetSource},
    'logLevel': {values: LogLevel, default: 'debug'},
}

export function writePackageData(){
    console.log('Writing package data...');
    let count = 0;
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    for (const key in map) {
        count++;
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            packageJson.contributes.configuration.properties[`MythicScribe.${parent}`].items.properties[child].enum = map[key as keyof typeof map].values;
            console.log(`Wrote property MythicScribe.${parent}.${child}`);
            continue;
        }
        packageJson.contributes.configuration.properties[`MythicScribe.${key}`].enum = map[key as keyof typeof map].values;
        packageJson.contributes.configuration.properties[`MythicScribe.${key}`].default = map[key as keyof typeof map].default ?? map[key as keyof typeof map].values[0];
        console.log(`Wrote property MythicScribe.${key}` + (map[key as keyof typeof map].default ? ` with default ${map[key as keyof typeof map].default}` : ''));
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Wrote ${count} properties to package.json.`);
}
