import { KeyPairDto } from '../../../Dtos/KeyPairDto.js';

export class CreatePreKeyCommand implements MediatorRequest {
    public type = CreatePreKeyCommand.name;
    public constructor(
        public readonly preKeyId: number,
        public readonly keys: KeyPairDto,
    ) { }
}
