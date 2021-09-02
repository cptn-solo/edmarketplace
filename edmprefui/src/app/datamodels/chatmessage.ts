export interface ChatMessage {
    myOfferId: string;
    offerId: string;
    inbound: boolean;
    date: number; // timestamp
    text: string;
}