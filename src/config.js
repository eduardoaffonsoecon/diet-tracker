// Configuração do Firebase Realtime Database.
// Pode ser sobrescrita por variáveis de ambiente (arquivo .env local ou painel da Vercel);
// sem elas, valem os valores abaixo.
export const FIREBASE_DATABASE_URL =
  import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://diet-tracker-eduardo-default-rtdb.firebaseio.com';

// Quem usar o mesmo ID (por exemplo, o nutricionista) vê os mesmos dados.
export const USER_ID = import.meta.env.VITE_USER_ID || 'eduardoaffonso';
