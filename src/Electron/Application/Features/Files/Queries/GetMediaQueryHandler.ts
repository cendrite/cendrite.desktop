import * as fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dialog, BrowserWindow, app } from 'electron';
import { Handler } from '../../../Mediator/Handler.js';
import { GetMediaQuery, MediaType } from '../Contracts/GetMedia.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { MediaContract } from '../../../Contracts/Models/MediaContract.js';

export class GetMediaQueryHandler implements Handler<GetMediaQuery, MediaContract[]> {
    private readonly mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
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
        const content = fs.readFileSync(filePath);
        const mime = this.MimeForExtension(fileExtension);

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
