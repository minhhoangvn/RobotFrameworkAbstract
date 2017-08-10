import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './js/homepage';


const homePage = () => {
    console.log("render home page 1");
    ReactDOM.render(<HomePage />, document.getElementById('homepage'));
};

const homePage1 = () => {
    console.log("invoke render home page 1");
    (() => {
        setTimeout(function (
        ) {
            console.log("Start render home page 1");
            ReactDOM.render(<HomePage />, document.getElementById('homepage1'));
        }, 5000);
    })();
};

const homePage2 = () => {
    console.log("invoke render home page 2");
    (() => {
        setTimeout(function (
        ) {
            console.log("Start render home page 2");
            ReactDOM.render(<HomePage />, document.getElementById('homepage2'));
        }, 15000);
    })();
};
const homePage3 = () => {
    console.log("invoke render home page 3");
    (() => {
        setTimeout(function (
        ) {
            console.log("Start render home page 3");
            ReactDOM.render(<HomePage />, document.getElementById('homepage3'));
        }, 3000);
    })();
};
(() => {
    console.log("Start render page " + (new Date().getTime()));
    homePage();
    homePage1();
    homePage2();
    homePage3();
    console.log("End render page " + (new Date().getTime()));
})()
