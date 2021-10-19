import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { ChatMessage } from '../datamodels/chatmessage';
import { TradeItem } from '../datamodels/tradeitem';
import { UserInfo, DEFAULT_USER_INFO, Offer } from '../datamodels/userinfo';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

const USER_INFO_KEY = 'USER_INFO';
const OFFERS_KEY = 'OFFERS';
const TOKEN_KEY = 'TRACE_TOKEN';
const TOKEN_HASH_KEY = 'TRACE_TOKEN_HASH';
const CONNECTION_KEY = 'CONNECTION_KEY';
const PANELS_KEY = 'PANELS'; // offers view expandable panels state
const CHATMESSAGES_KEY = 'CHAT';
const CURRENT_LOCALE_KEY = 'LOCALE';
const MAX_CHAT_MESSAGES_COUNT = 100;
@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _userInfo$ = new BehaviorSubject<UserInfo>(DEFAULT_USER_INFO);
  private _offers$ = new BehaviorSubject<Array<Offer>>([]);
  private _traceToken$ = new BehaviorSubject<string>('');
  private _traceTokenHash$ = new BehaviorSubject<string>('');
  private _connectionId$ = new BehaviorSubject<string>('');
  private _panels$ = new BehaviorSubject<Array<string>>([]);
  private _chat$ = new BehaviorSubject<Array<ChatMessage>>([]);
  private _locale$ = new BehaviorSubject<string>('EN');

  private _getoffersReset = false;

  public userInfo$ = this._userInfo$.asObservable();
  public offers$ = this._offers$.asObservable();
  public traceToken$ = this._traceToken$.asObservable();
  public traceTokenHash$ = this._traceTokenHash$.asObservable();
  public connectionId$ = this._connectionId$.asObservable();
  public panels$ = this._panels$.asObservable();
  public chat$ = this._chat$.asObservable();
  public locale$ = this._locale$.asObservable();

  constructor(private storage: StorageService) {
    var userInfo = this.storage.loadInfo(USER_INFO_KEY) as unknown as UserInfo??DEFAULT_USER_INFO;
    var offers = this.storage.loadInfo(OFFERS_KEY) as unknown as Array<Offer>??[];
    var traceToken = this.storage.loadInfo(TOKEN_KEY) as unknown as string??'';
    var traceTokenHash = this.storage.loadInfo(TOKEN_HASH_KEY) as unknown as string??'';
    var connectionId = this.storage.loadInfo(CONNECTION_KEY) as unknown as string??'';
    var panels = this.storage.loadInfo(PANELS_KEY) as unknown as Array<string>??['info'];
    var chatMessages = this.storage.loadInfo(CHATMESSAGES_KEY) as unknown as Array<ChatMessage>??[];
    var locale = this.storage.loadInfo(CURRENT_LOCALE_KEY) as unknown as string??'EN';

    this._userInfo$.next(userInfo);
    this._offers$.next(offers);
    this._traceToken$.next(traceToken);
    this._traceTokenHash$.next(traceTokenHash);
    this._connectionId$.next(connectionId);
    this._panels$.next(panels);
    this._chat$.next(chatMessages);
    this._locale$.next(locale);

    // subscribing after initial load to persist all future updates
    // TODO: add throttling to cache changes
    this.userInfo$.subscribe(val => this.storage.setInfo(val, USER_INFO_KEY));
    this.offers$.subscribe(val => this.storage.setInfo(val, OFFERS_KEY));
    this.traceToken$.subscribe(val => this.storage.setInfo(val, TOKEN_KEY));
    this.traceTokenHash$.subscribe(val => this.storage.setInfo(val, TOKEN_HASH_KEY));
    this.connectionId$.subscribe(val => this.storage.setInfo(val, CONNECTION_KEY));
    this.panels$.subscribe(val => this.storage.setInfo(val, PANELS_KEY));
    this.chat$.subscribe(val => this.storage.setInfo(val, CHATMESSAGES_KEY));
    this.locale$.subscribe(val => this.storage.setInfo(val, CURRENT_LOCALE_KEY));
  }

  setCurrentLocale(val: string) {
    this._locale$.next(val);
  }

  registerUserTraceToken(token: string, tokenHash: string) {
    this._traceToken$.next(token);
    this._traceTokenHash$.next(tokenHash);
  }

  registerUserConnection(connectionId: string) {
    this._connectionId$.next(connectionId);
  }

  processOffersConnectionId(offerIds: Array<string>, connectionId: string) {
    var offers = this._offers$.value;
    offerIds.forEach(offerId => {
      if (offerId === this._userInfo$.value.offerId) return; // skip my own offer broadcast

      var idxExisting = offers.findIndex(o => o.offerId === offerId);
      if (idxExisting >= 0) {
        offers[idxExisting].connectionId = connectionId;
        console.log('processOffersConnectionState: '+offerId+' conn: '+connectionId);
      }
    });
    this._offers$.next(offers);
  }

  processRemoveOffers(offerIds: Array<string>) {
    var offers = this._offers$.value;
    offerIds.forEach(offerId => {
      if (offerId === this._userInfo$.value.offerId) return; // skip my own offer broadcast

      var idxExisting = offers.findIndex(o => o.offerId === offerId);
      if (idxExisting >= 0) {
        offers.splice(idxExisting, 1);
      }
    });
    this._offers$.next(offers);
  }

  cleanUpInboundOffers() {
    this._offers$.next([]);
  }

  //* To process batch of offers we should 1st remove old offers. to
  //* avoid empty "current offers" list we turn the flag ON when reques sent
  //* and OFF when batches start to drop into our inbox in processInboundOffersBatch
  prepareOffersBatchProcessing() {
    this._getoffersReset = true;
  }

  processInboundOffersBatch(offers: Array<Offer>) {
    var _offers = this._offers$.value;
    if (this._getoffersReset) { // flag toggled on getoffers request and resetted upon 1st batch processing
      _offers = [];
      this._getoffersReset = false;
    }
    offers.forEach(offer => {
      this.processOneInboundOffer(offer, _offers);
    });
    this._offers$.next(_offers);
  }

  processInboundOffer(offer: Offer) {
    var offers = this._offers$.value;
    this.processOneInboundOffer(offer, offers);
    this._offers$.next(offers);
  }

  processOneInboundOffer(offer: Offer, offers: Array<Offer>) {
    // note: inbound offers have empty token value

    if (offer.offerId === this._userInfo$.value.offerId) {
      var userinfo = this._userInfo$.value;
      userinfo.bids = offer.bids;
      userinfo.xbids = offer.xbids;
      this._userInfo$.next(userinfo);
      return; // skip my own offer broadcast
    }

    var idxExisting = offers.findIndex(o => o.offerId === offer.offerId);
    if (idxExisting >= 0) {
      offers[idxExisting] = offer;
    } else {
      offers.push(offer);
    }
  }

  processUserOffer(offers: Array<Offer>) {
    var userInfo = this._userInfo$.value;
    if (userInfo.items.length === 0 && offers.length !== 0) {
      var defaultOffer = offers[0] as unknown as Offer;
      userInfo.bids = defaultOffer.bids;
      userInfo.xbids = defaultOffer.xbids;
      userInfo.nickname = defaultOffer.info.nickname;
      userInfo.location = defaultOffer.info.location;
      userInfo.created = defaultOffer.created;
      userInfo.expired = defaultOffer.expired;
      userInfo.offerId = defaultOffer.offerId;
      this.updateUserTradeItems(defaultOffer.items);
      this.updateUserInfo(userInfo);
    }
  }

  updateUserTradeItems(items: Array<TradeItem>) {
    var userInfo = this._userInfo$.value as UserInfo;
    if (userInfo) {
      userInfo.items = items;
    }
    this._userInfo$.next(userInfo);
  }

  updateUserInfo(info: UserInfo) {
    var userInfo = this._userInfo$.value as UserInfo;
    var items = userInfo.items;
    if (userInfo && info && (!info.items || info.items === undefined)) {
      userInfo.items = items??[]; // to be able to update UserInfo separately from items array
    }
    this._userInfo$.next(userInfo);
  }

  updateTradePanelsState(panels: Array<string>) {
    this._panels$.next(panels);
  }

  getOfferById(offerId: string) {
    return this._offers$.value.find(offer => offer.offerId === offerId);
  }

  processInboundMessage(message: ChatMessage) {
    var messages = this._chat$.value;
    messages.push(message);
    if (messages.length >= MAX_CHAT_MESSAGES_COUNT)
      messages = messages.slice(messages.length - MAX_CHAT_MESSAGES_COUNT, messages.length);
    this._chat$.next(messages);
  }

  addOtboundMessage(message: ChatMessage): ChatMessage {
    var messages = this._chat$.value;
    var toadd: ChatMessage = Object.assign(message, { inbound: false });
    messages.push(toadd);
    if (messages.length >= MAX_CHAT_MESSAGES_COUNT)
      messages = messages.slice(messages.length - MAX_CHAT_MESSAGES_COUNT, messages.length);
    this._chat$.next(messages);
    return toadd;
  }

  getMessagesByOfferId(offerId: string) {
    var messages = this._chat$.value
      .filter(m => m.offerId === offerId)
      .sort((m1, m2) => m1.date - m2.date);
    return messages;
  }

}
