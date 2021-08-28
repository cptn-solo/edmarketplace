import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyinfoeditComponent } from './myinfoedit.component';

describe('MyinfoeditComponent', () => {
  let component: MyinfoeditComponent;
  let fixture: ComponentFixture<MyinfoeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyinfoeditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyinfoeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
