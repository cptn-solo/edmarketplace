import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { TradeItem } from '../datamodels/tradeitem';
import { UserInfo, DEFAULT_USER_INFO } from '../datamodels/userinfo';
import { StorageService } from './storage.service';

const USER_INFO_KEY = 'USER_INFO';
const OFFERS_KEY = 'OFFERS';
const TOKEN_KEY = 'TRACE_TOKEN';
export interface  IncomingOffer {
  connectionId: string; // offerer's connection id
  offer: UserInfo; // offer
}
@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _userInfo$ = new BehaviorSubject<UserInfo>(DEFAULT_USER_INFO);
  private _offers$ = new BehaviorSubject<Array<UserInfo>>([]);
  private _traceToken$ = new BehaviorSubject<string>('');

  private _getoffersReset = false;

  public userInfo$ = this._userInfo$.asObservable();
  public offers$ = this._offers$.asObservable();
  public traceToken$ = this._traceToken$.asObservable();

  constructor(private storage: StorageService) {
    var userInfo = this.storage.loadInfo(USER_INFO_KEY) as unknown as UserInfo??DEFAULT_USER_INFO;
    var offers = this.storage.loadInfo(OFFERS_KEY) as unknown as Array<UserInfo>??[];
    var traceToken = this.storage.loadInfo(TOKEN_KEY) as unknown as string??'';

    this._userInfo$.next(userInfo);
    this._offers$.next(offers);
    this._traceToken$.next(traceToken);

    // subscribing after initial load to persist all future updates
    // TODO: add throttling to cache changes
    this.userInfo$.subscribe(val => this.storage.setInfo(val, USER_INFO_KEY));
    this.offers$.subscribe(val => this.storage.setInfo(val, OFFERS_KEY));
    this.traceToken$.subscribe(val => this.storage.setInfo(val, TOKEN_KEY));
  }

  registerUserTraceToken(token: string) {
    this._traceToken$.next(token);
  }

  processOfferRemove(connectionId: string) {
    if (connectionId === this._userInfo$.value.connectionid) return; // skip my own offer broadcast

    var offers = this._offers$.value;
    var idxExisting = offers.findIndex(o => o.connectionid === connectionId);
    if (idxExisting >= 0) {
      offers.splice(idxExisting, 1);
    }
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

  processInboundOffersBatch(batch: Array<IncomingOffer>) {
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

  processInboundOffer(offer: UserInfo) {
    var offers = this._offers$.value;
    this.processOneInboundOffer({ connectionId: offer.connectionid??"", offer }, offers);
    this._offers$.next(offers);
  }

  processOneInboundOffer(offer: IncomingOffer, offers: Array<UserInfo>) {
    if (offer.connectionId === "" ||
      offer.connectionId === this._userInfo$.value.connectionid) return; // skip my own offer broadcast

    var idxExisting = offers.findIndex(o => o.connectionid === offer.connectionId);
    if (idxExisting >= 0) {
      offers[idxExisting].items = offer.offer.items;
    } else {
      offers.push(offer.offer);
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

}
