import { FormControl, Validators } from '@angular/forms';

import { controlErrorMessage } from '@shared/forms/form-errors';

describe('controlErrorMessage', () => {
  function touched(control: FormControl) {
    control.markAsTouched();
    return control;
  }

  it('no dice nada mientras el usuario no haya tocado el campo', () => {
    const control = new FormControl('', Validators.required);

    expect(controlErrorMessage('make', control)).toBeNull();
  });

  it('no dice nada si el campo es valido', () => {
    const control = touched(new FormControl('Renault', Validators.required));

    expect(controlErrorMessage('make', control)).toBeNull();
  });

  it('avisa cuando falta un dato obligatorio', () => {
    const control = touched(new FormControl('', Validators.required));

    expect(controlErrorMessage('make', control)).toBe('Este dato es obligatorio');
  });

  it('explica el formato del VIN en vez de decir solo formato invalido', () => {
    const control = touched(new FormControl('NOTAVIN', Validators.pattern(/^[A-HJ-NPR-Z0-9]{17}$/)));

    expect(controlErrorMessage('vin', control)).toContain('17 caracteres');
  });

  it('usa el mensaje especifico del campo cuando existe', () => {
    const control = touched(new FormControl(1800, Validators.min(1900)));

    expect(controlErrorMessage('modelYear', control)).toBe('El ano es muy antiguo');
  });

  it('cae en un mensaje generico ante un error que no conocemos", ', () => {
    const control = touched(new FormControl('x', () => ({ raro: true })));

    expect(controlErrorMessage('make', control)).toBe('Revisa este dato');
  });

  it('tolera un control que no existe', () => {
    expect(controlErrorMessage('make', null)).toBeNull();
  });
});
