import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeitemslistComponent } from './tradeitemslist.component';

describe('TradeitemslistComponent', () => {
  let component: TradeitemslistComponent;
  let fixture: ComponentFixture<TradeitemslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradeitemslistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeitemslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
