import React from 'react';
import ReactDOM from 'react-dom';
import LoginPage from './js/LoginPage';
import {configureStore} from './redux/store';
import * as actions from './redux/actions';
import {Provider} from 'react-redux';

const stubLoginData = {"token": "dasfr342dasda","user":"Stub UserName","pass":"Stub password"};
const store = configureStore();
store.dispatch(actions.getSessionId(stubLoginData));
ReactDOM.render(
    <Provider store={store}>
        <LoginPage />
    </Provider>,
document.getElementById('login'));


