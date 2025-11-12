import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendsHeader } from './friends-header';

describe('FriendsHeader', () => {
  let component: FriendsHeader;
  let fixture: ComponentFixture<FriendsHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendsHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendsHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
