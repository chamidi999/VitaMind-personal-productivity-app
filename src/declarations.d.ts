declare module 'react-dom/client';
declare module 'cors';
declare module 'express-rate-limit';
declare module '*.css';
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}