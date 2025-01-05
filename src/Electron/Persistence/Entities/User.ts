import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    username!: string;

    @Column({ type: "text" })
    userTag!: string;

    @Column({ type: "text" })
    profilePictureUrl!: string;

    @Column({ type: "text" })
    displayName!: string;
}