import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { Message } from '../../libs/enums/common.enum';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier } from '../../libs/types/common';


@Injectable()
export class PropertyService {
    constructor(
        @InjectModel('Property') private readonly propertyModel: Model<Property>,
        private memberService: MemberService,
    ) {}

    public async createProperty(input: PropertyInput): Promise<Property> {
        try {
            //const result: Property | null =  await this.propertyModel.create(input);
            const result =  await this.propertyModel.create(input);
            await this.memberService.memberStatsEditor({
                _id: result.memberId,
                targetKey: 'memberProperties',
                modifier: 1
            });
            // const edit: StatisticModifier = {
            //     _id: result.memberId,
            //     targetKey: 'memberProperties',
            //     modifier: 1

            // };
            //await this.memberSerivice.memberStatsEditor(edit)
            return result;
        } catch (err) {
            console.log("Error, Service.model: ", err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }
    }
}
