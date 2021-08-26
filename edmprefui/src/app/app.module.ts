import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MyofferComponent } from './components/myoffer/myoffer.component';
import { TradeComponent } from './components/trade/trade.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { OffersComponent } from './components/offers/offers.component';
import { MyinfoeditComponent } from './components/myinfoedit/myinfoedit.component';
import { TradeitemeditComponent } from './components/tradeitemedit/tradeitemedit.component';
import { MytradeitemseditComponent } from './components/mytradeitemsedit/mytradeitemsedit.component';
@NgModule({
  declarations: [
    AppComponent,
    MyofferComponent,
    TradeComponent,
    OffersComponent,
    MyinfoeditComponent,
    TradeitemeditComponent,
    MytradeitemseditComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    MatChipsModule,
    MatSlideToggleModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
