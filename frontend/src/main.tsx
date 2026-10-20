import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LazyMotion, domAnimation } from 'motion/react';
import './i18n';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <LazyMotion features={domAnimation}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LazyMotion>
    </HelmetProvider>
  </React.StrictMode>,
);
