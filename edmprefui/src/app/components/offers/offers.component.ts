import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { TradeItem } from 'src/app/datamodels/tradeitem';
import { DEFAULT_USER_INFO, Offer, UserInfo } from 'src/app/datamodels/userinfo';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { OfferService } from 'src/app/services/offer.service';

enum BidStage {
  NA = 'na', // no own offer
  BID = 'bid', // the offer is ready for my bid to be pushed
  WAIT = 'wait', // the offer already has a bid from me
  ACCEPT = 'accept', // bid form the offer present in my offer bids, ready to bid in return
  MESSAGE = 'message' // offers have each other in their respective bids collection, ready for messaging
}

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

  bidpush(offer: Offer) {
    if (this.userInfo.offerId.length === 0) return;

    this.offers.bidPushOrPull(offer.offerId, true);
  }

  bidpull(offer: Offer) {
    if (this.userInfo.offerId.length === 0) return;

    this.offers.bidPushOrPull(offer.offerId, false);
  }

  sendMessage(offer: Offer) {

  }

  getBidStage(offer: Offer): BidStage {
    // return true if a bid already added to the specified offer
    var retval = BidStage.NA;
    if (this.userInfo.offerId.length === 0) return retval;

    if ((offer.bids??[]).findIndex(b => b === this.userInfo.offerId) < 0) {
      // no outgoing bids
      retval = BidStage.BID;
    } else {
      // bid already pushed
      retval = BidStage.WAIT;
    }
    if ((this.userInfo.bids??[]).findIndex(b => b === offer.offerId) < 0) {
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

  getoffers() {
    this.offers.getoffers();
  }

  /* lifesycle */
  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
