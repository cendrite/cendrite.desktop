export class IdentityKeys {
  id: number;
  registrationId: number;
  identityKeyPublic: Buffer;
  identityKeyPrivate: Buffer;
  createdAt!: Date;

  constructor(
    id: number,
    registrationId: number,
    identityKeyPublic: Buffer,
    identityKeyPrivate: Buffer,
  ) {
    this.id = id;
    this.registrationId = registrationId;
    this.identityKeyPublic = identityKeyPublic;
    this.identityKeyPrivate = identityKeyPrivate;
  }
}
