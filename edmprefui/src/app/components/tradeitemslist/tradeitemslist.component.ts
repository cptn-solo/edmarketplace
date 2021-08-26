import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { DEFAULT_USER_INFO, UserInfo } from 'src/app/datamodels/userinfo';
import { OfferService } from 'src/app/services/offer.service';
import { TradeItem } from '../../datamodels/tradeitem';

@Component({
  selector: 'app-tradeitemslist',
  templateUrl: './tradeitemslist.component.html',
  styleUrls: ['./tradeitemslist.component.scss', '../offers/offers.component.scss']
})
export class TradeitemslistComponent implements OnDestroy {

  private ngUnsubscribe = new Subject();

  userinfo: UserInfo = DEFAULT_USER_INFO;

  items: Array<TradeItem> = [];

  addeditem: TradeItem = {
    tradeid: -1,
    sid: "",
    sname: "",
    sstock: 0,
    supply: 0,
    did: "",
    dname: "",
    dstock: 0,
    demand: 0
  };

  constructor(private offers: OfferService) {
    this.offers.items$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.items = val);
    this.offers.userInfo$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.userinfo = val);
  }
  updateinfo() {
    this.offers.updateUserInfo(this.userinfo);
  }

  add() {
    this.offers.addItem(this.addeditem);
  }
  switchsides(item: TradeItem) {
    var switchedItem = Object.assign({}, {
      tradeid: item.tradeid,
      sid: item.did,
      sname: item.dname,
      sstock: item.dstock,
      supply: item.demand,
      did: item.sid,
      dname: item.sname,
      dstock: item.sstock,
      demand: item.supply
    })
    this.offers.updateItem(switchedItem);
  }

  change(field: string, increment: number, element: TradeItem) {
    switch (field) {
      case 'supply': {
        if (0 < element.supply + increment && element.supply + increment < 1000) {
          element.supply+=increment;
        }
        break;
      }
      default: {
        if (0 < element.demand + increment && element.demand + increment < 1000) {
          element.demand+=increment;
        }
        break;
      }
    }
    this.offers.updateItem(element);
  }

  delete(item: TradeItem) {
    this.offers.deleteItem(item.tradeid);
  }

  /** lifesycle */

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
