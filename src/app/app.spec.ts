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

  it('tiene pie de pagina con la marca y el anio', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.app-footer') as HTMLElement;

    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain('Maintenance');
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
  });

  it('el pie enlaza a los dos repos, porque el proyecto es open source', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('.app-footer a')).map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );

    expect(hrefs).toContain('https://github.com/pierreAngeloAA/maintenance-api');
    expect(hrefs).toContain('https://github.com/pierreAngeloAA/maintenance-web');
  });

  it('el pie aclara que las probabilidades son estimaciones y no reemplazan a un mecanico', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.app-footer') as HTMLElement;

    expect(footer.textContent).toContain('estimaciones');
    expect(footer.textContent).toContain('mecanico');
  });

  it('deja un router-outlet para las rutas de la app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
