import React from 'react';
import PropTypes from 'prop-types'

ButtonElement.prototypes = {
    inputType: PropTypes.string,
    classNameStyle: PropTypes.string,
    idValue: PropTypes.string,
    nameValue: PropTypes.string,
    buttonName: PropTypes.String,
    onChangeHandler: PropTypes.func.isRequired
}
ButtonElement.defaultProps = {
    inputType: 'text',
    classNameStyle: null,
    idValue: null,
    nameValue: null,
    value: null,
    buttonName: null
}

export function ButtonElement(props) {
    return (
        <button
            type={props.buttonProps.type}
            className={props.buttonProps.className}
            id={props.buttonProps.id}
            name={props.buttonProps.name}
            onClick={props.buttonProps.onClick} 
            >{props.buttonProps.buttonName}
        </button>
    );
}



