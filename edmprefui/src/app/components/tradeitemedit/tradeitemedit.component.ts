import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { TradeItem } from 'src/app/datamodels/tradeitem';
import { OfferService } from 'src/app/services/offer.service';

@Component({
  selector: 'app-tradeitemedit',
  templateUrl: './tradeitemedit.component.html',
  styleUrls: ['./tradeitemedit.component.scss']
})
export class TradeitemeditComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

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
  }

  add() {
    this.offers.addItem(this.addeditem);
  }

  /** lifesycle */

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
  }

}
