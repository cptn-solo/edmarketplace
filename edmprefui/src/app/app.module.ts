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
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OffersComponent } from './components/offers/offers.component';
import { MyinfoeditComponent } from './components/myinfoedit/myinfoedit.component';
import { TradeitemeditComponent } from './components/tradeitemedit/tradeitemedit.component';
import { MytradeitemseditComponent } from './components/mytradeitemsedit/mytradeitemsedit.component';
import { ChatdialogComponent } from './components/chatdialog/chatdialog.component';
import { HttpClientModule } from '@angular/common/http';
import { TranslocoRootModule } from './transloco/transloco-root.module';
import { LocalesComponent } from './components/locales/locales.component';
import { TradeitemComponent } from './components/tradeitem/tradeitem.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MyidComponent } from './components/myid/myid.component';
import { ClipboardModule } from '@angular/cdk/clipboard'

@NgModule({
  declarations: [
    AppComponent,
    MyofferComponent,
    TradeComponent,
    OffersComponent,
    MyinfoeditComponent,
    TradeitemeditComponent,
    MytradeitemseditComponent,
    ChatdialogComponent,
    LocalesComponent,
    TradeitemComponent,
    MyidComponent
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
    MatDialogModule,
    MatBadgeModule,
    MatMenuModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslocoRootModule,
    ClipboardModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        // panelClass: "mat-app-background",
        // backdropClass: "mat-app-background",
        hasBackdrop: true
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
