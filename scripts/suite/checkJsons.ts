import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(__dirname, '../../data');

type Score = {
    valid: number;
    invalid: number;
};

function checkJsons(dir: string, score: Score) {
	const files = fs.readdirSync(dir);

	files.forEach(file => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			checkJsons(filePath, score);
		} else if (file.endsWith('.json')) {
			try {
				const content = fs.readFileSync(filePath, 'utf-8');
				JSON.parse(content);
				//console.log(`✅ ${filePath} is valid.`);
                score.valid++;
			} catch (err) {
				console.error(`❌ Error in ${filePath}:`, err);
                score.invalid++;
			}
		}
	});
}

export function checkJsonFiles() {
    console.log('Checking JSON files in data directory:', dataDir);
    const score = {
        valid: 0,
        invalid: 0
    }
    checkJsons(dataDir, score);
    
    console.log(`Summary: ${score.valid} valid JSON files, ${score.invalid} invalid JSON files.`);
    if (score.invalid > 0) {
        console.error('❌ Please fix the invalid JSON files listed above.');
        throw new Error('Invalid JSON files found.');
    } else {
        console.log('✅ All JSON files are valid!');
    }

    return score;
}
