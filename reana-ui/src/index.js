/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store";
import { loadUser, loadConfig } from "~/actions";
import App from "./components/App";

import "semantic-ui-less/semantic.less";

function fetchInitialData(store) {
  store.dispatch(loadUser());
  store.dispatch(loadConfig());
}

fetchInitialData(store);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
