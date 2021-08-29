import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyidComponent } from './myid.component';

describe('MyidComponent', () => {
  let component: MyidComponent;
  let fixture: ComponentFixture<MyidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
