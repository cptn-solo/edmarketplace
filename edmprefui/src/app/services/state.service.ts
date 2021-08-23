import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { TradeItem } from '../datamodels/tradeitem';
import { UserInfo, DEFAULT_USER_INFO, Offer } from '../datamodels/userinfo';
import { StorageService } from './storage.service';

const USER_INFO_KEY = 'USER_INFO';
const OFFERS_KEY = 'OFFERS';
const TOKEN_KEY = 'TRACE_TOKEN';
const CONNECTION_KEY = 'CONNECTION_KEY';
@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _userInfo$ = new BehaviorSubject<UserInfo>(DEFAULT_USER_INFO);
  private _offers$ = new BehaviorSubject<Array<Offer>>([]);
  private _traceToken$ = new BehaviorSubject<string>('');
  private _connectionId$ = new BehaviorSubject<string>('');

  private _getoffersReset = false;

  public userInfo$ = this._userInfo$.asObservable();
  public offers$ = this._offers$.asObservable();
  public traceToken$ = this._traceToken$.asObservable();
  public connectionId$ = this._connectionId$.asObservable();

  constructor(private storage: StorageService) {
    var userInfo = this.storage.loadInfo(USER_INFO_KEY) as unknown as UserInfo??DEFAULT_USER_INFO;
    var offers = this.storage.loadInfo(OFFERS_KEY) as unknown as Array<Offer>??[];
    var traceToken = this.storage.loadInfo(TOKEN_KEY) as unknown as string??'';
    var connectionId = this.storage.loadInfo(CONNECTION_KEY) as unknown as string??'';

    this._userInfo$.next(userInfo);
    this._offers$.next(offers);
    this._traceToken$.next(traceToken);
    this._connectionId$.next(connectionId);

    // subscribing after initial load to persist all future updates
    // TODO: add throttling to cache changes
    this.userInfo$.subscribe(val => this.storage.setInfo(val, USER_INFO_KEY));
    this.offers$.subscribe(val => this.storage.setInfo(val, OFFERS_KEY));
    this.traceToken$.subscribe(val => this.storage.setInfo(val, TOKEN_KEY));
    this.connectionId$.subscribe(val => this.storage.setInfo(val, CONNECTION_KEY));
  }

  registerUserTraceToken(token: string) {
    this._traceToken$.next(token);
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

  processInboundOffersBatch(batch: Array<Offer>) {
    var offers = this._offers$.value;
    if (this._getoffersReset) { // flag toggled on getoffers request and resetted upon 1st batch processing
      offers = [];
      this._getoffersReset = false;
    }
    batch.forEach(offer => {
      this.processOneInboundOffer(offer, offers);
    });
    this._offers$.next(offers);
  }

  processInboundOffer(offer: Offer) {
    var offers = this._offers$.value;
    this.processOneInboundOffer(offer, offers);
    this._offers$.next(offers);
  }

  processOneInboundOffer(offer: Offer, offers: Array<Offer>) {
    // note: inbound offers have empty token value

    if (offer.offerId === this._userInfo$.value.offerId) return; // skip my own offer broadcast

    var idxExisting = offers.findIndex(o => o.offerId === offer.offerId);
    if (idxExisting >= 0) {
      offers[idxExisting].items = offer.items;
    } else {
      offers.push(offer);
    }
  }

  processUserOffer(offers: Array<Offer>): boolean {
    // returns true if nothing to publish (server data overrites user's data)
    var userInfo = this._userInfo$.value;
    if (userInfo.items.length === 0 && offers.length !== 0) {
      var defaultOffer = offers[0] as unknown as Offer;
      userInfo.bids = defaultOffer.bids;
      userInfo.nickname = defaultOffer.info.nickname;
      userInfo.location = defaultOffer.info.location;
      userInfo.created = defaultOffer.created;
      userInfo.expired = defaultOffer.expired;
      this.updateUserInfo(userInfo);
    } else if (userInfo.published) {
      return false;
    }
    return true;
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

}
