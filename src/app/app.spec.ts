import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('crea el componente raiz', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el nombre de la aplicacion en el encabezado', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Maintenance');
  });

  it('tiene una barra de navegacion con los accesos principales', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('.app-nav a')).map((link) =>
      (link as HTMLElement).textContent?.trim(),
    );

    expect(links).toContain('Mis vehiculos');
    expect(links).toContain('Registrar vehiculo');
  });

  it('deja un router-outlet para las rutas de la app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
