import * as fs from 'fs';
import * as path from 'path';
import { localEnums, volatileEnums, scriptedEnums } from '../src/common/datasets/enumSources';

interface enumInfo { id: string, path: string, type: string }

enum EnumType {
    Static = 'Static',
    Volatile = 'Volatile',
    Scripted = 'Scripted'
}

export function generateEnumList() {
    const enums: enumInfo[] = [];
    iterateOverEnum(enums, localEnums, EnumType.Static);
    iterateOverEnum(enums, volatileEnums, EnumType.Volatile);
    iterateOverEnum(enums, Object.keys(scriptedEnums), EnumType.Scripted);

    const outputPath = path.join(__dirname, '../generated/enumList/enumList');
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
}

function iterateOverEnum(list: enumInfo[], source: (string | string[])[], type: string) {
    source.forEach((item) => {
        if (Array.isArray(item)) {
            const identifier = item[0];
            const path = item[1];
            list.push({ id: identifier.toLowerCase(), path, type: type });
        } else {
            let identifier = item.split('/').pop();
            identifier = identifier ? identifier.split('.')[0] : item;
            list.push({ id: identifier.toLowerCase(), path: item, type: type });
        }
    });
}