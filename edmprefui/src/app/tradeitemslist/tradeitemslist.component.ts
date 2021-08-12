import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { TradeItem } from '../datamodels/tradeitem';
import { EdmpwsapiService } from '../edmpwsapi.service';

@Component({
  selector: 'app-tradeitemslist',
  templateUrl: './tradeitemslist.component.html',
  styleUrls: ['./tradeitemslist.component.scss']
})
export class TradeitemslistComponent implements OnInit {

  connected: boolean = false;

  private ngUnsubscribe = new Subject();

  items: Array<TradeItem> = [];
  displayedColumns: string[] = ['name', 'supply', 'demand'];

  constructor(private service: EdmpwsapiService) {
    this.service.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.connectionMonitor(val));
    this.service.messages$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(data => console.log('live', data));
  }

  ngOnInit(): void {
    this.items.push({id: "item1", name: "Trade Item 1", supply: 0, demand: 0});
    this.items.push({id: "item2", name: "Trade Item 1", supply: 0, demand: 0});
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  connectionMonitor(val: boolean) {
    this.connected = val;
  }


}
