import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { DEFAULT_USER_INFO, UserInfo } from 'src/app/datamodels/userinfo';
import { OfferService } from 'src/app/services/offer.service';
import { TradeItem } from '../../datamodels/tradeitem';

@Component({
  selector: 'app-tradeitemslist',
  templateUrl: './tradeitemslist.component.html',
  styleUrls: ['./tradeitemslist.component.scss']
})
export class TradeitemslistComponent implements OnInit {

  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  private ngUnsubscribe = new Subject();

  dataSource = new MatTableDataSource<TradeItem>([])

  userinfo: UserInfo = DEFAULT_USER_INFO;

  addeditem = {
    id: "",
    name: "",
    stock: 0,
    supply: 0,
    demand: 0
  };

  displayedColumns: string[] = ['name', 'id', 'stock', 'supply', 'demand', 'settings'];

  constructor(private offers: OfferService) {
    this.offers.items$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.dataSetter(val));
    this.offers.userInfo$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.userinfo = val);
}
  updateinfo() {
    this.offers.updateUserInfo(this.userinfo);
  }

  add() {
    this.offers.addItem(this.addeditem);
  }

  change(field: string, increment: number, element: TradeItem) {
    switch (field) {
      case 'supply': {
        if (0 < element.supply + increment && element.supply + increment < 1000) {
          element.supply+=increment;
          element.demand = 0;
        }
        break;
      }
      default: {
        if (0 < element.demand + increment && element.demand + increment < 1000) {
          element.demand+=increment;
          element.supply = 0;
        }
        break;
      }
    }
    this.offers.updateItem(element);
  }

  delete(index: number) {
    var item = this.dataSource.data[index];
    this.offers.deleteItem(item.id);
  }

  /** lifesycle */

  dataSetter(data: Array<TradeItem>) {
    this.dataSource.data = data;
    if (this.sort && data) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
