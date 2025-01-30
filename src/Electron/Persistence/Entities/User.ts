import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class User extends BaseEntity {

    @PrimaryColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    username!: string;

    @Column({ type: "text" })
    userTag!: string;

    //Will be removed in a bit and is not used, besides being called some places
    @Column({ type: "text", nullable: true })
    profilePictureUrl?: string;

    // Will be used.
    @Column({type: "blob", nullable: true})
    profilePicture?: Buffer;

    @Column({ type: "text", nullable: true })
    displayName?: string;
}