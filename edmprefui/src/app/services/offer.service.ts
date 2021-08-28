import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../datamodels/chatmessage';
import { TradeItem } from '../datamodels/tradeitem';
import { BidStage, DEFAULT_OFFER_EXPIRED_HOURS, DEFAULT_USER_INFO, Offer, OfferChange, OfferChangeFactory, OfferChangeType, UserInfo } from '../datamodels/userinfo';
import { EdmpwsapiService } from './edmpwsapi.service';
import { StateService } from './state.service';

const OFFER_EVENT_ENLIST = "enlist";
const OFFER_EVENT_PUBLISHOFFER = "publishoffer";
const OFFER_EVENT_ONLINEOFFERS = "onlineoffers";
const OFFER_EVENT_OFFLINEOFFERS = "offlineoffers"
const OFFER_EVENT_GET = "getoffers";
const OFFER_EVENT_DROPOFFERS = "dropoffers";

const COMMS_METHOD_BIDPUSH = "bidpush";
const COMMS_METHOD_BIDPULL = "bidpull";
const COMMS_METHOD_MESSAGE = "message";


const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
@Injectable({
  providedIn: 'root'
})
export class OfferService {
  _userinfo$ = new BehaviorSubject<UserInfo>(DEFAULT_USER_INFO);
  _items$ = new BehaviorSubject<Array<TradeItem>>([]);
  _offers$ = new BehaviorSubject<Array<Offer>>([]);
  _token$ = new BehaviorSubject<string>('');

  _offerChanged$ = new BehaviorSubject<OfferChange|null>(null);

  userInfo$ = this._userinfo$.asObservable();
  items$ = this._items$.asObservable();
  offers$ = this._offers$.asObservable();
  token$ = this._token$.asObservable();

  offerChanged$ = this._offerChanged$.asObservable();

  constructor(
    private api: EdmpwsapiService,
    private state: StateService) {
    this.state.userInfo$.subscribe(info => {
      this._items$.next(info.items as Array<TradeItem>);
      this._userinfo$.next(info);
    });
    this.state.offers$.subscribe(offers => this._offers$.next(offers));
    this.state.traceToken$.subscribe(token => this._token$.next(token));
    this.api.connected$.subscribe(val => this.connectionMonitor(val));
    this.api.messages$.subscribe(data => this.messagesMonitor(data));
  }

  connectionMonitor(connected: boolean){
    if (connected) {
      this.api.sendMessage(
        { "action":"offer",
          "data": {
            "method": OFFER_EVENT_ENLIST,
            "payload": {
              "token": this._token$.value
            }
          }
        }
      );
    } else {
      this.state.registerUserConnection("");
    }
  }

  messagesMonitor(data: any) {
    try {
      var jsonData = JSON.parse(data);
      switch (jsonData.code) {
        case OFFER_EVENT_ENLIST: { // { code: "enlist", trace, offers }
          // During enlist call user either gets back his sent token (saved from 1st enlist) or newly generated one
          // if this is a 1st enlist call.
          this.state.registerUserTraceToken(jsonData.trace.token);
          this.state.registerUserConnection(jsonData.trace.connectionId);
          // enlisted, initial connection info (connection id)
          this.state.processUserOffer(jsonData.offers);
          // update current offers state (bids mostly)
          this.getoffers();
          break;
        }
        case OFFER_EVENT_ONLINEOFFERS: { // { code: "onlineoffers", offerIds, connectionId }
          // mark offers online
          this.state.processOffersConnectionId(jsonData.offerIds, jsonData.connectionId);
          this._offerChanged$.next(OfferChangeFactory(jsonData.offerIds, OfferChangeType.ONLINE));
          break;
        }
        case OFFER_EVENT_OFFLINEOFFERS: { // { code: "offlineoffers", offerIds }
          // mark offers offline
          this.state.processOffersConnectionId(jsonData.offerIds, "");
          this._offerChanged$.next(OfferChangeFactory(jsonData.offerIds, OfferChangeType.OFFLINE));
          break;
        }
        case OFFER_EVENT_GET: { // { code: "getoffers", offers, page, ofpages }
          // incoming offers batch, should be processed to get matches and other usefull info
          this.state.processInboundOffersBatch(jsonData.offers);
          this._offerChanged$.next(OfferChangeFactory((jsonData.offers as Array<Offer>).map(offer => offer.offerId), OfferChangeType.PUBLISH));
          break;
        }
        case OFFER_EVENT_PUBLISHOFFER: { // { code: "publishoffer", offer }
          // incoming offer, should be processed to get matches and other usefull info
          this.state.processInboundOffer(jsonData.offer);
          this._offerChanged$.next(OfferChangeFactory([jsonData.offer.offerId], OfferChangeType.PUBLISH));
          break;
        }
        case OFFER_EVENT_DROPOFFERS: { // { code: "dropoffers", offerIds }
          // some offer was dropped notification, should be processed to update offers
          this.state.processRemoveOffers(jsonData.offerIds);
          this._offerChanged$.next(OfferChangeFactory(jsonData.offerIds, OfferChangeType.DROP));
          break;
        }
        case COMMS_METHOD_BIDPUSH:   // { code: "bidpush", offer }
        case COMMS_METHOD_BIDPULL: { // { code: "bidpull", offer }
            // incoming offer with new bid just added
          this.state.processInboundOffer(jsonData.offer);
          this._offerChanged$.next(OfferChangeFactory([jsonData.offer.offerId], jsonData.code));
          break;
        }
        case COMMS_METHOD_MESSAGE: { // { code, message }
          this.state.processInboundMessage(jsonData.message);
          this._offerChanged$.next(OfferChangeFactory([jsonData.message.offerId], OfferChangeType.MESSAGE));
          break;
        }
        default: {
          console.log(`messagesMonitor: ${data}`);
          break;
        }
      }
    } catch (error) {
      console.log(`ERROR: messagesMonitor: unknown message: ${data}`);
    }
  }

