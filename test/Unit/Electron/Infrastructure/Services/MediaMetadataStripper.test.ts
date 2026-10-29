import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ nativeImage: {} }));

const { MetaDataStripper } =
    await import('../../../../../src/Electron/Infrastructure/Services/MediaMetadataStripper.js');

const bytes = (...parts: (number[] | string)[]) =>
    Buffer.concat(parts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));

// 1x1 canvas with a 2-colour global table.
const header = bytes('GIF89a', [1, 0, 1, 0, 0x80, 0, 0], [0, 0, 0, 255, 255, 255]);
const loop = bytes([0x21, 0xff, 11], 'NETSCAPE2.0', [3, 1, 0, 0, 0]);
const graphicControl = bytes([0x21, 0xf9, 4, 0, 10, 0, 0, 0]);
const frame = bytes([0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0], [2, 2, 0x4c, 0x01, 0]);
const frameWithLocalTable = bytes([0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0x80], [1, 2, 3, 4, 5, 6], [2, 2, 0x4c, 0x01, 0]);
const comment = bytes([0x21, 0xfe, 5], 'hello', [0]);
const xmp = bytes([0x21, 0xff, 11], 'XMP DataXMP', [6], '<x:gps', [0]);
const trailer = bytes([0x3b]);

const sut = new MetaDataStripper();
const strip = (gif: Buffer) => sut.strip(gif, 'image/gif');

describe('stripping GIF metadata', () => {
    test('keeps an animated GIF intact', () => {
        const gif = bytes(header, loop, graphicControl, frame, graphicControl, frameWithLocalTable, trailer);

        expect(strip(gif)).toEqual(gif);
    });

    test('drops comments and non-loop application blocks', () => {
        const gif = bytes(header, comment, loop, xmp, graphicControl, frame, comment, trailer);

        expect(strip(gif)).toEqual(bytes(header, loop, graphicControl, frame, trailer));
    });

    test('drops data hidden after the trailer', () => {
        const gif = bytes(header, frame, trailer, 'secret payload');

        expect(strip(gif)).toEqual(bytes(header, frame, trailer));
    });

    test('terminates a GIF that is missing its trailer', () => {
        expect(strip(bytes(header, frame))).toEqual(bytes(header, frame, trailer));
    });

    test('works for GIF87a without a global colour table', () => {
        const gif = bytes('GIF87a', [1, 0, 1, 0, 0, 0, 0], frameWithLocalTable, trailer);

        expect(strip(gif)).toEqual(gif);
    });

    test.each([
        ['not a GIF', bytes('PNG...', [0, 0, 0, 0, 0, 0, 0, 0])],
        ['a truncated header', bytes('GIF89a', [1, 0])],
        ['a truncated colour table', bytes('GIF89a', [1, 0, 1, 0, 0x80, 0, 0], [0, 0])],
        ['a truncated frame', bytes(header, [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0], [2, 2, 0x4c])],
        ['an unterminated extension', bytes(header, [0x21, 0xfe, 5], 'hel')],
    ])('rejects %s', (_, gif) => {
        expect(() => strip(gif)).toThrow('Failed to decode image');
    });

    test('leaves other media untouched', () => {
        const audio = bytes('ID3 tags here');

        expect(sut.strip(audio, 'audio/mpeg')).toBe(audio);
    });
});
