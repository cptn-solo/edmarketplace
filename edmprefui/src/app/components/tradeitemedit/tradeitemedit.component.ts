import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TranslocoService } from '@ngneat/transloco';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { TradeItem } from 'src/app/datamodels/tradeitem';
import { Materials } from 'src/app/dictionaries/ed-of-materials';
import { OfferService } from 'src/app/services/offer.service';

@Component({
  selector: 'app-tradeitemedit',
  templateUrl: './tradeitemedit.component.html',
  styleUrls: ['./tradeitemedit.component.scss']
})
export class TradeitemeditComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  items: Array<TradeItem> = [];

  sidControl = new FormControl();
  didControl = new FormControl();

  options: Array<string> = Materials;
  sidFilteredOptions?: Observable<string[]>;
  didFilteredOptions?: Observable<string[]>;

  addeditem: TradeItem = {
    tradeid: -1,
    sid: "",
    sname: "",
    sstock: 0,
    supply: 1,
    did: "",
    dname: "",
    dstock: 0,
    demand: 1
  };

  constructor(
    private offers: OfferService,
    private loco: TranslocoService
    ) {
    this.offers.items$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.items = val);
  }

  add() {
    this.offers.addItem(this.addeditem);
  }

  sidSelected(event: MatAutocompleteSelectedEvent) {
    this.addeditem.sid = event.option.value as unknown as string;
  }

  didSelected(event: MatAutocompleteSelectedEvent) {
    this.addeditem.did = event.option.value as unknown as string;
  }

  displayFn = (matId: string) => {
    return matId && matId !== undefined && matId.length > 0 ? this.loco.translate(matId) : '';
  }

  private _filter(name: string): string[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => this.loco.translate(option).toLowerCase().includes(filterValue));
  }

  /** lifesycle */

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.sidFilteredOptions = this.sidControl.valueChanges
      .pipe(
        takeUntil(this.ngUnsubscribe),
        startWith(''),
        map(name => name ? this._filter(name) : this.options.slice())
      );
    this.didFilteredOptions = this.didControl.valueChanges
      .pipe(
        takeUntil(this.ngUnsubscribe),
        startWith(''),
        map(name => name ? this._filter(name) : this.options.slice())
      );
}

}
