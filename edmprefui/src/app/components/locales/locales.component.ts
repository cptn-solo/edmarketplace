import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-locales',
  templateUrl: './locales.component.html',
  styleUrls: ['./locales.component.scss']
})
export class LocalesComponent implements OnInit, OnDestroy {

  currentVal: string = 'EN';
  locales = [
    'EN', 'ES', 'RU', 'DE', 'FR', 'PT'
  ];
  filteredLocales: Array<string> = [];

  private ngUnsubscribe = new Subject();

  constructor(
    private state: StateService,
    private loco: TranslocoService) {
    this.state.locale$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        this.currentVal = val;
        this.loco.setActiveLang(val.toLowerCase());
        this.filterLocales();
      });


  }

  changeLocale(val: string) {
    this.state.setCurrentLocale(val);
    this.currentVal = val;
    this.filterLocales();
  }

  filterLocales() {
    this.filteredLocales = this.filteredLocales = this.locales.filter(l => l !== this.currentVal);
  }

  ngOnInit(): void {
    this.filterLocales();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
