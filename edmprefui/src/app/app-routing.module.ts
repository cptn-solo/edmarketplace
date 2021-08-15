import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyofferComponent } from './components/myoffer/myoffer.component';
import { OffersComponent } from './components/offers/offers.component';

const routes: Routes = [
  { path: 'myoffer', component: MyofferComponent },
  { path: 'offers', component: OffersComponent },
  { path: '', pathMatch: 'full', redirectTo: 'myoffer' },
  // matches an invalid route or a route doesn't exist in Cloud Claims
  { path: '**', redirectTo: 'myoffer' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
