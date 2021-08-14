import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { TradeItem } from '../datamodels/tradeitem';
import { UserInfo, DEFAULT_USER_INFO } from '../datamodels/userinfo';
import { StorageService } from './storage.service';

const USER_INFO_KEY = 'USER_INFO';
const OFFERS_KEY = 'OFFERS';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _userInfo$ = new BehaviorSubject<UserInfo>(DEFAULT_USER_INFO);
  private _offers$ = new BehaviorSubject<Array<UserInfo>>([]);

  public userInfo$ = this._userInfo$.asObservable();
  public offers$ = this._offers$.asObservable();

  constructor(private storage: StorageService) {
    var userInfo = this.storage.loadInfo(USER_INFO_KEY) as unknown as UserInfo??DEFAULT_USER_INFO;
    var offers = this.storage.loadInfo(OFFERS_KEY) as unknown as Array<UserInfo>??[];

    this._userInfo$.next(userInfo);
    this._offers$.next(offers);

    // subscribing after initial load to persist all future updates
    // TODO: add throttling to cache changes
    this.userInfo$.subscribe(val => this.storage.setInfo(val, USER_INFO_KEY));
    this.offers$.subscribe(val => this.storage.setInfo(val, OFFERS_KEY));
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
  processInboundOffer(offer: UserInfo) {
    if (offer.connectionid === "" ||
      offer.connectionid === this._userInfo$.value.connectionid) return; // skip my own offer broadcast

    var offers = this._offers$.value;
    var idxExisting = offers.findIndex(o => o.connectionid === offer.connectionid);
    if (idxExisting >= 0) {
      offers[idxExisting].items = offer.items;
    } else {
      offers.push(offer);
    }
    this._offers$.next(offers);
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
