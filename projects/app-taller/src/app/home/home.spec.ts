import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';

describe('Home (taller)', () => {
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Home] }).compileComponents();
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  it('explica que todavia no hay pantallas', () => {
    expect(fixture.nativeElement.textContent).toContain('Taller');
    expect(fixture.nativeElement.textContent).toContain('Todavia no hay pantallas');
  });
});
