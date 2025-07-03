import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx is loading...');

try {
  const root = createRoot(document.getElementById("root")!);
  console.log('Root created, rendering App...');
  root.render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  document.body.innerHTML = '<h1 style="color: red;">Error loading app. Check console.</h1>';
}
