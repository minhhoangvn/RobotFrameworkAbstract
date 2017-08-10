import {ActionTypes} from '../constants';

export function getSessionId(data) {
  return {
    type: ActionTypes.LOGIN,
    data
  };
};

export function setUserName(data) {
  return {
    type: ActionTypes.INPUT_USER_NAME,
    data
  };
};

export function setPassword(data) {
  return {
    type: ActionTypes.INPUT_PASSWORD,
    data
  };
};