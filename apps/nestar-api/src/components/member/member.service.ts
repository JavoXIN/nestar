import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { ViewService } from '../view/view.service';
import { T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';


@Injectable()
export class MemberService {
    constructor(
        @InjectModel('Member') private readonly memberModel: Model<Member>, 
    private authService: AuthService,
    private viewService: ViewService, 
) {}

    public async signup(input: MemberInput): Promise<Member> {
        input.memberPassword = await this.authService.hashPassword(input.memberPassword)

        try {
            const result = await this.memberModel.create(input);
            result.accessToken = await this.authService.createToken(result);
            return result;
        } catch (err) {
            console.log("Error, Service.model: ", err.message);
            throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
        }
    }

    public async login(input: LoginInput): Promise<Member> {
        try {
            const {memberNick, memberPassword} = input;
            console.log("Login input: ", input);
            const response: null | Member = await this.memberModel
                .findOne({memberNick: memberNick})
                .select('+memberPassword')
                .exec();
            
            if(!response || response.memberStatus === MemberStatus.DELETE) {
                throw new InternalServerErrorException(Message.NO_MEMBER_NICK)
            } else if(response.memberStatus === MemberStatus.BLOCK) {
                throw new InternalServerErrorException(Message.BLOCKED_USER);
            }

            const isMatch = await this.authService.comparePasswords(input.memberPassword, 
                response.memberPassword as string); 
                //aslida response.memberPassword bo'lishi kerak lekin xato korsatgani uchun "as string" qoshdim
            if(!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

            response.accessToken = await this.authService.createToken(response);

            return response;

        } catch(err) {
            console.log("Error, login: ", err);
            throw new BadRequestException(err);
        }
    }

    public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
        const result: Member | null = await this.memberModel.findOneAndUpdate({ //104-dars 30:00 daqiqa:(2025.06.23) "| null" ni qoshib qoydim chunki result xato chiqayotgan edi
            _id: memberId,
            memberStatus: MemberStatus.ACTIVE,
        }, 
        input, 
        {new: true}).exec();
        if(!result) throw new InternalServerErrorException(Message.UPLOAD_FAILED)

        result.accessToken = await this.authService.createToken(result);
        return result;
    }

    public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
        const search: T = {
            _id: targetId,
            memberStatus: {
                $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
            },
        };

        const targetMember = await this.memberModel.findOne(search).lean().exec();
        if (!targetMember) {
            throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        }

        if (memberId) {
            //record view
            const viewInput = {memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER};
            const newView = await this.viewService.recordView(viewInput);
            if(newView) {
                // increase memberView
                await this.memberModel
                .findOneAndUpdate(
                    search,
                    {$inc: {memberViews: 1}},
                    {new: true}
                )
                .exec();
                targetMember.memberViews++;
            }
        }
        return targetMember;
    }

    public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
        const { text } = input.search;
        const match: T = { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC};

        if(text) match.memberNick = { $regex: new RegExp(text, 'i') };
        console.log('match: ', match);

        const result = await this.memberModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [{ $skip: (input.page - 1) * input.limit}, { $limit: input.limit }],
                        metaCounter: [{ $count: 'total' }],
                    }
                }
            ])
            .exec();

        if(!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }


    public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
        const { memberStatus, memberType, text } = input.search;
        const match: T = {};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC};

        if(memberStatus) match.memberStatus = memberStatus;
        if(memberType) match.memberType = memberType;
        if(text) match.memberNick = { $regex: new RegExp(text, 'i') };
        console.log('match: ', match);

        const result = await this.memberModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [{ $skip: (input.page - 1) * input.limit}, { $limit: input.limit }],
                        metaCounter: [{ $count: 'total' }],
                    }
                }
            ])
            .exec()
        if(!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }

    public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
        const result: Member | null = await this.memberModel //105-dars 1:04:00 daqiqa:(2025.06.23) "| null" ni qoshib qoydim chunki result xato chiqayotgan edi
            .findOneAndUpdate({_id: input._id}, input, {new: true})
            .exec();

            if(!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        return result;
    }
}

