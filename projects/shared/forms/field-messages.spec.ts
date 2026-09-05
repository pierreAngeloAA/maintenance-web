import { FIELD_LABELS, translateError } from '@shared/forms/field-messages';

describe('field-messages', () => {
  it('traduce los errores conocidos de Rails al espanol', () => {
    expect(translateError("can't be blank")).toBe('no puede quedar vacio');
    expect(translateError('has already been taken')).toBe('ya esta registrado');
    expect(translateError('must be greater than or equal to 1900')).toBe(
      'esta por debajo del minimo permitido',
    );
  });

  it('cae en un mensaje generico si Rails manda algo que no conocemos', () => {
    expect(translateError('some unexpected activerecord message')).toBe('no es valido');
  });

  it('tiene etiqueta en espanol para cada campo del formulario', () => {
    expect(FIELD_LABELS['vin']).toBe('VIN');
    expect(FIELD_LABELS['modelYear']).toBe('Año');
  });
});
