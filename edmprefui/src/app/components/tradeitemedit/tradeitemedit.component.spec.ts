import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeitemeditComponent } from './tradeitemedit.component';

describe('TradeitemeditComponent', () => {
  let component: TradeitemeditComponent;
  let fixture: ComponentFixture<TradeitemeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradeitemeditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeitemeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
