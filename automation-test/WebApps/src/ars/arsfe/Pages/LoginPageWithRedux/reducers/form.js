import { FormActionTypes } from '../utils/ActionTypes';
import * as actions from '../actions';

const initState = {
    data: {}
}
export default function (state = initState, action) {
    console.log(action);
    switch (action.type) {
        case FormActionTypes.SET_USERNAME:
            return { ...state, username: action.username };
        case FormActionTypes.SET_PASSWORD:
            return { ...state, password: action.password };
        case FormActionTypes.CHECK_SAVE:
            return { ...state, isRemember: action.isRemember };
        case FormActionTypes.CHANGE_FORM:
            return { ...state, data: action.newFormData }
        case FormActionTypes.GET_SEESION:
            return { ...state, isLogged: data.isLogged }
        default:
            return state;
    }

}
