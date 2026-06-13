export const APP_NAME = 'LinguaChat';
export const MAX_ROOM_USERS = 4;
export const SERVER_URL = import.meta.env.PROD
  ? window.location.origin  // In production, backend serves the frontend
  : 'http://localhost:3001'; // In development, separate servers
