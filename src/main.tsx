
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'

// Ensure we have a valid DOM element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Create root and render the app
const root = createRoot(rootElement);
root.render(<App />);
