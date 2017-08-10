import { FormActionTypes } from '../constant/constants'

const initState = {
    formData: {},
    sessionId: "",
    responseData:{}
}

export default function(state = initState, action) {
    switch (action.type) {
        case FormActionTypes.CHANGE_FORM:
            return { ...state, formData: action.newFormData }
        case FormActionTypes.SUBMIT_FORM:
            console.log('Call submit form reducer ', action);
            return { ...state, responseData: action.responseData }
        default:
            return state;
    }
}