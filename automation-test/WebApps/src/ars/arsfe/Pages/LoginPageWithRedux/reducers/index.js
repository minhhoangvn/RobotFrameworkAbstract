import formReducer from './form';
import { combineReducers } from 'redux';

export default combineReducers(
    {
        formData : formReducer
    }
)
