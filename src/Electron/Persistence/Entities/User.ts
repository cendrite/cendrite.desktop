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

    @Column({ type: "text", nullable: true })
    profilePictureUrl?: string;

    @Column({ type: "text", nullable: true })
    displayName?: string;
}