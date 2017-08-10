import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import { Col, Row, Form, Input, Button, Checkbox, Icon } from 'antd';
import * as actions from './actions';


const FormItem = Form.Item;

class FormLogin extends Component {
  constructor(props) {
    super(props);
    this.toggleRememberMe = this.toggleRememberMe.bind(this);
    this.changeUserName = this.changeUserName.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  toggleRememberMe(e) {
    this.emmitChange({
      ...this.props.data, isRemember: e.target.checked
    })
  }

  changeUserName(e) {
    this.emmitChange({
      ...this.props.data, username: e.target.value
    })
  }

  changePassword(e) {
    this.emmitChange({
      ...this.props.data, password: e.target.value
    })
  }
  emmitChange(data) {
    this.props.dispatch(actions.changeForm(data))
  }
  render() {
    const { username, password, isRemember } = this.props.data;
    return (
      <Form>
        <Row>
          <Col span={6} offset={6}>
            <label htmlFor="userName">Username</label>
            <br />
            <Input value={username} onChange={this.changeUserName} id="userName" prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder="UserName" />
            <label htmlFor="passowrd">Username</label>
            <br />
            <Input value={password} onChange={this.changePassword} id="passowrd" prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder="******" />
            <br />
            <Checkbox checked={isRemember} onClick={this.toggleRememberMe} >Remember Me</Checkbox>
          </Col>
        </Row>
      </Form>
    )
  }
}

export default connect(({ formData }) => ({data:formData.data}))(FormLogin);
