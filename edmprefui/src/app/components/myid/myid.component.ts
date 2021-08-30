import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-myid',
  templateUrl: './myid.component.html',
  styleUrls: ['./myid.component.scss']
})
export class MyidComponent implements OnInit {

  token?: string
  private ngUnsubscribe = new Subject();

  constructor(
    private state: StateService,
    private api: EdmpwsapiService) {
    this.state.traceToken$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.token = val);
  }

  saveId() {
    if (this.token && this.token.length > 0) {
      this.state.registerUserTraceToken(this.token);
      this.state.updateUserTradeItems([]);
      this.api.close();
      setTimeout(() => this.api.connect(), 50);
    }
  }

  /** lifesycle */

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
  }
}
