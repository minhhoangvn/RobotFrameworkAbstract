import React from 'react';
import PropTypes from 'prop-types'

InputElement.prototypes = {
    inputType: PropTypes.string,
    classNameStyle: PropTypes.string,
    idValue: PropTypes.string,
    nameValue: PropTypes.string,
    value: PropTypes.string,
    placeholder: PropTypes.String,
    onChangeHandler: PropTypes.func.isRequired
}
InputElement.defaultProps = {
    inputType: 'text',
    classNameStyle: null,
    idValue: null,
    nameValue: null,
    value: null,
    placeholder: null
}

export function InputElement(props) {
    return (
        <input
            value={props.inputProps.value}
            type={props.inputProps.type}
            className={props.inputProps.className}
            id={props.inputProps.id}
            name={props.inputProps.name}
            onChange={props.inputProps.onChange}
            placeholder={props.inputProps.placeholder} />
    );
}


