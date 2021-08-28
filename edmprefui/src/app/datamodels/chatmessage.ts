export interface ChatMessage {
    offerId: string;
    inbound: boolean;
    date: number; // timestamp
    text: string;
}