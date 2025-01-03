export class SignNonceRequest implements MediatorRequest {
    public readonly type = "SignNonceRequest";
    public nonce!: string;
}