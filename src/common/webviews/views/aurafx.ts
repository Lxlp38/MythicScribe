import { openToolExternally } from '../common';

const aurafxLink = 'https://aurafx.vercel.app?source=MythicScribe';
//const name = 'AuraFX by Sleepsweety';

export function openAuraFXWebview(): void {
    // if (!!getGenericConfig('allowExternalTools') === false) {
    //     return externalToolWarning(aurafxLink);
    // }
    openToolExternally(aurafxLink);
    return;
}
