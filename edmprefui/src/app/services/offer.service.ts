import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TradeItem } from '../datamodels/tradeitem';
import { DEFAULT_USER_INFO, UserInfo } from '../datamodels/userinfo';
import { EdmpwsapiService } from './edmpwsapi.service';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  _userinfo$ = new BehaviorSubject<UserInfo>(DEFAULT_USER_INFO);
  _items$ = new BehaviorSubject<Array<TradeItem>>([]);

  userInfo$ = this._userinfo$.asObservable();
  items$ = this._items$.asObservable();

  constructor(
    private api: EdmpwsapiService,
    private state: StateService) {
    this.state.userInfo$.subscribe(info => {
      this._items$.next(info.items as Array<TradeItem>);
      this._userinfo$.next(info);
    });
    this.api.connected$
      .subscribe(val => this.connectionMonitor(val));
    this.api.messages$
      .subscribe(data => this.messagesMonitor(data));

  }

  connectionMonitor(connected: boolean){
    if (connected) {
      this.api.sendMessage(
        { "action":"offer",
          "data": {
            "method": "enlist"
          }
        }
      );
    } else {
      var userInfo = this._userinfo$.value;
      userInfo.connectionid = "";
      this.state.updateUserInfo(userInfo);
    }
  }

  messagesMonitor(data: any) {
    try {
      var jsonData = JSON.parse(data);
      if (jsonData.myoffer !== undefined) {
        // enlisted, initial connection info (connection id)
        var userInfo = this._userinfo$.value;
        userInfo.connectionid = jsonData.myoffer.connectionId;
        this.state.updateUserInfo(userInfo);
      } else if (jsonData.offer !== undefined) {
        // incoming offer, should be processed to get matches and other usefull info
      } else if (jsonData.dropoffer !== undefined) {
        // some offer was dropped notification, should be processed to update offers
      } else {
        console.log(`messagesMonitor: ${data}`);
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

  addItem(item: TradeItem) {
    var items = this._items$.value as unknown as Array<TradeItem>|null;
    if (!items) {
      items = [];
    }
    items.push(Object.assign({}, item));
    this.state.updateUserTradeItems(items);
    this.updateChangedState(true);
  }

  updateItem(item: TradeItem) {
    var items = this._items$.value as unknown as Array<TradeItem>|null;
    if (!items) {
      items = [];
      items.push(item);
    } else {
      var idx = items.findIndex(v => v.id === item.id);
      if (idx >= 0) {
        items[idx] = item;
      } else {
        items.push(item);
      }
    }
    this.state.updateUserTradeItems(items);
    this.updateChangedState(true);
  }

  deleteItem(id: string) {
    var items = this._items$.value as Array<TradeItem>;
    if (!!items && items.length > 0) {
      var idx = items.findIndex(v => v.id === id);
      if (idx >= 0) {
        items.splice(idx, 1);
      }
    }
    this.state.updateUserTradeItems(items);
    this.updateChangedState(true);
  }

  /** sync with server */
  getoffers() {
    this.api.sendMessage(
      { "action":"offer",
        "data": {
          "method": "getoffers"
        }
      }
    );
  }

  unpublishoffer() {
    this.api.sendMessage(
      { "action":"offer",
        "data": {
          "method": "removeoffer"
        }
      }
    );
    this.updateChangedState(true);
    this.updatePublishedState(false);
  }

  publishoffer() {
    this.api.sendMessage(
      { "action":"offer",
        "data":
          { "method":"publishoffer",
            "payload": this._userinfo$.value
          }
      }
    );
    this.updateChangedState(false);
    this.updatePublishedState(true);
  }

}
