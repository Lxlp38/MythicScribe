import { attributeAliasUsedInCompletions, CustomDatasetElementType, CustomDatasetSource, datasetSource, MinecraftVersions } from './../../src/common/packageData';
import * as fs from 'fs';
import * as path from 'path';

const map = {
    'minecraftVersion': MinecraftVersions,
    'datasetSource': Object.values(datasetSource),
    'attributeAliasUsedInCompletions': Object.values(attributeAliasUsedInCompletions),
    'customDatasets.elementType': Object.values(CustomDatasetElementType),
    'customDatasets.source': Object.values(CustomDatasetSource),
}

export function writePackageData(){
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(packageJson.contributes.configuration.properties[`MythicScribe.customDatasets`].items.properties);
    
    for (const key in map) {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            packageJson.contributes.configuration.properties[`MythicScribe.${parent}`].items.properties[child].enum = map[key as keyof typeof map];
            continue;
        }
        packageJson.contributes.configuration.properties[`MythicScribe.${key}`].enum = map[key as keyof typeof map];
        packageJson.contributes.configuration.properties[`MythicScribe.${key}`].default = map[key as keyof typeof map][0];
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
