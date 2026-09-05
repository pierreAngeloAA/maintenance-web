import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AppNavigator } from '@shared/core/app-navigator';
import { ActorContext } from '@shared/core/context.model';
import { ContextService } from '@shared/core/context.service';
import { ContextSwitcher } from './context-switcher';

describe('ContextSwitcher', () => {
  let fixture: ComponentFixture<ContextSwitcher>;
  let context: ContextService;
  let navigator: jasmine.SpyObj<AppNavigator>;

  const client: ActorContext = { kind: 'client' };
  const workshop: ActorContext = {
    kind: 'workshop',
    organizationId: 12,
    name: 'Taller El Rayo',
    role: 'owner',
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ContextSwitcher],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppNavigator, useValue: jasmine.createSpyObj('AppNavigator', ['go']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextSwitcher);
    context = TestBed.inject(ContextService);
    navigator = TestBed.inject(AppNavigator) as jasmine.SpyObj<AppNavigator>;
  });

  afterEach(() => localStorage.clear());

  function options(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  // La mayoria de la gente tiene un solo contexto y nunca deberia ver esto.
  it('no se muestra con un solo contexto', () => {
    context.contexts.set([client]);
    fixture.detectChanges();

    expect(options().length).toBe(0);
  });

  it('muestra una opcion por contexto', () => {
    context.contexts.set([client, workshop]);
    fixture.detectChanges();

    expect(options().map((b) => b.textContent?.trim())).toEqual([
      'Mis vehiculos',
      'Taller: Taller El Rayo',
    ]);
  });

  it('marca cual esta activo', () => {
    context.contexts.set([client, workshop]);
    context.select(workshop);
    fixture.detectChanges();

    expect(options()[1].getAttribute('aria-current')).toBe('true');
    expect(options()[0].getAttribute('aria-current')).toBeNull();
  });

  it('al elegir otro contexto lo guarda y navega a su app', () => {
    context.contexts.set([client, workshop]);
    context.select(client);
    fixture.detectChanges();

    options()[1].click();

    expect(context.active()).toEqual(workshop);
    expect(navigator.go).toHaveBeenCalledWith('/taller');
  });

  it('no navega si ya esta en ese contexto', () => {
    context.contexts.set([client, workshop]);
    context.select(workshop);
    fixture.detectChanges();

    options()[1].click();

    expect(navigator.go).not.toHaveBeenCalled();
  });
});
