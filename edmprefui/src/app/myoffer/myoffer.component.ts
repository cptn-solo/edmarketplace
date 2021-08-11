import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';
import { EdmpwsapiService } from '../edmpwsapi.service';

@Component({
  selector: 'app-myoffer',
  templateUrl: './myoffer.component.html',
  styleUrls: ['./myoffer.component.scss']
})
export class MyofferComponent implements OnDestroy {

  connected: boolean = false;

  private ngUnsubscribe = new Subject();

  constructor(private service: EdmpwsapiService) {
    this.service.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.connectionMonitor(val));
    this.service.messages$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(data => console.log('live', data));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  message() {
    this.service.sendMessage({"action":"sendmessage", "data":"hi"});
  }

  connectionMonitor(val: boolean) {
    this.connected = val;
  }
}
