import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Col, Row, Form, Input, Button, Checkbox, Icon } from 'antd';
import * as actions from '../actions';
import { submitForm } from '../actions';
import { LoginForm } from '../components/Form'

const FormItem = Form.Item;

class Login extends Component {
    constructor(props) {
        super(props);
        this.changeUserName = this.changeUserName.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.toggleRememberMe = this.toggleRememberMe.bind(this);
        this.submitForm = this.submitForm.bind(this);
        console.log("Supper props ", this.props);
    }
    changeUserName(e) {
        e.preventDefault();
        this.emmitChange({
            ...this.props.formData, username: e.target.value
        })
    }
    changePassword(e) {
        e.preventDefault();
        this.emmitChange({
            ...this.props.formData, password: e.target.value
        })
    }
    toggleRememberMe(e) {

        this.emmitChange({
            ...this.props.formData, isRemember: e.target.checked
        })
    }
    submitForm(e) {
        e.preventDefault();
        let that = this;
        if (true) {
            this.props.dispatch(submitForm({ ...this.props.formData, 'crfToken': Cookies.get('csrftoken') }))
                .then((res) => {
                    console.log(that.props);
                    console.log(res.responseData);
                    //window.location.href=res.responseData.url;
                })
            return false;
        }
    }
    emmitChange(data) {
        this.props.dispatch(actions.changeForm(data))
    }
    render() {
        const { url, message, status } = this.props.responseData;
        const { username, password, isRemember } = this.props.formData;
        const formAttr = { id: "loginForm", action: "/accounts/login/", method: "POST" }
        const formData = this.props.formData;
        const formAction = { changeUserName: this.changeUserName, changePassword: this.changePassword, toggleRememberMe: this.toggleRememberMe, submitForm: this.submitForm }
        return (
            <Row>
                <p>
                    response with url: {url} - message : {message} - status {status}
                </p>
                <LoginForm csrftoken={Cookies.get('csrftoken')} formAttr={formAttr} formData={formData} formAction={formAction} />
            </Row>
        )
    }
}
const mapStateToProps = (state) => {
    const { formData, sessionId } = state.login;
    const { auth } = submitForm;
    return {
        formData, sessionId, auth
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
        dispatch: dispatch,
        responseData: (data) => dispatch(actions.submitForm(data))
    };
}
//export default connect(mapStateToProps)(Login)
export default connect(({ login }) => ({ formData: login.formData, sessionId: login.sessionId, responseData: login.responseData }))(Login);
