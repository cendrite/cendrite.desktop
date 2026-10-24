import { nativeImage, NativeImage } from 'electron';
import { IMediaMetadataStripper } from '#electron/Application/Contracts/Services/IMediaMetadataStripper';

export class MediaMetadataStripper implements IMediaMetadataStripper {
    private static readonly JpegQuality = 90;
    private static readonly OrientationTag = 0x0112;

    public strip(content: Buffer, mimeType: string): Buffer {
        if (mimeType === 'image/jpeg') {
            const image = this.decode(content);
            return this.orient(image, this.readJpegOrientation(content)).toJPEG(MediaMetadataStripper.JpegQuality);
        }

        if (mimeType === 'image/png') {
            return this.decode(content).toPNG();
        }

        return content;
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

            if (u16(entry) === MediaMetadataStripper.OrientationTag) {
                const orientation = u16(entry + 8);
                return orientation >= 1 && orientation <= 8 ? orientation : 1;
            }
        }

        return 1;
    }
}
