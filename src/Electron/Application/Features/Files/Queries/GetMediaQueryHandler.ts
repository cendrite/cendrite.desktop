import * as fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dialog, BrowserWindow, app } from 'electron';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GetMediaQuery, MediaType } from '#shared/Files/GetMedia';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { MediaContract } from '#shared/Models/MediaContract';
import { IMediaMetadataStripper } from '#electron/Application/Contracts/Services/IMediaMetadataStripper';

export class GetMediaQueryHandler implements Handler<GetMediaQuery, MediaContract[]> {
    private readonly mainWindow: BrowserWindow;
    private readonly mediaMetadataStripper: IMediaMetadataStripper;

    constructor(mainWindow: BrowserWindow, mediaMetadataStripper: IMediaMetadataStripper) {
        this.mainWindow = mainWindow;
        this.mediaMetadataStripper = mediaMetadataStripper;
    }

    public async handle(request: GetMediaQuery): Promise<Result<MediaContract[]>> {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
                title: 'Select a media file',
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: 'Media', extensions: this.SelectExtension(request.mediaType) }],
                defaultPath: app.getPath('desktop'),
            });

            if (canceled || !filePaths || filePaths.length === 0) {
                return Result.fail<MediaContract[]>(new ErrorMessage(null, 'No file selected'));
            }

            const media = filePaths.map((filePath) => this.ToMediaDto(filePath));

            return Result.success(media);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('GetMedia Failed:', errorMessage);
            return Result.fail<MediaContract[]>(new ErrorMessage(null, 'GetMedia Failed'));
        }
    }

    private ToMediaDto(filePath: string): MediaContract {
        const fileExtension = filePath.split('.').pop()?.toLowerCase() ?? '';
        const mime = this.MimeForExtension(fileExtension);
        const content = this.mediaMetadataStripper.strip(fs.readFileSync(filePath), mime);

        return new MediaContract(randomUUID(), mime, content);
    }

    private SelectExtension(mediaType: MediaType): string[] {
        return mediaType === MediaType.Image
            ? ['png', 'jpg', 'jpeg']
            : ['png', 'jpg', 'jpeg', 'mp4', 'webm', 'ogg', 'wav', 'mp3', 'flac'];
    }

    private MimeForExtension(extension: string): string {
        const mimeByExtension: Record<string, string> = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            mp4: 'video/mp4',
            webm: 'video/webm',
            ogg: 'audio/ogg',
            wav: 'audio/wav',
            mp3: 'audio/mpeg',
            flac: 'audio/flac',
        };
        return mimeByExtension[extension] ?? 'application/octet-stream';
    }
}
