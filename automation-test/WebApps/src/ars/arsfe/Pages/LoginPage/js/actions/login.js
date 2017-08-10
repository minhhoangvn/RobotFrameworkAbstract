import { FormActionTypes } from '../constant/constants'

export function changeForm(formData) {
    return {
        type: FormActionTypes.CHANGE_FORM,
        newFormData: formData
    }
}

export function submitForm(data) {
    console.log("Start Action ", new Date());
    return (dispatch, getState) => {
        return dispatch(getSessionId(data))
    }
}

function getSessionId(data) {
    console.log("Start Dispatch ", new Date());
    return dispatch => {
        return fetch('/accounts/login/', {
            method: "POST",
            credentials: 'same-origin',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            body: 'csrfmiddlewaretoken=' + data.crfToken + '&username=' + data.username + '&password=' + data.password
        }).then((res) => res.json()).then((data) => {
            return dispatch(authenticateResponse(data));
        });
    }
}

function authenticateResponse(data) {
    console.log('return action ', data)
    return {
        type: FormActionTypes.SUBMIT_FORM,
        responseData: data
    }
}
