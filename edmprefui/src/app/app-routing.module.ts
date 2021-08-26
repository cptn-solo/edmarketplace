import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OffersComponent } from './components/offers/offers.component';
import { TradeComponent } from './components/trade/trade.component';

const routes: Routes = [
  { path: 'trade', component: TradeComponent },
  { path: 'offers', component: OffersComponent },
  { path: '', pathMatch: 'full', redirectTo: 'trade' },
  // matches an invalid route or a route doesn't exist in Cloud Claims
  { path: '**', redirectTo: 'trade' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
