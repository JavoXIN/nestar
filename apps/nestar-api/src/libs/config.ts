
import { ObjectId } from "bson";

export const availableAgentSorts = ['createdAt','updatetedAt','memberLikes','memberViews','memberRank'];
export const availableMemberSorts = ['createdAt','updatetedAt','memberLikes','memberViews'];

export const shapeIntoMongoObjectId = (target: any) => {
    return typeof target === 'string' ? new ObjectId(target) : target;
};

