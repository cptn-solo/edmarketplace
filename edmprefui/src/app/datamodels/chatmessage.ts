export interface ChatMessage {
    myOfferId: string;
    tokenhash: string; // receiver in outbound and sender in inbound messages
    offerId: string;
    inbound: boolean;
    date: number; // timestamp
    text: string;
}