  /** data management */
  updatePublishedState(published: boolean) {
    // mark my offer as (un)published for UI to toggle buttons correctly
    var userInfo = this._userinfo$.value;
    userInfo.published = published;
    this.state.updateUserInfo(userInfo);
  }

  updateChangedState(changed: boolean) {
    // mark my offer as (un)changed for UI to toggle buttons correctly
    var userInfo = this._userinfo$.value;
    userInfo.changed = changed;
    this.state.updateUserInfo(userInfo);
  }

  updateUserInfo(updatedInfo: UserInfo) {
    var userInfo = this._userinfo$.value;
    userInfo.location = updatedInfo.location;
    userInfo.nickname = updatedInfo.nickname;
    userInfo.contactinfo = updatedInfo.contactinfo;
    this.state.updateUserInfo(userInfo);
    this.updateChangedState(true);
  }

  addItem(item: TradeItem) {
    var items = this._items$.value as unknown as Array<TradeItem>|null;
    if (!items) {
      items = [];
    }
    var toAdd = Object.assign({}, item);
    if (toAdd.tradeid === -1)
      toAdd.tradeid = items.length ? (items[items.length-1].tradeid +1) : 0
    items.push(toAdd);
    this.state.updateUserTradeItems(items);
    this.updateChangedState(true);
  }

  updateItem(item: TradeItem) {
    var items = this._items$.value as unknown as Array<TradeItem>|null;
    if (!items) {
      items = [];
      items.push(item);
    } else {
      var idx = items.findIndex(v => v.tradeid === item.tradeid );
      if (idx >= 0) {
        items[idx] = item;
      } else {
        items.push(item);
      }
    }
    this.state.updateUserTradeItems(items);
    this.updateChangedState(true);
  }

  deleteItem(id: number) {
    var items = this._items$.value as Array<TradeItem>;
    if (!!items && items.length > 0) {
      var idx = items.findIndex(v => v.tradeid === id);
      if (idx >= 0) {
        items.splice(idx, 1);
      }
    }
    this.state.updateUserTradeItems(items);
    this.updateChangedState(true);
  }

  checkOfferBidStage(offer: Offer): BidStage {
    // return true if a bid already added to the specified offer
    var retval = BidStage.NA;
    if (this._userinfo$.value.offerId.length === 0) return retval;

    if ((offer.bids??[]).findIndex(b => b === this._userinfo$.value.offerId) < 0) {
      // no outgoing bids
      retval = BidStage.BID;
    } else {
      // bid already pushed
      retval = BidStage.WAIT;
    }
    if ((this._userinfo$.value.bids??[]).findIndex(b => b === offer.offerId) < 0) {
      // no incoming bids
      return retval;
    } else if (retval === BidStage.WAIT) {
      // incoming bid + outgoing bid
      return BidStage.MESSAGE;
    } else {
      // incoming bid but no outgoing bid
      return BidStage.ACCEPT;
    }
  }

  /** sync with server */

  bidPushOrPull(offerId: string, pushMode: boolean) {
    const token = this._token$.value;
    this.api.sendMessage(
      { "action": "comms",
        "data": {
          "method": pushMode ? COMMS_METHOD_BIDPUSH : COMMS_METHOD_BIDPULL,
          "payload": { token, offerId }
        }
      }
    );
  }

  sendChatMessage(message: ChatMessage): ChatMessage {
    const token = this._token$.value;
    this.api.sendMessage(
      { "action": "comms",
        "data": {
          "method": COMMS_METHOD_MESSAGE,
          "payload": { token, message }
        }
      }
    );
    return this.state.addOtboundMessage(message);
  }

  getoffers() {
    this.state.prepareOffersBatchProcessing();
    this.api.sendMessage(
      { "action": "offer",
        "data": {
          "method": OFFER_EVENT_GET
        }
      }
    );
  }

  unpublishoffer() {
    const userInfo = this._userinfo$.value;
    this.api.sendMessage(
      { "action": "offer",
        "data": {
          "method": OFFER_EVENT_DROPOFFERS,
          "payload": {
            "offerIds": [userInfo.offerId]
          }
        }
      }
    );
    this.updateChangedState(true);
    this.updatePublishedState(false);
  }

  publishoffer() {
    const userInfo = this._userinfo$.value;
    if (userInfo.offerId === "") {
      userInfo.offerId = uuidv4();
    }
    userInfo.created = new Date().getTime();
    userInfo.expired = userInfo.created + 1000*60*60*DEFAULT_OFFER_EXPIRED_HOURS;
    var publish = {
      offerId: userInfo.offerId,
      info: {
        nickname: userInfo.nickname,
        location: userInfo.location
      },
      bids: userInfo.bids,
      items: userInfo.items,
      created: userInfo.created,
      expired: userInfo.expired
    } as Offer;
    this.api.sendMessage(
      { "action": "offer",
        "data":
          { "method": OFFER_EVENT_PUBLISHOFFER,
            "payload": publish
          }
      }
    );
    this._userinfo$.next(userInfo);
    this.updateChangedState(false);
    this.updatePublishedState(true);
  }

}
