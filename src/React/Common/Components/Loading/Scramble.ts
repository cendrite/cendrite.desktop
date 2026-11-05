const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function cipherOf(text: string, random = Math.random): string {
    return Array.from(text, () => glyphs[Math.floor(random() * glyphs.length)]).join('');
}

export function scrambleFrame(from: string, to: string, progress: number, random = Math.random, band = 4): string {
    const length = Math.max(from.length, to.length);
    const settled = Math.floor(Math.min(Math.max(progress, 0), 1) * length);

    let out = '';
    for (let i = 0; i < length; i++) {
        if (i < settled) out += to[i] ?? ' ';
        else if (i < settled + band) out += glyphs[Math.floor(random() * glyphs.length)];
        else out += from[i] ?? ' ';
    }
    return progress >= 1 ? to : out;
}
