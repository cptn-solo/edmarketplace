import { TradeItem } from "./tradeitem";

export interface UserInfo {
    connectionid: string | null;
    location: string | null;
    nickname: string | null;
    contactinfo: string | null;
    items: Array<TradeItem>;
    published: boolean;
    changed: boolean;
}
export const DEFAULT_USER_INFO = {
    connectionid: "",
    location: "",
    nickname: "",
    contactinfo: "",
    items: [],
    published: false,
    changed: false,
};