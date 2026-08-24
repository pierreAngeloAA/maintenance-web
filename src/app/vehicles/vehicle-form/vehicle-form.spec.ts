import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { VehicleForm } from './vehicle-form';
import { environment } from '../../../environments/environment';

describe('VehicleForm', () => {
  let fixture: ComponentFixture<VehicleForm>;
  let component: VehicleForm;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const baseUrl = `${environment.apiUrl}/api/v1`;

  const validValues = {
    vehicleType: 'motorcycle' as const,
    make: 'AKT',
    model: 'NKD 125',
    modelYear: 2021,
    vin: '',
    plate: 'ABC12D',
    usageValue: 12000,
    city: 'Medellin',
  };

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VehicleForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleForm);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  describe('validacion', () => {
    it('arranca invalido y con el boton deshabilitado', () => {
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(component.form.invalid).toBeTrue();
      expect(button.disabled).toBeTrue();
    });

    it('es valido sin VIN: asi se registra una moto colombiana', () => {
      component.form.setValue(validValues);

      expect(component.form.valid).toBeTrue();
    });

    it('rechaza un VIN de menos de 17 caracteres', () => {
      component.form.setValue({ ...validValues, vin: '1HGBH41JXMN' });

      expect(component.form.valid).toBeFalse();
      expect(component.form.controls.vin.hasError('pattern')).toBeTrue();
    });

    it('rechaza un VIN con I, O o Q', () => {
      component.form.setValue({ ...validValues, vin: '1HGBH41JXMN10918I' });

      expect(component.form.valid).toBeFalse();
    });

    it('acepta un VIN valido de 17 caracteres', () => {
      component.form.setValue({ ...validValues, vin: '5YJ3E1EA6PF384836' });

      expect(component.form.valid).toBeTrue();
    });

    it('exige marca, modelo y ano', () => {
      component.form.setValue({ ...validValues, make: '', model: '', modelYear: null as never });

      expect(component.form.valid).toBeFalse();
    });

    it('rechaza un uso negativo', () => {
      component.form.setValue({ ...validValues, usageValue: -1 });

      expect(component.form.valid).toBeFalse();
    });
  });

  describe('autocompletado por VIN', () => {
    it('prellena marca, modelo y ano cuando el API reconoce el VIN', () => {
      component.form.controls.vin.setValue('JH2PC35051M200020');

      component.onVinBlur();

      httpMock.expectOne(`${baseUrl}/vin_lookups/JH2PC35051M200020`).flush({
        vin: 'JH2PC35051M200020',
        found: true,
        make: 'HONDA',
        model: 'CBR600F',
        modelYear: 2001,
        vehicleType: 'motorcycle',
      });

      expect(component.form.controls.make.value).toBe('HONDA');
      expect(component.form.controls.model.value).toBe('CBR600F');
      expect(component.form.controls.modelYear.value).toBe(2001);
      expect(component.form.controls.vehicleType.value).toBe('motorcycle');
    });

    it('deja los campos prellenados editables', () => {
      component.form.controls.vin.setValue('JH2PC35051M200020');
      component.onVinBlur();
      httpMock.expectOne(`${baseUrl}/vin_lookups/JH2PC35051M200020`).flush({
        vin: 'JH2PC35051M200020',
        found: true,
        make: 'HONDA',
        model: 'CBR600F',
        modelYear: 2001,
        vehicleType: 'motorcycle',
      });

      expect(component.form.controls.make.disabled).toBeFalse();
    });

    it('no consulta el API si el VIN esta vacio', () => {
      component.onVinBlur();

      httpMock.expectNone(() => true);
    });

    it('no consulta el API si el VIN tiene mal formato', () => {
      component.form.controls.vin.setValue('NOTAVIN');

      component.onVinBlur();

      httpMock.expectNone(() => true);
    });

    it('prellena solo los campos que NHTSA conoce y respeta el resto', () => {
      // Caso real: NHTSA a veces devuelve la marca pero deja el modelo vacio.
      component.form.patchValue({ model: 'Accord escrito a mano', vin: '1HGBH41JXMN109186' });

      component.onVinBlur();

      httpMock.expectOne(`${baseUrl}/vin_lookups/1HGBH41JXMN109186`).flush({
        vin: '1HGBH41JXMN109186',
        found: true,
        make: 'HONDA',
        model: null,
        modelYear: null,
        vehicleType: null,
      });

      expect(component.form.controls.make.value).toBe('HONDA');
      expect(component.form.controls.model.value).toBe('Accord escrito a mano');
      expect(component.form.controls.vehicleType.value).toBe('car');
    });

    it('no pisa lo que el usuario ya escribio cuando NHTSA no conoce el vehiculo', () => {
      component.form.patchValue({ make: 'AKT', model: 'NKD 125', vin: '9FBLSRB56KM123456' });

      component.onVinBlur();

      httpMock.expectOne(`${baseUrl}/vin_lookups/9FBLSRB56KM123456`).flush({
        vin: '9FBLSRB56KM123456',
        found: false,
        make: null,
        model: null,
        modelYear: null,
        vehicleType: null,
      });

      expect(component.form.controls.make.value).toBe('AKT');
      expect(component.form.controls.model.value).toBe('NKD 125');
    });

    it('avisa con un mensaje neutro, no con un error, cuando no reconoce el VIN', () => {
      component.form.controls.vin.setValue('9FBLSRB56KM123456');

      component.onVinBlur();

      httpMock.expectOne(`${baseUrl}/vin_lookups/9FBLSRB56KM123456`).flush({
        vin: '9FBLSRB56KM123456',
        found: false,
        make: null,
        model: null,
        modelYear: null,
        vehicleType: null,
      });
      fixture.detectChanges();

      expect(component.lookupMessage()).toContain('No pudimos');
      expect(fixture.nativeElement.querySelector('.vehicle-form__hint')?.textContent).toBeTruthy();
    });
  });

  describe('envio', () => {
    it('crea el vehiculo y navega al detalle', () => {
      component.form.setValue(validValues);

      component.submit();

      const req = httpMock.expectOne(`${baseUrl}/vehicles`);
      expect(req.request.body).toEqual({
        vehicle: {
          vehicleType: 'motorcycle',
          make: 'AKT',
          model: 'NKD 125',
          modelYear: 2021,
          vin: null,
          plate: 'ABC12D',
          usageValue: 12000,
          usageUnit: 'km',
          city: 'Medellin',
        },
      });
      req.flush({ id: 7 }, { status: 201, statusText: 'Created' });

      expect(router.navigate).toHaveBeenCalledWith(['/vehicles', 7]);
    });

    it('envia el VIN, la placa y la ciudad cuando el usuario si los llena', () => {
      component.form.setValue({ ...validValues, vin: '5YJ3E1EA6PF384836', city: 'Bogota' });

      component.submit();

      const req = httpMock.expectOne(`${baseUrl}/vehicles`);
      expect(req.request.body.vehicle.vin).toBe('5YJ3E1EA6PF384836');
      expect(req.request.body.vehicle.plate).toBe('ABC12D');
      expect(req.request.body.vehicle.city).toBe('Bogota');
      req.flush({ id: 8 }, { status: 201, statusText: 'Created' });
    });

    it('muestra el nombre crudo del campo si el API reporta uno que no conocemos', () => {
      component.form.setValue(validValues);

      component.submit();

      httpMock.expectOne(`${baseUrl}/vehicles`).flush(
        { errors: { somethingNew: ['is invalid'] } },
        { status: 422, statusText: 'Unprocessable Content' },
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('somethingNew');
    });

    it('no envia nada si el formulario es invalido', () => {
      component.submit();

      httpMock.expectNone(() => true);
    });

    it('muestra los errores por campo que devuelve el API', () => {
      component.form.setValue(validValues);

      component.submit();

      httpMock.expectOne(`${baseUrl}/vehicles`).flush(
        { errors: { vin: ['has already been taken'] } },
        { status: 422, statusText: 'Unprocessable Content' },
      );
      fixture.detectChanges();

      expect(component.serverErrors()['vin']).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('VIN');
    });

    it('deja de mostrar el estado de guardando cuando el API falla', () => {
      component.form.setValue(validValues);

      component.submit();
      httpMock.expectOne(`${baseUrl}/vehicles`).flush('', { status: 500, statusText: 'Server Error' });

      expect(component.saving()).toBeFalse();
    });
  });
});
