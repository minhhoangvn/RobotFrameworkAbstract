import React from 'react';
import ReactDOM from 'react-dom';

const NavigationComponent = (props)=>
{
     return (
        <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
            <div className="container">
                <div className="navbar-header">
                     <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar"
                    aria-expanded="false" aria-controls="navbar">
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <a className="navbar-brand" href={props.url}>Automation System</a>
                </div>
            </div>
        </nav>
     );
}

ReactDOM.render(<NavigationComponent url="/home"/>,document.getElementById('nav'));