import { Component, OnInit } from '@angular/core';
import { OidcSecurityService, OpenIdConfiguration, UserDataResult } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  userData$?: Observable<UserDataResult>;

  configuration?: OpenIdConfiguration;

  isAuthenticated = false;
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.configuration = this.oidcSecurityService.getConfiguration();
    this.userData$ = this.oidcSecurityService.userData$;

    this.oidcSecurityService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;

      console.info('authenticated: ', isAuthenticated);
    });

    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
      console.log(isAuthenticated);
      console.log(userData);
      console.log(accessToken);
      console.log(errorMessage);
    });
  }

  loginWithPopup() {
    const urlHandler = function(url: string) {
      console.log('urlHandler: '+url);
    }
    var orgOpen = window.open;
    window.open = function (url, name, features) {
      console.log('window open url: ' + url);
      var _url = new URL(url as string);
      _url.searchParams.delete('nonce');
      return orgOpen(_url.toString(), name, features);
    }
    this.oidcSecurityService.authorizeWithPopUp({ urlHandler })
      .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
      console.log(isAuthenticated);
      console.log(userData);
      console.log(accessToken);
      console.log(errorMessage);
    });
    window.open = orgOpen;
  }

  openWindow() {
    window.open('/', '_blank');
  }

  forceRefreshSession() {
    this.oidcSecurityService.forceRefreshSession().subscribe((result) => console.warn(result));
  }

  logout() {
    this.oidcSecurityService.logoff();
  }

}
