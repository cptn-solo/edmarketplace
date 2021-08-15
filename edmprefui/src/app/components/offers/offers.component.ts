import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { TradeItem } from 'src/app/datamodels/tradeitem';
import { DEFAULT_USER_INFO, UserInfo } from 'src/app/datamodels/userinfo';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { OfferService } from 'src/app/services/offer.service';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, OnDestroy {

  inboundOffers: Array<UserInfo> = [];
  filteredOffers: Array<UserInfo> = [];
  userInfo: UserInfo = DEFAULT_USER_INFO;
  connected: boolean = false;
  onlymatched: boolean = false;

  private ngUnsubscribe = new Subject();

  constructor(
    private api: EdmpwsapiService,
    private offers: OfferService) {
    this.offers.offers$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        this.inboundOffers = val;
        this.applyCurrentFilters();
      });
    this.offers.userInfo$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        this.userInfo = val;
        this.applyCurrentFilters();
      });

    this.api.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.connected = val);

  }
  applyCurrentFilters() {
    this.filteredOffers = this.inboundOffers.filter(o => this.matchOffers(o));
  }
  checkMatch(item: TradeItem, demand: boolean ): boolean {
    if (demand) {
      return item.demand > 0 && this.userInfo.items.findIndex(m => m.supply > 0 && m.id === item.id) >= 0;
    } else {
      return item.supply > 0 && this.userInfo.items.findIndex(m => m.demand > 0 && m.id === item.id) >= 0;
    }
  }

  matchOffers(offer: UserInfo) {
    // TODO: exact match can be implemented as well
    if (this.onlymatched) {
      var cansupplysome = offer.items.findIndex(i => i.demand > 0 &&
        this.userInfo.items.findIndex(m => m.supply > 0 && m.id === i.id) >= 0) >= 0;
      var cangetsome = offer.items.findIndex(i => i.supply > 0 &&
        this.userInfo.items.findIndex(m => m.demand > 0 && m.id === i.id) >= 0) >= 0;
      return cansupplysome || cangetsome;
    } else {
      return true;
    }
  }

  getoffers() {
    this.offers.getoffers();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
