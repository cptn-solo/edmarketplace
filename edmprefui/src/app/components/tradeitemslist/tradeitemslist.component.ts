import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { OfferService } from 'src/app/services/offer.service';
import { TradeItem } from '../../datamodels/tradeitem';

@Component({
  selector: 'app-tradeitemslist',
  templateUrl: './tradeitemslist.component.html',
  styleUrls: ['./tradeitemslist.component.scss']
})
export class TradeitemslistComponent implements OnInit {

  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @Input() connected: boolean = false;

  private ngUnsubscribe = new Subject();
  dataSource = new MatTableDataSource<TradeItem>([])
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
      .subscribe(val => this.dataSetter(val??[]));
  }

  add() {
    this.offers.addItem(this.addeditem);
  }

  change(field: string, increment: number, element: TradeItem) {
    switch (field) {
      case 'supply':
        element.supply+=increment;
        break;
      default:
        element.demand+=increment;
        break;
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
