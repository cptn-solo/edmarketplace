import { TestBed } from '@angular/core/testing';

import { EdmpwsapiService } from './edmpwsapi.service';

describe('EdmpwsapiService', () => {
  let service: EdmpwsapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EdmpwsapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
