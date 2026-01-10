import * as React from "react";
import { createRoot } from "react-dom/client";
import { AppContainer } from "./components/AppContainer";
import "./index.css";

const appElement = document.getElementById("app");

if (appElement != null) {
	const root = createRoot(appElement);
	root.render(<AppContainer />);
}
