import React from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import {connect} from 'react-redux';
import LoginController from './LoginController';
import LoginModel from './LoginModel';
import { LoginForm } from 'Components/Forms/LoginForm';
import { InputElement } from 'Components/InteractiveComponents/Input';
import '../static/animate.css';
import '../static/style.css';

class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        console.log("Props value ", props);
        this.state = {
            defaultvalue: '',
            username: '',
            password: '',
            errorMessage: '',
            userNameStyleName: null,
            passwordStyleName: null,
            labelErrorMessageStylename: null,
            titleStyleName: "hidden",
            logoStyleName: null
        };
        this.csrftoken = Cookies.get('csrftoken');
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.loginController = new LoginController();
        this.loginModel = new LoginModel("", "");
    }
    ErrorMessageLabel (message, styleName) {
    return {
        message: message,
        className: styleName
    }
}

    InputHiddenProps (csrftoken) {
        return {
            type: "hidden",
            name: "csrfmiddlewaretoken",
            value: csrftoken,
            readOnly: true
        };
    }

     LoginFormsProps  (handleSubmit)  {
        return {
            id: "login-form",
            action: "/account/login/?next=/login/",
            method: "post",
            onSubmit: handleSubmit
        };
    }

     InputUserNameProps  (handleChange, styleName)  {
        return {
            type: 'text',
            placeholder: 'username',
            maxLength: 254,
            id: 'username',
            name: 'username',
            className: styleName,
            onChange: handleChange
        };
    }

     InputPasswordProps  (handleChange, styleName)  {
        return {
            type: 'password',
            placeholder: '*********',
            maxLength: 254,
            id: 'password',
            name: 'password',
            className: styleName,
            onChange: handleChange
        };
    }

     LoginButtonProps  (handleClick)  {
        return {
            type: "submit",
            buttonName: "Sign In",
            onClick: handleClick
        };
    }
    componentDidMount() {
        this.setState(
            {
                titleStyleName: "",
                logoStyleName: "animated fadeInDown"
            }
        )
    }

    handleChange(event) {
        this.loginModel.updateModel(event.target.name, event.target.value)
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.validateLoginData()) {
            this.displayedErrorMessage();
            return false;
        }
        this.loginController.getSessionId(this.csrftoken, this.loginModel.userName, this.loginModel.password);
    }

    handleClick(event) {
        this.loginModel.updateErrorMessage("");
        this.removeCssOnElement();
    }

    validateLoginData() {
        return (this.loginModel.userName.length == 0 || this.loginModel.password.length == 0)
    }

    displayedErrorMessage() {
        this.loginModel.updateErrorMessage("User name and password is required field");
        this.addCssOnValidateElement();
    }

    removeCssOnElement() {

        this.setState({
            labelErrorMessageStyleName: '',
            userNameStyleName: '',
            passwordStyleName: ''
        })
    }

    addCssOnValidateElement() {
        let errorMessageStyle, userNameStyle, passwordStyle;
        errorMessageStyle, userNameStyle, passwordStyle = '';
        errorMessageStyle = 'error-message-style-label';
        if (this.loginModel.userName.length == 0)
            userNameStyle = 'error-message-style-input';
        if (this.loginModel.password.length == 0)
            passwordStyle = 'error-message-style-input';
        this.setState({
            labelErrorMessageStyleName: errorMessageStyle,
            userNameStyleName: userNameStyle,
            passwordStyleName: passwordStyle
        })

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
                        <h1 id="title" className={this.state.titleStyleName}>
                            <span id="logo" className={this.state.logoStyleName}>Automation System</span></h1>
                    </div>
                    <div className="login-box animated fadeInUp">
                        <div className="box-header">
                            <h2>Log In</h2>
                        </div>
                        <LoginForm
                            errorMessageLabel={this.ErrorMessageLabel(this.loginModel.errorMessage, this.state.labelErrorMessageStyleName)}
                            loginFormsProps={this.LoginFormsProps(this.handleSubmit)}
                            inputHiddenProps={this.InputHiddenProps(this.csrftoken)}
                            inputUserNameProps={this.InputUserNameProps(this.handleChange, this.state.userNameStyleName)}
                            inputPasswordProps={this.InputPasswordProps(this.handleChange, this.state.passwordStyleName)}
                            loginButtonProps={this.LoginButtonProps(this.handleClick)}
                        />
                    </div>
                </CSSTransitionGroup>
            </div>
        );
    }
}
function mapStateToProps(state) {
  const data = state;
  console.log("Map Sate To Props ", data)
  return {data};
}
export default connect(mapStateToProps)(LoginPage)