import { TradeItem } from "./tradeitem";

export interface Trade {
    id: string;
    items: Array<TradeItem>;
}