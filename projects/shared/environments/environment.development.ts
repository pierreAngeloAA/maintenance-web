export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  /**
   * Donde vive cada app. En desarrollo son tres servidores en tres puertos, asi
   * que cambiar de contexto cruza de origen y la ruta sola no alcanza. En
   * produccion las tres salen del mismo dominio y basta el prefijo.
   *
   * La barra final no es cosmetica: sin ella el servidor responde con un aviso
   * de base URL en vez de la app.
   */
  appUrls: {
    client: 'http://localhost:4200/cliente/',
    workshop: 'http://localhost:4201/taller/',
    store: 'http://localhost:4202/almacen/',
  },
};
