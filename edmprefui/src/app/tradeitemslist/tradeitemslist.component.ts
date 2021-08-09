import { Component, OnInit } from '@angular/core';
import { TradeItem } from '../datamodels/tradeitem';

@Component({
  selector: 'app-tradeitemslist',
  templateUrl: './tradeitemslist.component.html',
  styleUrls: ['./tradeitemslist.component.scss']
})
export class TradeitemslistComponent implements OnInit {

  items: Array<TradeItem> = [];
  displayedColumns: string[] = ['name', 'supply', 'demand'];

  constructor() { }

  ngOnInit(): void {
    this.items.push({id: "item1", name: "Trade Item 1", supply: 0, demand: 0});
    this.items.push({id: "item2", name: "Trade Item 1", supply: 0, demand: 0});
  }

}
