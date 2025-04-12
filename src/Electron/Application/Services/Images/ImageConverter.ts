
export class ImageConverter
{
    public static async base64ToBuffer(base64: string): Promise<Buffer>
    {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }

    public static async bufferToBase64(buffer: Buffer): Promise<string>
    {
        const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
        return base64Image;
    }
}