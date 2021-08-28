import { AfterViewChecked, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { ChatMessage } from 'src/app/datamodels/chatmessage';
import { BidStage, Offer, OfferChangeType } from 'src/app/datamodels/userinfo';
import { EdmpwsapiService } from 'src/app/services/edmpwsapi.service';
import { OfferService } from 'src/app/services/offer.service';
import { StateService } from 'src/app/services/state.service';

const defaultOffer = { info: { nickname: 'unknown', location: 'unknown' }, bids: [], offerId: '' } as unknown as Offer;

@Component({
  selector: 'app-chatdialog',
  templateUrl: './chatdialog.component.html',
  styleUrls: ['./chatdialog.component.scss']
})
export class ChatdialogComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatView') private chatView?: ElementRef;

  message: string = '';
  canSend: boolean = false;
  connected: boolean = false;
  messages: Array<ChatMessage> = [];
  offer = defaultOffer;

  private ngUnsubscribe = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { offer: Offer},
    private api: EdmpwsapiService,
    private offers: OfferService,
    private state: StateService) {

    this.api.connected$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        this.connected = val;
      });

    this.offers.offerChanged$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        if (!val) return;

        switch (val.change) {
          case OfferChangeType.OFFLINE:
          case OfferChangeType.DROP: {
            if (val.offerIds.findIndex(offerId => this.offer.offerId === offerId) >= 0) {
              this.canSend = false;
              if (val.change === OfferChangeType.DROP)
                this.offer = defaultOffer;
            }
            break;
          }
          case OfferChangeType.ONLINE: {
            if (val.offerIds.findIndex(offerId => this.offer.offerId === offerId) >= 0) {
              var bidstage = this.offers.checkOfferBidStage(this.offer);
              this.canSend = bidstage === BidStage.MESSAGE;
            }
            break;
          }
          case OfferChangeType.BIDPUSH:
          case OfferChangeType.BIDPULL: {
            if (this.offer.offerId === val.offerIds[0] ||
              this.offer.bids.findIndex(bid => bid === val.offerIds[0]) >= 0) {
              this.offer = this.state.getOfferById(this.offer.offerId) ?? defaultOffer;
              var bidstage = this.offers.checkOfferBidStage(this.offer);
              this.canSend = bidstage === BidStage.MESSAGE;
            }
            break;
          }
          case OfferChangeType.MESSAGE: {
            if (this.offer.offerId === val.offerIds[0]) {
              this.messages = this.state.getMessagesByOfferId(this.offer.offerId);
            }
            break;
          }
          default: {
            break;
          }
        }
      });
    }

  sendMessage() {
    if (!this.connected || !this.canSend) return;
    var message = {
      offerId: this.offer.offerId,
      text: this.message.substring(0, 200),
      inbound: true,
      date: new Date().getTime()
    };
    var added = this.offers.sendChatMessage(message);
    this.messages.push(added);
    this.message = '';
  }

  scrollToBottom(): void {
    try {
      if (this.chatView)
        this.chatView.nativeElement.scrollTop = this.chatView.nativeElement.scrollHeight;
    } catch(err) { }
  }

  /* lifesycle */
  ngOnInit(): void {
    this.offer = this.data.offer;
    this.messages = this.state.getMessagesByOfferId(this.offer.offerId);
    this.connected = this.api.connected$.value;
    this.canSend = this.offer.connectionId.length > 0;
    if (this.canSend) {
      var bidstage = this.offers.checkOfferBidStage(this.offer);
      this.canSend = bidstage === BidStage.MESSAGE;
    }
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
