import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { StateService } from 'src/app/services/state.service';
@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnDestroy {

  panels: Array<string> = []; // expanded panels

  private ngUnsubscribe = new Subject();

  constructor(
    private state: StateService) {

    this.state.panels$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => this.panels = val);
  }

  panelState(panel: string): boolean {
    return this.panels.findIndex(p => p === panel) >= 0;
  }

  setPanelState(panel: string, expanded: boolean) {
    const idx = this.panels.findIndex(p => p === panel);
    if (idx >= 0 && !expanded) {
      this.panels.splice(idx, 1);
    } else if (idx <0 && expanded) {
      this.panels.push(panel);
    }
    this.state.updateTradePanelsState(this.panels);
  }

  /* lifesycle */

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }


}
