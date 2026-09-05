import { Component } from '@angular/core';

/**
 * Pantalla de entrada del taller. Todavia no tiene funcionalidad propia: las
 * pantallas de verdad llegan con el flujo de servicios y el catalogo. Existe
 * para que la app arranque, se pueda iniciar sesion y se pueda cambiar de
 * contexto desde el dia uno.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly description = 'Servicios, inspecciones y clientes';
}
