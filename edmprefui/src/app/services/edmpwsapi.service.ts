import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';

import { catchError, tap, switchAll, map } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';

export const WS_ENDPOINT = environment.wsEndpoint;

@Injectable({
  providedIn: 'root'
})
export class EdmpwsapiService {
  private socket$!: WebSocketSubject<any>;
  private messagesSubject$ = new Subject<any>();
  public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e }));
  public connected$ = new BehaviorSubject<boolean>(false);

  constructor() {
  }

  public connect() {
    if (!this.connected$.value || !this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      const messages = this.socket$.pipe(
        tap({
          error: error => console.log(error),
        }),
        map<any, any>(rows => rows.data),
        catchError(error => { throw error }),
        tap({
          error: error => console.log('[Live component] Error:', error),
          complete: () => console.log('[Live component] Connection Closed')
        }
      ));
      this.messagesSubject$.next(messages);
      // MUST subscribe from the app component to prevent pipe from being released
    }
  }

  public sendMessage(msg: any) {
    this.socket$.next(msg);
  }

  public close() {
    this.socket$.unsubscribe();
    this.socket$.complete();
  }

  private getNewWebSocket() {
    return webSocket({
      url: WS_ENDPOINT,
      deserializer: (data) => data,
      openObserver: {
        next: () => {
          this.connected$.next(true);
          console.log('[DataService]: connection opened');
        }
      },
      closeObserver: {
        next: () => {
          this.connected$.next(false);
          this.socket$.closed = true;
          console.log('[DataService]: connection closed');
        }
      },
    });
  }
}
