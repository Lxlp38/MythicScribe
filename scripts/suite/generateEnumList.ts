import * as fs from 'fs';
import * as path from 'path';
import { localEnums, scriptedEnums, attributeSpecialValues, atlasRegistry } from './../../src/common/datasets/enumSources';
import { MinecraftVersions } from '../../src/common/packageData';

interface enumInfo { id: string, path: string | null, type: string }

enum EnumType {
    Static = 'Static',
    Volatile = 'Volatile',
    Scripted = 'Scripted'
}

export function generateEnumList() {
    console.log('Generating enum list...');
    const enums: enumInfo[] = [];
    const targetVersion = MinecraftVersions[0]; // latest version
    iterateOverEnum(enums, localEnums.map(file => file.path), EnumType.Static);
    iterateOverEnum(enums, atlasRegistry.getNode('versions')!.getNode(targetVersion)!.getFiles().map(file => file.identifier), EnumType.Volatile);
    iterateOverEnum(enums, Object.keys(scriptedEnums), EnumType.Scripted);
    iterateOverEnum(enums, Object.keys(attributeSpecialValues), EnumType.Scripted);

    const outputPath = path.join(__dirname, '../../generated/enumList/enumList');
    const outputPath_md = outputPath + '.md';
    const outputPath_json = outputPath + '.json';
    const outputPath_txt = outputPath + '.txt';

    const mdFileContent = enums
        .map(
            (value) =>
                `# \`${value.id}\`\n### Path: \`${value.type === EnumType.Scripted ? 'null' : value.path}\`\n### Type: \`${value.type}\``
        )
        .join('\n\n');
    
    fs.mkdirSync(path.dirname(outputPath_md), { recursive: true });
    fs.writeFileSync(outputPath_md, mdFileContent, 'utf8');
    fs.writeFileSync(outputPath_json, JSON.stringify(enums, null, 2), 'utf8');
    fs.writeFileSync(outputPath_txt, enums.map((value) => value.id).join('\n'), 'utf8');

    console.log(`Generated a list containing ${enums.length} enums.`);
}

function iterateOverEnum(list: enumInfo[], source: string[], type: string) {
    source.forEach((item) => {
        let identifier = item.split('/').pop();
        identifier = identifier ? identifier.split('.')[0] : item;
        list.push({ id: identifier.toLowerCase(), path: type === EnumType.Scripted ? null : item, type: type });
    });
}