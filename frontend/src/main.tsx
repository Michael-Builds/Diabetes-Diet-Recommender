import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { LayoutProvider } from './components/Context.tsx'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <LayoutProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LayoutProvider>
  </React.StrictMode>,
)