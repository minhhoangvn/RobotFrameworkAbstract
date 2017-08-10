import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './js/homepage';


const homePage = () => {
    ReactDOM.render(<HomePage />, document.getElementById('homepage'))
};
(() => {
    homePage();
})()