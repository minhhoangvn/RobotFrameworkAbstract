import React from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'
import { GetSessionId } from '../js/auth'
import { LoginForm } from 'Components/Forms/LoginForm'
import { InputElement } from 'Components/InteractiveComponents/Input'
import '../static/animate.css'
import '../static/style.css'

const InputHiddenProps = (csrftoken) => {
    return {
        type: "hidden",
        name: "csrfmiddlewaretoken",
        value: csrftoken,
        readOnly: true
    };
}


const LoginFormsProps = (handleSubmit) => {
    return {
        id: "login-form",
        action: "/account/login/?next=/login/",
        method: "post",
        onSubmit: handleSubmit
    };
}

const InputUserNameProps = (handleChange) => {
    return {
        type: 'text',
        placeholder: 'username',
        maxLength: 254,
        id: 'username',
        name: 'username',
        onChange: handleChange
    };
}

const InputPasswordProps = (handleChange) => {
    return {
        type: 'password',
        placeholder: '*********',
        maxLength: 254,
        id: 'password',
        name: 'password',
        onChange: handleChange
    };
}

const LoginButtonProps = (handleClick) => {
    return {
        type: "submit",
        buttonName: "Sign In",
        onClick: handleClick
    };
}

export default class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            defaultvalue: '',
            username: '',
            password: '',
            errorMessage: ''
        };
        this.csrftoken = Cookies.get('csrftoken');
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        $(document).ready(function () {
            $('#title').removeClass('hidden');
            $('#logo').addClass('animated fadeInDown');
            $("input:text:visible:first").focus();
        });
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.validateLoginData())
            {
                this.diplayedErrorMessage();
                return false;
            }
        LoginController.getSessionId(this.csrftoken, this.state.username, this.state.password);
    }

    handleClick(event) {
        this.setState({
            ['errorMessage']: ""
        });
        this.removeCssOnElement();
    }

    validateLoginData() {
        return (this.state.password.length == 0 || this.state.username.length == 0)
    }

    diplayedErrorMessage() {
        this.setState({
            ['errorMessage']: "User name and password is required field"
        })
        this.addCssOnValidateElement();
    }

    removeCssOnElement() {
        $('#errorMessage').removeClass('error-message-style-label');
        $('#username').removeClass('error-message-style-input');
        $('#password').removeClass('error-message-style-input');
    }

    addCssOnValidateElement() {
        $('#errorMessage').addClass('error-message-style-label');
        if (this.state.username.length == 0)
            $('#username').addClass('error-message-style-input');
        if (this.state.password.length == 0)
            $('#password').addClass('error-message-style-input');
    }

    render() {
        return (
            <div>
                <CSSTransitionGroup
                    transitionName={{
                        enter: 'animated',
                        leave: 'fadeInUp',
                        appear: 'fadeInDown'
                    }}
                    transitionAppear={true}
                    transitionAppearTimeout={500}
                    transitionEnter={true}
                    transitionEnterTimeout={1000}
                    transitionLeave={true}
                    transitionLeaveTimeout={1500}
                >
                    <div className="top">
                        <h1 id="title" className="hidden"><span id="logo">Automation System</span></h1>
                    </div>
                    <div className="login-box animated fadeInUp">
                        <div className="box-header">
                            <h2>Log In</h2>
                        </div>
                        <LoginForm 
                        errorMessage ={this.state.errorMessage}
                        loginFormsProps={LoginFormsProps(this.handleSubmit)} 
                        inputHiddenProps={InputHiddenProps(this.csrftoken)}
                        inputUserNameProps={InputUserNameProps(this.handleChange)}
                        inputPasswordProps={InputPasswordProps(this.handleChange)}
                        loginButtonProps={LoginButtonProps(this.handleClick)}
                        />
                    </div>
                </CSSTransitionGroup>
            </div>
        );
    }
}
