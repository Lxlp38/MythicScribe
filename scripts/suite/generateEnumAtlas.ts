import * as path from "path";
import * as fs from "fs";
import { AtlasNode } from "../../src/common/datasets/enumSources";

function buildTree(dirPath: string): AtlasNode {
    const node: AtlasNode = {
        name: path.basename(dirPath),
        type: "directory",
        children: []
    };

    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const entryStat = fs.statSync(fullPath);
        if (entryStat.isDirectory()) {
            node.children!.push(buildTree(fullPath));
        } else {
            node.children!.push({
                name: entry,
                type: "file"
            });
        }
    }

    return node;
}

function run(dir: string): AtlasNode | null {
    if (!dir) {
        console.error("Please provide a directory path.");
        return null;
    }

    const tree = buildTree(path.resolve(dir));
    return tree;
}

export function generateEnumAtlas() {
    const dir = path.join(__dirname, '../../data');
    const previousJsonPath = path.join(__dirname, '../../data/atlas.json');
    // Remove previous atlas if it exists
    if (fs.existsSync(previousJsonPath)) {
        fs.unlinkSync(previousJsonPath);
    }

    const node = run(dir);
    if (node) {
        const outputPath = path.join(__dirname, '../../src/common/datasets/atlas.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(node, null, undefined), 'utf8');
        console.log(`Enum atlas generated at ${outputPath}`);
    }
}
