import { openToolExternally } from '../common';

const aurafxLink = 'https://aurafx.vercel.app';
//const name = 'AuraFX by Sleepsweety';

export function openAuraFXWebview(): void {
    openToolExternally(aurafxLink);
    return;
}
