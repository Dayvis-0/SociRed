import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendsCard } from './friends-card';

describe('FriendsCard', () => {
  let component: FriendsCard;
  let fixture: ComponentFixture<FriendsCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendsCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendsCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
