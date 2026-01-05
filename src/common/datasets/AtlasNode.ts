import atlasJson from '../../../data/atlas.json';
import { AtlasDirectoryNode, AtlasFileNodeImpl, AtlasRootNodeImpl } from './types/AtlasNode';

export const atlasDataNode = new AtlasRootNodeImpl(atlasJson as AtlasDirectoryNode);

export const atlasJsonFileNode = new AtlasFileNodeImpl(
    {
        name: 'atlas.json',
        type: 'file',
        hash: 'static-internal',
    },
    'data'
);
