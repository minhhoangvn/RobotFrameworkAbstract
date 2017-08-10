import { FormActionTypes } from '../utils/ActionTypes';

export function setUserName(data) {
    return ({
        type: FormActionTypes.SET_USERNAME,
        username: data
    });
}

export function setPassword(data) {
    return ({
        type: FormActionTypes.SET_PASSWORD,
        password: data
    });
}

export function checkRemember(data) {
    return ({
        type: FormActionTypes.CHECK_SAVE,
        isRemember: data
    });
}

export function changeForm(data) {
    return ({
        type: FormActionTypes.CHANGE_FORM,
        newFormData: data
    });
}

export function getSessionId(data){
    return({
        type: FormActionTypes.GET_SEESION,
        isLogged: data
    })
}