import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-tradeitem',
  templateUrl: './tradeitem.component.html',
  styleUrls: ['./tradeitem.component.scss']
})
export class TradeitemComponent implements OnInit {

  @Input() demand: boolean = true;
  @Input() itemid?: string;
  @Input() quantity?: number;
  @Input() color?: string;
  @Input() readonly: boolean = true;

  @Output() onChange = new EventEmitter<number>()

  constructor() { }

  ngOnInit(): void {
  }

}
