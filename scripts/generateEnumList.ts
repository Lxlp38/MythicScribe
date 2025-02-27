import * as fs from 'fs';
import * as path from 'path';
import { local, volatile } from '../src/common/datasets/enumSources';

interface enumInfo { id: string, path: string, volatile: boolean }

export function generateEnumList() {
    const enums: enumInfo[] = [];
    iterateOverEnum(enums, local, false);
    iterateOverEnum(enums, volatile, true);

    const outputPath = path.join(__dirname, '../generated/enumList/enumList');
    const outputPath_md = outputPath + '.md';
    const outputPath_json = outputPath + '.json';
    const outputPath_txt = outputPath + '.txt';

    const mdFileContent = enums
        .map(
            (value) =>
                `# \`${value.id}\`\n### Path: \`${value.path}\`\n### Volatile: \`${value.volatile}\``
        )
        .join('\n\n');
    
    fs.mkdirSync(path.dirname(outputPath_md), { recursive: true });
    fs.writeFileSync(outputPath_md, mdFileContent, 'utf8');
    fs.writeFileSync(outputPath_json, JSON.stringify(enums, null, 2), 'utf8');
    fs.writeFileSync(outputPath_txt, enums.map((value) => value.id).join('\n'), 'utf8');
}

function iterateOverEnum(list: enumInfo[], source: (string | string[])[], vol: boolean) {
    source.forEach((item) => {
        if (Array.isArray(item)) {
            const identifier = item[0];
            const path = item[1];
            list.push({ id: identifier.toLowerCase(), path, volatile: vol });
        } else {
            const identifier = item.split('/').pop()!.split('.')[0];
            list.push({ id: identifier.toLowerCase(), path: item, volatile: vol });
        }
    });
}