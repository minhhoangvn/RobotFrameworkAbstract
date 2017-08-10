import React from 'react';
import ReactDOM from 'react-dom';
import { LoginStore } from './js/store/index';
import { Provider } from 'react-redux';
import Login from './js/containers/Login';

ReactDOM.render(
    <Provider store={LoginStore}>
        <Login />
    </Provider>
    , document.getElementById('login'));


