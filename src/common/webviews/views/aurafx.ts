import { getGenericConfig } from '@common/utils/configutils';

import { externalToolOpened as openExternalTool, externalToolWarning } from '../common';

const aurafxLink = 'https://aurafx.vercel.app/';
const name = 'AuraFX by Sleepsweety';

export function openAuraFXWebview(): void {
    if (!!getGenericConfig('allowExternalTools') === false) {
        return externalToolWarning(aurafxLink);
    }
    openExternalTool(name, aurafxLink);
    return;
}
