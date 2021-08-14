import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { EdmpwsapiService } from './services/edmpwsapi.service';
import { OfferService } from './services/offer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy, OnInit {
  title = 'ED Market Place';
  connected: boolean = false;
  connectdisabled: boolean = true;
  disconnectdisabled: boolean = true;

  mobileQuery: MediaQueryList;

  navItems = [
    { url: 'myoffer', name: 'My Offer'},
    { url: 'offers', name: 'Incoming Offers'}
  ];


  private ngUnsubscribe = new Subject();
  private _mobileQueryListener: () => void;

  constructor(
    private api: EdmpwsapiService,
    private offers: OfferService,
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher) {
    this.api.messages$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe();// to hold a reference only and prevent pipe release in services

    this.api.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.connectionMonitor(val));

    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.connect();
  }

  ngOnDestroy() {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  connect() {
    this.api.connect();
  }

  disconnect() {
    this.api.close();
  }

  connectionMonitor(val: boolean) {
    this.connected = val;
    this.connectdisabled = val;
    this.disconnectdisabled = !val;
  }
}
