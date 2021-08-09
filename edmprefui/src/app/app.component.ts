import { Component } from '@angular/core';
import { EdmpwsapiService } from './edmpwsapi.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ED Market Place Reference UI';
  connected: boolean = false;
  connectdisabled: boolean = false;
  disconnectdisabled: boolean = false;

  constructor (private service: EdmpwsapiService) {

  }
  connect() {
    this.connectdisabled = true;
    this.service.connect().subscribe();
    this.connected = true;
    this.connectdisabled = false;
  }

  disconnect() {
    this.disconnectdisabled = true;
    this.service.connect().unsubscribe();
    this.connected = false;
    this.disconnectdisabled = false;
  }
}
