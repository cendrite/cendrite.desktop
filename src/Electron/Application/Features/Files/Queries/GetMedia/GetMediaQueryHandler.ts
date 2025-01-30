import {GetMediaQuery, MediaType} from "./GetMediaQuery.js";
import {GetMediaDto} from "./GetMediaDto.js";
import {Handler} from "../../../../Mediator/Handler.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import * as fs from "node:fs";
import {dialog, BrowserWindow, app} from "electron";

export class GetMediaQueryHandler implements Handler<GetMediaQuery, GetMediaDto> {
    private readonly mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow){
        this.mainWindow = mainWindow;
    }

    public async handle(request: GetMediaQuery): Promise<Result<GetMediaDto>> {

        try{
            const {canceled, filePaths} = await dialog.showOpenDialog(this.mainWindow, {
                title: "Select a media file",
                properties: ['openFile'],
                filters: [{ name: 'Media', extensions: this.SelectExtension(request.mediaType) }],
                defaultPath: app.getPath("desktop")
            });

            if(canceled || !filePaths || filePaths.length === 0){
                return Result.fail<GetMediaDto>(new ErrorMessage(null, "No file selected"));
            }

            const filePath = filePaths[0];
            const fileBuffer = fs.readFileSync(filePath);

            const base64Image = `data:image/png;base64,${fileBuffer.toString("base64")}`;
            const dto = GetMediaDto.MapFrom(base64Image);

            return Result.success(dto);
        }
        catch(error: unknown){
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('GetMedia Failed:', errorMessage);
            return Result.fail<GetMediaDto>(new ErrorMessage(null, "GetMedia Failed"));
        }
    }

    private SelectExtension(mediaType: MediaType): string[]{
        return mediaType === MediaType.Image ? ['png', 'jpg', 'jpeg'] : ['png', 'jpg', 'jpeg','mp4', 'webm', 'ogg', 'wav', 'mp3', 'flac'];
    }
}