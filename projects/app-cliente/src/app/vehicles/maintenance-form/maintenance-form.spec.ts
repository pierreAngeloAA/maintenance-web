import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { MaintenanceForm } from './maintenance-form';
import { Vehicle } from '../../core/vehicle.model';
import { environment } from '@shared/environments/environment';

describe('MaintenanceForm', () => {
  let fixture: ComponentFixture<MaintenanceForm>;
  let component: MaintenanceForm;
  let httpMock: HttpTestingController;
  let navigate: jasmine.Spy;
  const baseUrl = `${environment.apiUrl}/api/v1/client`;

  const vehicle: Vehicle = {
    id: 7,
    vehicleType: 'motorcycle',
    make: 'AKT',
    model: 'NKD 125',
    modelYear: 2021,
    vin: null,
    plate: 'ABC12D',
    usageValue: '18000.0',
    usageUnit: 'km',
    city: 'Medellin',
    specs: {},
    createdAt: '2026-08-24T19:56:42.968Z',
    updatedAt: '2026-08-24T19:56:42.968Z',
    partTypes: [
      { id: 1, code: 'drive_chain', name: 'Cadena de transmision', category: 'transmission', applicableVehicleTypes: ['motorcycle'] },
      { id: 2, code: 'engine_oil', name: 'Aceite de motor', category: 'fluids', applicableVehicleTypes: ['car', 'motorcycle'] },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '7']]) } } },
      ],
    }).compileComponents();

    // Router real (el template usa routerLink) con espia solo sobre navigate.
    navigate = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(MaintenanceForm);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function loadVehicle() {
    httpMock.expectOne(`${baseUrl}/vehicles/7`).flush(vehicle);
    fixture.detectChanges();
  }

  it('solo ofrece las piezas que lleva ese vehiculo', () => {
    loadVehicle();

    const options = fixture.nativeElement.querySelectorAll('select[formControlName="partTypeId"] option');
    const labels = Array.from(options).map((option) => (option as HTMLOptionElement).textContent?.trim());

    expect(labels).toContain('Cadena de transmision');
    expect(labels).not.toContain('Correa de repartición');
  });

  it('prellena el uso con el uso actual del vehiculo, editable', () => {
    loadVehicle();

    expect(component.form.controls.usageAtService.value).toBe(18000);
    expect(component.form.controls.usageAtService.disabled).toBeFalse();
  });

  it('arranca invalido: falta escoger la pieza', () => {
    loadVehicle();

    expect(component.form.invalid).toBeTrue();
  });

  it('es valido con pieza, fecha y uso', () => {
    loadVehicle();

    component.form.patchValue({ partTypeId: 1, performedOn: '2026-07-15', usageAtService: 12000 });

    expect(component.form.valid).toBeTrue();
  });

  it('rechaza un mantenimiento con fecha futura', () => {
    loadVehicle();
    const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    component.form.patchValue({ partTypeId: 1, performedOn: manana, usageAtService: 12000 });

    expect(component.form.controls.performedOn.hasError('max')).toBeTrue();
  });

  it('rechaza un uso mayor al del vehiculo antes de llamar al API', () => {
    loadVehicle();

    component.form.patchValue({ partTypeId: 1, performedOn: '2026-07-15', usageAtService: 20000 });

    expect(component.form.controls.usageAtService.hasError('max')).toBeTrue();
  });

  it('registra el mantenimiento y vuelve al detalle', () => {
    loadVehicle();
    component.form.patchValue({
      partTypeId: 1,
      performedOn: '2026-07-15',
      usageAtService: 12000,
      partBrand: 'DID',
    });

    component.submit();

    const req = httpMock.expectOne(`${baseUrl}/vehicles/7/maintenance_records`);
    expect(req.request.body.maintenanceRecord.partTypeId).toBe(1);
    expect(req.request.body.maintenanceRecord.partBrand).toBe('DID');
    req.flush({ id: 1 }, { status: 201, statusText: 'Created' });

    expect(navigate).toHaveBeenCalledWith(['/vehicles', 7]);
  });

  it('no envia nada si el formulario es invalido, pero dice que falta', () => {
    loadVehicle();

    component.submit();
    fixture.detectChanges();

    httpMock.expectNone(() => true);
    expect(fixture.nativeElement.querySelectorAll('.maintenance-form__error').length).toBeGreaterThan(0);
  });

  it('avisa cuando el guardado falla por algo que no es validacion', () => {
    loadVehicle();
    component.form.patchValue({ partTypeId: 1, performedOn: '2026-07-15', usageAtService: 12000 });

    component.submit();
    httpMock
      .expectOne(`${baseUrl}/vehicles/7/maintenance_records`)
      .flush('', { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos guardar');
  });

  it('muestra los errores por campo que devuelve el API', () => {
    loadVehicle();
    component.form.patchValue({ partTypeId: 1, performedOn: '2026-07-15', usageAtService: 12000 });

    component.submit();

    httpMock.expectOne(`${baseUrl}/vehicles/7/maintenance_records`).flush(
      { errors: { partType: ['is not included in the list'] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pieza');
  });

  it('muestra un error si no se puede cargar el vehiculo', () => {
    httpMock.expectOne(`${baseUrl}/vehicles/7`).flush('', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar');
  });
});
