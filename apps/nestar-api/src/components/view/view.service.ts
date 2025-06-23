import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';

@Injectable()
export class ViewService {
    constructor(@InjectModel("View") private readonly viewModel: Model<View>) {}

    public async recordView(input: ViewInput): Promise<View | null> {
        const viwExist = await this.checkViewExistance(input);
        if (!viwExist){
            console.log("- New View Insert -");
            return await this.viewModel.create(input);
        } else return null;
    }

    private async checkViewExistance(input: ViewInput): Promise<View | null> { //104-dars(2025.06.23) 01:15:30 soniya:  return qizil bergnai uchun "|null qoshishga majbur boldim"
        const { memberId, viewRefId } = input;
        const search: T = {memberId: memberId, viewRefId: viewRefId};
        return await this.viewModel.findOne(search).exec();
        
    }
}
