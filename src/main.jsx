import './shadcn.css';
import './global.css';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App.jsx";
import { SessionProvider } from "./components/SessionProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter><SessionProvider><App /></SessionProvider></BrowserRouter>
  </StrictMode>,
);
