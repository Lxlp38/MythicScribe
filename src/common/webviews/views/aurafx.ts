import { getGenericConfig } from '@common/utils/configutils';
import Log from '@common/utils/logger';

import { externalToolWarning, openExternalWebview } from '../common';

export function openAuraFXWebview(): void {
    if (!!getGenericConfig('allowExternalTools') === false) {
        return externalToolWarning();
    }
    Log.warn(
        'Opening an External Tool: AuraFX.\n\n\nExternal Tools are not handled by MythicScribe, but by third parties.'
    );
    return openExternalWebview('AuraFX by Sleepsweety', 'https://aurafx.vercel.app/');
}
