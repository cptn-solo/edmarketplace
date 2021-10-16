import { APP_INITIALIZER, NgModule } from '@angular/core';
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
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslocoRootModule } from './transloco/transloco-root.module';
import { LocalesComponent } from './components/locales/locales.component';
import { TradeitemComponent } from './components/tradeitem/tradeitem.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MyidComponent } from './components/myid/myid.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { AuthModule, AuthInterceptor, AuthWellKnownEndpoints } from 'angular-auth-oidc-client';
import { AuthComponent } from './components/auth/auth.component';
const wnendpoints = {
  issuer: environment.fdAuthority,
  jwksUri: environment.fdAuthority,
  authorizationEndpoint: environment.fdAuthority+'/auth',
  tokenEndpoint: environment.fdAuthority+'/token',
  // userInfoEndpoint?: string;
  // endSessionEndpoint?: string;
  // checkSessionIframe?: string;
  // revocationEndpoint?: string;
  // introspectionEndpoint?: string;
  // parEndpoint?: string;
} as AuthWellKnownEndpoints;

const oauthcfg = {
  authWellknownEndpoints: wnendpoints,
  authority: environment.fdAuthority,
  redirectUrl: window.location.origin,
  postLogoutRedirectUri: window.location.origin,
  clientId: environment.fdClientId, //'devkit-clients-spa.pkce'
  scope: 'auth capi', //'openid profile email roles app.api.employeeprofile.read'
  responseType: 'code',
  silentRenew: true,
  silentRenewUrl: '${window.location.origin}/silent-renew.html',
  useRefreshToken: true,
  postLoginRoute: window.location.origin,
  renewTimeBeforeTokenExpiresInSeconds: 30,
  logLevel: 3,
};
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
    MyidComponent,
    AuthComponent
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
    AuthModule.forRoot({
      config: oauthcfg
    })
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        // panelClass: "mat-app-background",
        // backdropClass: "mat-app-background",
        hasBackdrop: true
      }
    },
    { provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
