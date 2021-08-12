import { TradeItem } from "./tradeitem";

export interface UserInfo {
    connectionid?: string;
    location?: string;
    nickname?: string;
    contactinfo?: string;
    items?: Array<TradeItem>;
}