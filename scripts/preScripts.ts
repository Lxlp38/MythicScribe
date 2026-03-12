import ScriptComposer from './ScriptComposer';
import { checkJsonFiles } from './suite/checkJsons';
import { generateEnumAtlas } from './suite/generateEnumAtlas';


const composer = new ScriptComposer({
    callbacks: [
        checkJsonFiles,
        generateEnumAtlas,
    ],
    name: 'Pre-Scripts',
});

composer.run();