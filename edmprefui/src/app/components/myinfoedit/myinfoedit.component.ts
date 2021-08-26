import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { DEFAULT_USER_INFO, UserInfo } from 'src/app/datamodels/userinfo';
import { OfferService } from 'src/app/services/offer.service';

@Component({
  selector: 'app-myinfoedit',
  templateUrl: './myinfoedit.component.html',
  styleUrls: ['./myinfoedit.component.scss']
})
export class MyinfoeditComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  userinfo: UserInfo = DEFAULT_USER_INFO;

  constructor(private offers: OfferService) {
    this.offers.userInfo$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.userinfo = val);
  }

  updateinfo() {
    this.offers.updateUserInfo(this.userinfo);
  }

  /** lifesycle */

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
  }

}
