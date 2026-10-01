// Entorno de desarrollo (local)
// Para apuntar a un backend en otro puerto sin tocar este archivo:
//   npx ng serve dashboard --define AVALTRUST_API_URL="'http://localhost:8081'"
declare const AVALTRUST_API_URL: string | undefined;

export const environment = {
  production: false,
  apiUrl: typeof AVALTRUST_API_URL === 'string' ? AVALTRUST_API_URL : 'http://localhost:8080'
};
