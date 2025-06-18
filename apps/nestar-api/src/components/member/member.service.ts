import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MemberService {

    constructor(@InjectModel('Member') private readonly memberModel: Model<Member>, 
    private authService: AuthService,
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

    public async updateMember(): Promise<string> {
        return 'updateMember executed!';
    }

    public async getMember(): Promise<string> {
        return 'getMember executed!';
    }
}