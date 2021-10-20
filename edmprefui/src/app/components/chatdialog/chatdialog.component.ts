import { AfterViewChecked, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { ChatMessage } from 'src/app/datamodels/chatmessage';
import { BidStage, Offer, OfferChangeType, XBidStage } from 'src/app/datamodels/userinfo';
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
  myOfferId: string = '';
  receiverTokenHash: string = '';
  senderTokenHash: string = '';
  contextOfferId: string = '';

  private ngUnsubscribe = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      offer: Offer,
      myOfferId: string,
      contextOfferId: string, // id of an offer being negotiated
      receiverTokenHash: string,
      senderTokenHash: string
    },
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
          case OfferChangeType.XBIDPUSH:
          case OfferChangeType.XBIDPULL:
          case OfferChangeType.XBIDACCEPT: {
            if (this.offer.offerId === val.offerIds[0]) { // outbound xbid
              this.offer = this.state.getOfferById(this.offer.offerId) ?? defaultOffer;
              var xbidstage = this.offers.checkOfferXBidStage(this.offer);
              this.canSend = xbidstage === XBidStage.XMESSAGE;
            } else if (this.myOfferId === val.offerIds[0]) { // inbound xbid
              // we don't have to update current offer as it is just a placeholder for chat
              // the whole chat should be revisited to support inbound xbids as a separate
              // message queue linked to users but not to some particular offers
              var xbidstage = this.offers.checkOfferXBidStage(this.offer);
              this.canSend = xbidstage === XBidStage.XMESSAGE || xbidstage === XBidStage.XDECLINE;
            }
            break;
          }
          case OfferChangeType.MESSAGE: {
            if (this.contextOfferId === val.offerIds[0]) {
              this.messages = this.state.getMessagesByOfferId(this.contextOfferId);
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
      myOfferId: this.myOfferId,
      offerId: this.contextOfferId,
      tokenhash: this.receiverTokenHash,
      text: this.message.substring(0, 200),
      inbound: true,
      date: new Date().getTime()
    };
    var added = this.receiverTokenHash.length > 0 ?
      this.offers.sendXChatMessage(message) :
      this.offers.sendChatMessage(message);
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
    this.myOfferId = this.data.myOfferId;
    this.receiverTokenHash = this.data.receiverTokenHash;
    this.senderTokenHash = this.data.senderTokenHash;
    this.contextOfferId = this.data.contextOfferId;
    this.messages = this.state.getMessagesByOfferId(this.offer.offerId);
    this.connected = this.api.connected$.value;
    this.canSend = this.offer.connectionId.length > 0;
    if (this.canSend) {
      var bidstage = this.offers.checkOfferBidStage(this.offer);
      var xbidStage = this.offers.checkOfferXBidStage(this.offer);
      this.canSend = bidstage === BidStage.MESSAGE || xbidStage === XBidStage.XMESSAGE || xbidStage === XBidStage.XDECLINE;
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
