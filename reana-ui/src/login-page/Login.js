import React from 'react';
import logo from '../images/logo-reana.svg';
import Head from '../commons/Header';
//import './Login.css';


function Sign_in() {
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
			</header>
		<h1 className="App-title">Welcome to React</h1>
		<p className="App-intro">
			To get started, edit <code>src/App.js</code> and save to reload.
		</p>
		</div>
	);
}



function Login() {
    return ([
	    Head(),
        Sign_in(),
    ]);
}


export default Login;
