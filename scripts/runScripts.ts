import ScriptComposer from './ScriptComposer';
import { generateEnumList } from './suite/generateEnumList';
import { writePackageData } from './suite/writePackageData';

const composer = new ScriptComposer({
    callbacks: [
        generateEnumList,
        writePackageData,
    ],
    name: 'Run Scripts',
});

composer.run();