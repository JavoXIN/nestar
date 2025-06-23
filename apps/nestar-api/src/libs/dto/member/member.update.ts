import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, Length } from "class-validator";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";

@InputType()
export class MemberUpdate {

    @IsNotEmpty()
    @Field(() => String)
    _id?: Object; //104-dars 30:00 daqiqa:(2025.06.23)"?" ni qoshib qoydim chunki member.resolver.ts dagi updateMember dagi delete input._id xato chiqayotgan edi 

    @IsOptional()
    @Field(() => MemberType, {nullable: true})
    memberType?: MemberType;

    @IsOptional()
    @Field(() => MemberStatus, {nullable: true})
    memberStatus?: MemberStatus;

    @IsOptional()
    @Field(() => String, {nullable: true})
    memberPhone?: string;

    @IsOptional()
    @Length(3,12)
    @Field(() => String, {nullable: true})
    memberNick?: string;

    @IsOptional()
    @Length(5,12)
    @Field(() => String, {nullable: true})
    memberPassword?: string;

    @IsOptional()
    @Length(3,100)
    @Field(() => String, {nullable: true})
    memberFullName?: string;

    @IsOptional()
    @Field(() => String, {nullable: true})
    memberImage?: string;

    @IsOptional()
    @Field(() => String, {nullable: true})
    memberAddress?: string;

    @IsOptional()
    @Field(() => String, {nullable: true})
    memberDesc?: string;

    deleteAt?: Date;


}
