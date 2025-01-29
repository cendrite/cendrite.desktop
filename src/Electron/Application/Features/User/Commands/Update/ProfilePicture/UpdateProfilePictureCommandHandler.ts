import {UpdateProfilePictureCommand} from "./UpdateProfilePictureCommand.js";
import {UpdateProfilePictureDto} from "./UpdateProfilePictureDto.js";
import {Handler} from "../../../../../Mediator/Handler.js";
import { Result } from "../../../../../../../Shared/Result/Result.js";
import {dialog} from "electron";
import {ErrorMessage} from "../../../../../../../Shared/Result/ErrorMessage.js";
export class UpdateProfilePictureCommandHandler implements Handler<UpdateProfilePictureCommand, UpdateProfilePictureDto> {

    private readonly mainWindow: Electron.BrowserWindow;
    constructor(mainWindow: Electron.BrowserWindow){
        this.mainWindow = mainWindow;
    }

    public async handle(request: UpdateProfilePictureCommand): Promise<Result<UpdateProfilePictureDto>> {
        try{

            const {canceled, filePaths} = await dialog.showOpenDialog(this.mainWindow, {
                title: "Select a profile picture",
                properties: ['openFile'],
                filters: [{ name: 'Images', extensions: ['jpg', 'png'] }]
            });

            if(canceled){
                return Result.fail<UpdateProfilePictureDto>(new ErrorMessage(null, "No file selected"));
            }

            const filePath = filePaths[0];

            return Result.success(new UpdateProfilePictureDto());
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('UpdateProfilePicture Failed:', errorMessage);
            return Result.fail<UpdateProfilePictureDto>(new ErrorMessage(null, "UpdateProfilePicture Failed"));
        }
    }
}