import { LinkParameters, openToolExternally } from '../common';

const link = 'https://minecraftsounds.com';

export function openMinecraftSoundsWebview(sound?: string, anchor?: LinkParameters): void {
    openToolExternally(link, sound ? { search: sound } : undefined, anchor);
    return;
}
