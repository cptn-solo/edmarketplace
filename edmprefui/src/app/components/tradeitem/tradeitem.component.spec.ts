import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeitemComponent } from './tradeitem.component';

describe('TradeitemComponent', () => {
  let component: TradeitemComponent;
  let fixture: ComponentFixture<TradeitemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradeitemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
