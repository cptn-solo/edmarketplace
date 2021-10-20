import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { TradeItem } from 'src/app/datamodels/tradeitem';
import { BidStage, DEFAULT_USER_INFO, Offer, OfferChangeType, UserInfo, XBidStage } from 'src/app/datamodels/userinfo';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { OfferService } from 'src/app/services/offer.service';
import { ChatdialogComponent } from '../chatdialog/chatdialog.component';
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
  unreadOfferChats: Array<string> = [];
  chatOfferId: string = '';

  mobileQuery: MediaQueryList;

  private ngUnsubscribe = new Subject();

  constructor(
    public dialog: MatDialog,
    private api: EdmpwsapiService,
    private offers: OfferService,
    private media: MediaMatcher) {

    this.mobileQuery = media.matchMedia('(max-width: 600px)');

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
    this.offers.offerChanged$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        if (!val) return;
        if (val.change === OfferChangeType.MESSAGE &&
          val.offerIds[0] !== this.chatOfferId &&
          this.unreadOfferChats.indexOf(val.offerIds[0]) < 0)
          this.unreadOfferChats.push(val.offerIds[0]);
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
    // TODO: let user pick his offer for bid
    const myOfferId = this.userInfo.offerId
    if (myOfferId.length === 0) return;

    this.offers.bidPushOrPull(offer.offerId, myOfferId, true);
  }

  bidpull(offer: Offer) {
    // TODO: let user pick his offer for bid
    const myOfferId = this.userInfo.offerId
    if (myOfferId.length === 0) return;

    this.offers.bidPushOrPull(offer.offerId, myOfferId, false);
  }

  xbidpush(offer: Offer) {
    this.offers.xbidPushOrPull(offer.offerId, true);
  }

  xbidpull(offer: Offer) {
    this.offers.xbidPushOrPull(offer.offerId, false);
  }

  xbidaccept(offer: Offer, accept: boolean) {
    this.offers.xbidAcceptOrDecline(this.userInfo.offerId, offer.token, accept);
  }

  openXChatDialog(offer: Offer) {
    const myOfferId = this.userInfo.offerId

    const offerXBids = offer.xbids;
    const myIdx = offerXBids.findIndex(b => b.tokenhash === this.offers._tokenHash$.value);

    const inboundXBids = this.userInfo.xbids;
    const inbIdx = inboundXBids.findIndex(b => b.tokenhash === offer.token); //offer.token is hashed

    var receiverTokenHash = '';
    var contextOfferId = '';
    if (myIdx >= 0) { // i am a xbidder for the offer
      receiverTokenHash = offer.token;
      contextOfferId = offer.offerId;
    } else if (inbIdx >= 0) { // xbid from the owner of the offer exists for my own offer
      receiverTokenHash = inboundXBids[inbIdx].tokenhash;
      contextOfferId = myOfferId;
    }
    var senderTokenHash = this.offers._tokenHash$.value;

    this.chatOfferId = offer.offerId;
    const dialogRef = this.dialog.open(ChatdialogComponent,
      {
        width: '520px',
        height: '520px',
        data: { offer, myOfferId, contextOfferId, receiverTokenHash, senderTokenHash }
      });

    dialogRef.afterClosed().subscribe(result => {
      this.chatOfferId = '';
      console.log(`Dialog result: ${result}`);
    });

    const unreadIdx = this.unreadOfferChats.indexOf(offer.offerId);
    if (unreadIdx >= 0)
      this.unreadOfferChats.splice(unreadIdx, 1);
  }

  openChatDialog(offer: Offer) {
    // TODO: let user pick his offer for bid
    const myOfferId = this.userInfo.offerId
    if (myOfferId.length === 0) return;

    this.chatOfferId = offer.offerId;
    const dialogRef = this.dialog.open(ChatdialogComponent,
      {
        width: '520px',
        height: '520px',
        data: { offer, myOfferId }
      });

    dialogRef.afterClosed().subscribe(result => {
      this.chatOfferId = '';
      console.log(`Dialog result: ${result}`);
    });

    const unreadIdx = this.unreadOfferChats.indexOf(offer.offerId);
    if (unreadIdx >= 0)
      this.unreadOfferChats.splice(unreadIdx, 1);
  }

  showBadge(offer: Offer): boolean {
    return this.unreadOfferChats.indexOf(offer.offerId) >= 0;
  }

  getBidStage(offer: Offer): BidStage {
    return this.offers.checkOfferBidStage(offer);
  }

  getXBidStage(offer: Offer): XBidStage {
    return this.offers.checkOfferXBidStage(offer);
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
