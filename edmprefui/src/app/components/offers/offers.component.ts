import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { TradeItem } from 'src/app/datamodels/tradeitem';
import { DEFAULT_USER_INFO, Offer, UserInfo } from 'src/app/datamodels/userinfo';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { OfferService } from 'src/app/services/offer.service';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, OnDestroy {

  inboundOffers: Array<Offer> = [];
  filteredOffers: Array<Offer> = [];
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
    this.filteredOffers = this.inboundOffers
      .map(f => {
        var filtered = Object.assign({}, f);
        if (this.onlymatched)
          filtered.items = filtered.items.filter(i => this.checkMatch(i, true) || this.checkMatch(i, false))
        return filtered;
      })
      .filter(o => this.onlymatched ? o.items.length > 0 : true);
  }

  checkMatch(item: TradeItem, demand: boolean ): boolean {
    if (demand) {
      return item.demand > 0 && this.userInfo.items.findIndex(m => m.supply > 0 && m.sid === item.did) >= 0;
    } else {
      return item.supply > 0 && this.userInfo.items.findIndex(m => m.demand > 0 && m.did === item.sid) >= 0;
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
