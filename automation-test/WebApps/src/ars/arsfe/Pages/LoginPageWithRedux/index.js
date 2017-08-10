import React from 'react';
import ReactDOM from 'react-dom';
import { store } from './store/index';
import * as actions from './actions';
import { Provider } from 'react-redux';
import FormLogin from './FormLogin';

ReactDOM.render(
    <Provider store={store}>
        <FormLogin />
    </Provider>
    ,document.getElementById('login'));


