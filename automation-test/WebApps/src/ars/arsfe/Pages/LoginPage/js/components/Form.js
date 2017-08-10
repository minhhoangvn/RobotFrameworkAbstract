import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Col, Row, Form, Input, Button, Checkbox, Icon } from 'antd';
const FormItem = Form.Item;


LoginForm.prototypes = {
    method: PropTypes.string,
    action: PropTypes.string,
    classNameStyle: PropTypes.string,
    idValue: PropTypes.string,
    nameValue: PropTypes.string,
    onSubmit: PropTypes.func.isRequired
}
LoginForm.defaultProps = {
    method: null,
    action: null,
    classNameStyle: null,
    idValue: null,
    nameValue: null,
}

export function LoginForm(props) {
    const { id, action, method } = props.formAttr;
    const { username, password, isRemember } = props.formData;
    const { changeUserName, changePassword, toggleRememberMe, submitForm } = props.formAction;
    const csrftoken = props.csrftoken;
    return (
        <form
            id={id}
            action={action}
            method={method}
            onSubmit={submitForm}>
            <Input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} style={{ readOnly: true }} />
            <Row>
                <Col span={6} offset={6}>
                    <label htmlFor="userName">Username</label>
                    <br />
                    <Input value={username} onChange={changeUserName} id="userName" prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder="UserName" />
                    <label htmlFor="passowrd">Username</label>
                    <br />
                    <Input value={password} onChange={changePassword} id="passowrd" prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder="******" />
                    <br />
                    <Checkbox checked={isRemember} onClick={toggleRememberMe} >Remember Me</Checkbox>
                    <br />
                    <button type="submit">Log In</button>
                </Col>
            </Row>
        </form>
    );

}