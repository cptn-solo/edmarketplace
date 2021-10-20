import { TradeItem } from "./tradeitem";

export const DEFAULT_OFFER_EXPIRED_HOURS = 24;
export enum OfferChangeType {
    PUBLISH = 'publish',
    DROP = 'drop',
    BIDPUSH = 'bidpush',
    BIDPULL = 'bidpull',
    ONLINE = 'online',
    OFFLINE = 'offline',
    MESSAGE = 'message',
    XBIDPUSH = 'xbidpush',
    XBIDPULL = 'xbidpull',
    XBIDACCEPT = 'xbidaccept',
}

export enum BidStage {
    NA = 'na', // no own offer
    BID = 'bid', // the offer is ready for my bid to be pushed
    WAIT = 'wait', // the offer already has a bid from me
    ACCEPT = 'accept', // bid form the offer present in my offer bids, ready to bid in return
    MESSAGE = 'message' // offers have each other in their respective bids collection, ready for messaging
}

export enum XBidStage {
    NA = 'na', // no own offer
    XBID = 'xbid', // the offer is ready for my xbid to be pushed
    XWAIT = 'xwait', // the offer already has a xbid from me
    XACCEPT = 'xaccept', // xbid form the offer present in my offer xbids, ready to accept
    XDECLINE = 'xdecline', // xbid form the offer present in my offer xbids, ready to decline
    XMESSAGE = 'xmessage' // offers have each other in their respective bids collection, ready for messaging
}

export interface UserInfo {
    location: string | null;
    nickname: string | null;
    contactinfo: string | null;
    items: Array<TradeItem>;
    published: boolean;
    changed: boolean;
    bids: Array<string>;
    xbids: Array<XBid>;
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
    xbids: Array<XBid>
    created: number;
    expired: number;
}

export interface OfferChange {
    offerIds: Array<string>;
    change: OfferChangeType;
}

export const OfferChangeFactory = (offerIds: Array<string>, change: OfferChangeType): OfferChange  => {
    return { offerIds, change };
}

export interface UserTrace {
    token: string;
    connectionId: string;
}
export interface OfferInfo {
    location: string;
    nickname: string;
}

export interface XBid {
    token: string;
    tokenhash: string;
    accepted: boolean;
}

export const DEFAULT_USER_INFO = {
    location: "",
    nickname: "",
    contactinfo: "",
    items: [],
    published: false,
    changed: false,
    bids: [],
    xbids: [],
    created: new Date().getTime(),
    expired: new Date().getTime() + 1000*60*60*DEFAULT_OFFER_EXPIRED_HOURS,
    offerId: ""
};