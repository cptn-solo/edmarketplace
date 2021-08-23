import { TradeItem } from "./tradeitem";

export const DEFAULT_OFFER_EXPIRED_HOURS = 24;
export interface UserInfo {
    location: string | null;
    nickname: string | null;
    contactinfo: string | null;
    items: Array<TradeItem>;
    published: boolean;
    changed: boolean;
    bids: Array<string>;
    created: number;
    expired: number;
    offerId: string; // own offer id
}

export interface Offer {
    offerId: string;
    token: string; // only for owned offers
    connectionId: string;
    info: OfferInfo;
    items: Array<TradeItem>;
    bids: Array<string>; // array of offer ids from other parties
    created: number;
    expired: number;
}

export interface UserTrace {
    token: string;
    connectionId: string;
}
export interface OfferInfo {
    location: string;
    nickname: string;
}

export const DEFAULT_USER_INFO = {
    location: "",
    nickname: "",
    contactinfo: "",
    items: [],
    published: false,
    changed: false,
    bids: [],
    created: new Date().getTime(),
    expired: new Date().getTime() + 1000*60*60*DEFAULT_OFFER_EXPIRED_HOURS,
    offerId: ""
};