import type { EmojiData, EmojiDataResolver } from 'frimousse';
import type { ShortcodeEntry } from './Shortcodes';

const SKIN_TONES = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const;
const COMPONENT_GROUP_KEY = 'component';
const FLAG_SUBGROUP_KEYS = ['country-flag', 'subdivision-flag'];
const EMOJI_FONT = "'Noto Color Emoji', sans-serif";

export type EmojiSkins = NonNullable<EmojiData['emojis'][number]['skins']>;

export type EmojiCatalog = {
    picker: EmojiData;
    shortcodes: ShortcodeEntry[];
    skinVariants: Map<string, string[]>;
};

let cached: Promise<EmojiCatalog> | null = null;

export function loadEmojiCatalog(): Promise<EmojiCatalog> {
    cached ??= buildEmojiCatalog().catch((error) => {
        cached = null;
        throw error;
    });
    return cached;
}

export const resolveEmojiData: EmojiDataResolver = async () => (await loadEmojiCatalog()).picker;

async function buildEmojiCatalog(): Promise<EmojiCatalog> {
    const [{ default: emojis }, { default: messages }, { default: shortcodes }] = await Promise.all([
        import('emojibase-data/en/data.json'),
        import('emojibase-data/en/messages.json'),
        import('emojibase-data/en/shortcodes/emojibase.json'),
        document.fonts.load(`16px ${EMOJI_FONT}`, '😀'),
    ]);

    const groups = messages.groups.filter((g) => g.key !== COMPONENT_GROUP_KEY);
    const flagSubgroups = new Set(
        messages.subgroups.filter((s) => FLAG_SUBGROUP_KEYS.includes(s.key)).map((s) => s.order),
    );

    const grouped = emojis.filter((e) => e.group !== undefined && groups.some((g) => g.order === e.group));
    const maxVersion = detectSupportedVersion(grouped);
    const flagsSupported = canRender('🇪🇺');

    const supported = grouped
        .filter((e) => e.version <= maxVersion)
        .filter((e) => flagsSupported || e.subgroup === undefined || !flagSubgroups.has(e.subgroup));

    return {
        picker: {
            locale: 'en',
            categories: groups.map((g) => ({ index: g.order, label: capitalize(g.message) })),
            skinTones: Object.fromEntries(
                messages.skinTones.map((t) => [t.key, capitalize(t.message)]),
            ) as EmojiData['skinTones'],
            emojis: supported.map((e) => ({
                emoji: e.emoji,
                category: e.group!,
                version: e.version,
                label: capitalize(e.label),
                tags: e.tags ?? [],
                skins: toSkins(e.skins),
            })),
        },
        shortcodes: supported.flatMap((e) => {
            const codes = shortcodes[e.hexcode];
            if (!codes) return [];
            return [
                {
                    emoji: e.emoji,
                    label: capitalize(e.label),
                    shortcodes: Array.isArray(codes) ? codes : [codes],
                    skins: toSkins(e.skins),
                },
            ];
        }),
        skinVariants: new Map(
            supported.flatMap((e) => {
                const skins = toSkins(e.skins);
                if (!skins) return [];
                const variants = [e.emoji, ...SKIN_TONES.flatMap((tone) => skins[tone] ?? [])];
                return variants.map((variant) => [variant, variants] as const);
            }),
        ),
    };
}

type EmojibaseEmoji = Awaited<typeof import('emojibase-data/en/data.json')>['default'][number];

function toSkins(skins: EmojibaseEmoji['skins']): EmojiSkins | undefined {
    const single = skins?.filter((s) => typeof s.tone === 'number');
    if (!single?.length) return undefined;
    return Object.fromEntries(single.map((s) => [SKIN_TONES[(s.tone as number) - 1], s.emoji])) as EmojiSkins;
}

function detectSupportedVersion(emojis: EmojibaseEmoji[]): number {
    const sampleByVersion = new Map<number, string>();
    for (const e of emojis) if (!sampleByVersion.has(e.version)) sampleByVersion.set(e.version, e.emoji);

    const versions = [...sampleByVersion.keys()].sort((a, b) => b - a);
    return versions.find((v) => canRender(sampleByVersion.get(v)!)) ?? versions[0] ?? Infinity;
}

let context: CanvasRenderingContext2D | null | undefined;

function canRender(emoji: string): boolean {
    context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!context) return true;

    const size = 2;
    context.canvas.width = size;
    context.canvas.height = size;
    context.font = `${size}px ${EMOJI_FONT}`;
    context.textBaseline = 'middle';
    if (context.measureText(emoji).width >= size * 2) return false;

    const draw = (colour: string) => {
        context!.clearRect(0, 0, size, size);
        context!.fillStyle = colour;
        context!.fillText(emoji, 0, 0);
        return context!.getImageData(0, 0, size, size).data;
    };
    const blue = draw('#00f');
    const red = draw('#f00');
    return blue.every((value, i) => value === red[i]);
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
