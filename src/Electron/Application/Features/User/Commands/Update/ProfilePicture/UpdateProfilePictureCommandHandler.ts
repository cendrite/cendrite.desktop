import {UpdateProfilePictureCommand} from "./UpdateProfilePictureCommand.js";
import {UpdateProfilePictureDto} from "./UpdateProfilePictureDto.js";
import {Handler} from "../../../../../Mediator/Handler.js";
import { Result } from "../../../../../../../Shared/Result/Result.js";
import {app, dialog} from "electron";
import {ErrorMessage} from "../../../../../../../Shared/Result/ErrorMessage.js";
import * as fs from "node:fs";
import {UserRepository} from "../../../../../../Persistence/Repositories/UserRepository.js";
export class UpdateProfilePictureCommandHandler implements Handler<UpdateProfilePictureCommand, UpdateProfilePictureDto> {

    private readonly mainWindow: Electron.BrowserWindow;
    constructor(mainWindow: Electron.BrowserWindow){
        this.mainWindow = mainWindow;
    }

    public async handle(request: UpdateProfilePictureCommand): Promise<Result<UpdateProfilePictureDto>> {
        try{
            const repository = new UserRepository()

            const {canceled, filePaths} = await dialog.showOpenDialog(this.mainWindow, {
                title: "Select a profile picture",
                properties: ['openFile'],
                filters: [{ name: 'Images', extensions: ['jpg', 'png'] }],
                defaultPath: app.getPath("home")
            });

            if(canceled || !filePaths || filePaths.length === 0){
                return Result.fail<UpdateProfilePictureDto>(new ErrorMessage(null, "No file selected"));
            }

            const filePath = filePaths[0];
            const fileBuffer = fs.readFileSync(filePath);

            await repository.update({profilePicture: fileBuffer});

            const base64Image = 'data:image/png;base64,' + fileBuffer.toString('base64');

            const dto = UpdateProfilePictureDto.MapFrom(base64Image);

            return Result.success(dto);

        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('UpdateProfilePicture Failed:', errorMessage);
            return Result.fail<UpdateProfilePictureDto>(new ErrorMessage(null, "UpdateProfilePicture Failed"));
        }
    }
}