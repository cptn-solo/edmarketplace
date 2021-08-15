import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { OfferService } from 'src/app/services/offer.service';

@Component({
  selector: 'app-myoffer',
  templateUrl: './myoffer.component.html',
  styleUrls: ['./myoffer.component.scss']
})
export class MyofferComponent implements OnDestroy {

  connected: boolean = false;
  published: boolean = true;
  changed: boolean = true;

  private ngUnsubscribe = new Subject();

  constructor(
    private api: EdmpwsapiService,
    private offers: OfferService) {
    this.api.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.connectionMonitor(val));
    this.offers.userInfo$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        this.published = val.published;
        this.changed = val.changed;
      });
}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  getoffers() {
    this.offers.getoffers();
  }

  unpublishoffer() {
    this.offers.unpublishoffer();
  }

  publishoffer() {
    this.offers.publishoffer();
  }

  connectionMonitor(val: boolean) {
    this.connected = val;
  }
}
