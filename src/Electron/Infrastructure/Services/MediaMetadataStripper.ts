import { IMetaDataStripper } from '#electron/Application/Contracts/Services/IMetaDataStripper';
import { nativeImage, NativeImage } from 'electron';

export class MetaDataStripper implements IMetaDataStripper {
    private static readonly JpegQuality = 90;
    private static readonly OrientationTag = 0x0112;

    private static readonly GifExtension = 0x21;
    private static readonly GifImage = 0x2c;
    private static readonly GifTrailer = 0x3b;
    private static readonly GifGraphicControl = 0xf9;
    private static readonly GifApplication = 0xff;
    // Only the looping extensions affect playback; every other application block (XMP, editor data) is metadata.
    private static readonly GifLoopApplications = ['NETSCAPE2.0', 'ANIMEXTS1.0'];

    public strip(content: Buffer, mimeType: string): Buffer {
        if (mimeType === 'image/jpeg') {
            const image = this.decode(content);
            return this.orient(image, this.readJpegOrientation(content)).toJPEG(MetaDataStripper.JpegQuality);
        }

        if (mimeType === 'image/png') {
            return this.decode(content).toPNG();
        }

        // Re-encoding through nativeImage would keep only the first frame, so GIFs are filtered block by block.
        if (mimeType === 'image/gif') {
            return this.stripGif(content);
        }

        return content;
    }

    // Keeps the frames and their timing/looping; drops comments, plain-text and non-loop application
    // blocks, and anything appended after the trailer. Truncated blocks are rejected.
    private stripGif(gif: Buffer): Buffer {
        const signature = gif.toString('latin1', 0, 6);
        if (signature !== 'GIF87a' && signature !== 'GIF89a') {
            throw new Error('Failed to decode image');
        }

        const kept: Buffer[] = [];
        const take = (start: number, end: number) => {
            if (end > gif.length) throw new Error('Failed to decode image');
            kept.push(gif.subarray(start, end));
            return end;
        };

        let offset = take(0, 13);
        offset = take(offset, offset + this.gifColorTableSize(gif[10]));

        while (offset < gif.length) {
            const introducer = gif[offset];

            if (introducer === MetaDataStripper.GifTrailer) {
                take(offset, offset + 1);
                return Buffer.concat(kept);
            }

            if (introducer === MetaDataStripper.GifImage) {
                const descriptorEnd = offset + 10;
                if (descriptorEnd > gif.length) break;
                const tableEnd = descriptorEnd + this.gifColorTableSize(gif[offset + 9]);
                // +1 for the LZW minimum code size byte that precedes the data sub-blocks.
                offset = take(offset, this.skipGifSubBlocks(gif, tableEnd + 1));
                continue;
            }

            if (introducer === MetaDataStripper.GifExtension) {
                const end = this.skipGifSubBlocks(gif, offset + 2);
                if (this.keepGifExtension(gif, offset)) take(offset, end);
                offset = end;
                continue;
            }

            break;
        }

        // Missing trailer or an unknown block: end the stream there, as decoders do, discarding the rest.
        kept.push(Buffer.of(MetaDataStripper.GifTrailer));
        return Buffer.concat(kept);
    }

    private keepGifExtension(gif: Buffer, offset: number): boolean {
        const label = gif[offset + 1];
        if (label === MetaDataStripper.GifGraphicControl) return true;
        if (label !== MetaDataStripper.GifApplication || gif[offset + 2] !== 11) return false;

        const identifier = gif.toString('latin1', offset + 3, offset + 14);
        return MetaDataStripper.GifLoopApplications.includes(identifier);
    }

    private gifColorTableSize(packed: number): number {
        return packed & 0x80 ? 3 * 2 ** ((packed & 0x07) + 1) : 0;
    }

    // Returns the offset just past the zero-length block that terminates a run of sub-blocks.
    private skipGifSubBlocks(gif: Buffer, offset: number): number {
        while (offset < gif.length) {
            const size = gif[offset];
            offset += 1 + size;
            if (size === 0) return offset;
        }
        throw new Error('Failed to decode image');
    }

    private decode(content: Buffer): NativeImage {
        const image = nativeImage.createFromBuffer(content);
        if (image.isEmpty()) {
            throw new Error('Failed to decode image');
        }
        return image;
    }

    private orient(image: NativeImage, orientation: number): NativeImage {
        if (orientation === 1) return image;

        const { width, height } = image.getSize();
        const bitmap = image.toBitmap();
        const source = new Uint32Array(bitmap.buffer.slice(bitmap.byteOffset, bitmap.byteOffset + bitmap.length));
        const swap = orientation >= 5;
        const targetWidth = swap ? height : width;
        const targetHeight = swap ? width : height;
        const target = new Uint32Array(source.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const [tx, ty] = this.transform(orientation, x, y, width, height);
                target[ty * targetWidth + tx] = source[y * width + x];
            }
        }

        return nativeImage.createFromBitmap(Buffer.from(target.buffer), { width: targetWidth, height: targetHeight });
    }

    private transform(orientation: number, x: number, y: number, width: number, height: number): [number, number] {
        switch (orientation) {
            case 2:
                return [width - 1 - x, y];
            case 3:
                return [width - 1 - x, height - 1 - y];
            case 4:
                return [x, height - 1 - y];
            case 5:
                return [y, x];
            case 6:
                return [height - 1 - y, x];
            case 7:
                return [height - 1 - y, width - 1 - x];
            case 8:
                return [y, width - 1 - x];
            default:
                return [x, y];
        }
    }

    private readJpegOrientation(jpeg: Buffer): number {
        if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return 1;

        let offset = 2;
        while (offset + 4 <= jpeg.length && jpeg[offset] === 0xff) {
            const marker = jpeg[offset + 1];
            if (marker === 0xda || marker === 0xd9) return 1;

            const length = jpeg.readUInt16BE(offset + 2);
            const segmentEnd = Math.min(offset + 2 + length, jpeg.length);

            if (marker === 0xe1 && jpeg.toString('latin1', offset + 4, offset + 10) === 'Exif\0\0') {
                return this.readTiffOrientation(jpeg, offset + 10, segmentEnd);
            }

            offset += 2 + length;
        }

        return 1;
    }

    private readTiffOrientation(buffer: Buffer, tiff: number, end: number): number {
        if (tiff + 8 > end) return 1;

        const littleEndian = buffer.toString('latin1', tiff, tiff + 2) === 'II';
        const u16 = (offset: number) => (littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset));
        const u32 = (offset: number) => (littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset));

        const ifd = tiff + u32(tiff + 4);
        if (ifd + 2 > end) return 1;

        const entries = u16(ifd);
        for (let i = 0; i < entries; i++) {
            const entry = ifd + 2 + i * 12;
            if (entry + 12 > end) return 1;

            if (u16(entry) === MetaDataStripper.OrientationTag) {
                const orientation = u16(entry + 8);
                return orientation >= 1 && orientation <= 8 ? orientation : 1;
            }
        }

        return 1;
    }
}
