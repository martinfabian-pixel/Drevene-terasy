import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import '@fontsource/open-sans/latin-400.css';
import '@fontsource/open-sans/latin-ext-400.css';
import '@fontsource/open-sans/latin-600.css';
import '@fontsource/open-sans/latin-ext-600.css';
import '@fontsource/open-sans/latin-700.css';
import '@fontsource/open-sans/latin-ext-700.css';
import './styles.css';
import './styles/design-system.css';
import './styles/technical-drawings.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>,
);
