export interface AvatarTemplate {
    id: string;
    from: string;
    to: string;
}

export const avatarTemplates: AvatarTemplate[] = [
    { id: 'clay', from: '#D9B39A', to: '#9A6F86' },
    { id: 'sand', from: '#DCCB9C', to: '#7F9A7E' },
    { id: 'sage', from: '#BACAA0', to: '#5F8A89' },
    { id: 'spruce', from: '#A3CBC1', to: '#61709E' },
    { id: 'dusk', from: '#B3C6DD', to: '#7D6CA3' },
    { id: 'lavender', from: '#C9B8DD', to: '#A06A8C' },
    { id: 'mauve', from: '#DDB1C1', to: '#A6735F' },
    { id: 'slate', from: '#C3CAD2', to: '#5E6B87' },
];

export function initialOf(name: string): string {
    const first = [...name.trim()][0];
    return first ? first.toUpperCase() : '?';
}

export function templateBackground(template: AvatarTemplate): string {
    return `linear-gradient(135deg, ${template.from}, ${template.to})`;
}

export async function renderAvatarTemplate(initial: string, template: AvatarTemplate, size = 512): Promise<Uint8Array> {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, template.from);
    gradient.addColorStop(1, template.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.font = `600 ${Math.round(size * 0.44)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

    const metrics = ctx.measureText(initial);
    const y = size / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    ctx.fillText(initial, size / 2, y);

    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render the picture'))), 'image/png'),
    );

    return new Uint8Array(await blob.arrayBuffer());
}
