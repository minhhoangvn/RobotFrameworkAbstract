import React from 'react';
import { InputElement } from '../InteractiveComponents/Input'
import { ButtonElement } from '../InteractiveComponents/Button'
import PropTypes from 'prop-types'

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
    return (
        <form
            id={props.loginFormsProps.id}
            action={props.loginFormsProps.action}
            method={props.loginFormsProps.method}
            onSubmit={props.loginFormsProps.onSubmit}>
            <InputElement inputProps={props.inputHiddenProps} />
            <label className={props.errorMessageLabel.className} id="errorMessage">
                {props.errorMessageLabel.message}
            </label>
            <label htmlFor="username">Username</label>
            <br />
            <InputElement inputProps={props.inputUserNameProps} />
            <br />
            <label htmlFor="password">Password</label>
            <br />
            <InputElement inputProps={props.inputPasswordProps} />
            <br />
            <ButtonElement buttonProps={props.loginButtonProps} />
        </form>
    );

}


