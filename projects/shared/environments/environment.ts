export const environment = {
  production: true,
  apiUrl: 'https://maintenance-api.onrender.com',
  // Las tres apps se sirven bajo el mismo dominio: basta el prefijo de ruta.
  appUrls: {
    client: '/cliente/',
    workshop: '/taller/',
    store: '/almacen/',
  },
};
