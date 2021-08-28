import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MytradeitemseditComponent } from './mytradeitemsedit.component';

describe('MytradeitemseditComponent', () => {
  let component: MytradeitemseditComponent;
  let fixture: ComponentFixture<MytradeitemseditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MytradeitemseditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MytradeitemseditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
