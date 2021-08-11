import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
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

  getoffers() {
    this.service.sendMessage(
      { "action":"offer",
        "data": {
          "method": "getoffers"
        }
      }
    );
  }

  offer() {
    this.service.sendMessage(
      { "action":"offer",
        "data":
          { "method":"publishoffer",
            "payload": {
              "system": "Sol",
              "offer": [
                { "material": "Item1",
                  "demand": 5,
                  "supply": 0},
                { "material": "Item2",
                  "demand": 0,
                  "supply": 5}
              ]
            }
          }
      }
    );
  }

  connectionMonitor(val: boolean) {
    this.connected = val;
  }
}
