import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { EdmpwsapiService } from './edmpwsapi.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy, OnInit {
  title = 'ED Market Place Reference UI';
  connected: boolean = false;
  connectdisabled: boolean = true;
  disconnectdisabled: boolean = true;

  private ngUnsubscribe = new Subject();

  constructor (private service: EdmpwsapiService) {
    this.service.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.connectionMonitor(val));
  }

  ngOnInit() {
    this.connect();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  connect() {
    this.service.connect();
  }

  disconnect() {
    this.service.close();
  }

  connectionMonitor(val: boolean) {
    this.connected = val;
    this.connectdisabled = val;
    this.disconnectdisabled = !val;
  }
}
