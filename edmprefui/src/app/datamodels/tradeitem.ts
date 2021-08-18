export interface TradeItem {
    tradeid: number; // trade line number
    sid: string; // supply item id
    sname: string; // supply item name
    sstock: number; // supply item stock
    supply: number; // supply items count
    did: string; // demand item id
    dname: string; // demand item name
    dstock: number; // demand item stock
    demand: number; // demand items count
}