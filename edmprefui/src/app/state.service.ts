import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { UserInfo } from './datamodels/userinfo';
import { StorageService } from './storage.service';

const USER_INFO_KEY = 'USER_INFO';
const OFFERS_KEY = 'OFFERS';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _userInfo$ = new BehaviorSubject<UserInfo|null>(null);
  private _offers$ = new BehaviorSubject<Array<UserInfo>|null>(null);

  public userInfo$ = this._userInfo$.asObservable();
  public offers$ = this._offers$.asObservable();

  constructor(private storage: StorageService) {
    var userInfo = this.storage.loadInfo(USER_INFO_KEY) as unknown as UserInfo;
    var offers = this.storage.loadInfo(OFFERS_KEY) as unknown as Array<UserInfo>;

    this._userInfo$.next(userInfo);
    this._offers$.next(offers);

    // subscribing after initial load to persist all future updates
    // TODO: add throttling to cache changes
    this.userInfo$.subscribe(val => this.storage.setInfo(val, USER_INFO_KEY));
    this.offers$.subscribe(val => this.storage.setInfo(val, OFFERS_KEY));
  }
}
