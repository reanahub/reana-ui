/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import client from "~/client";
import { loadUser, loadConfig, USER_SIGNEDOUT } from "~/actions";
import App from "./components/App";

import "semantic-ui-less/semantic.less";

client.setOnUnauthorized(() => {
  store.dispatch({ type: USER_SIGNEDOUT });
});

function fetchInitialData(store) {
  store.dispatch(loadUser());
  store.dispatch(loadConfig());
}

fetchInitialData(store);

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
