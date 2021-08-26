import { Component } from '@angular/core';
import { OfferService } from 'src/app/services/offer.service';
import { TradeItem } from '../../datamodels/tradeitem';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent {

  constructor(private offers: OfferService) {
  }

  switchsides(item: TradeItem) {
    var switchedItem = Object.assign({}, {
      tradeid: item.tradeid,
      sid: item.did,
      sname: item.dname,
      sstock: item.dstock,
      supply: item.demand,
      did: item.sid,
      dname: item.sname,
      dstock: item.sstock,
      demand: item.supply
    })
    this.offers.updateItem(switchedItem);
  }

  change(field: string, increment: number, element: TradeItem) {
    switch (field) {
      case 'supply': {
        if (0 < element.supply + increment && element.supply + increment < 1000) {
          element.supply+=increment;
        }
        break;
      }
      default: {
        if (0 < element.demand + increment && element.demand + increment < 1000) {
          element.demand+=increment;
        }
        break;
      }
    }
    this.offers.updateItem(element);
  }

  delete(item: TradeItem) {
    this.offers.deleteItem(item.tradeid);
  }

}
