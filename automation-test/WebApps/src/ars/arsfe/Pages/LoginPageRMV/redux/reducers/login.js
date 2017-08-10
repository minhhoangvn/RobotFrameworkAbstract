import {ActionTypes} from '../constants';

const initialState = [];

export default function(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.INPUT_USER_NAME:
      return getSessionId(state, action);
    case ActionTypes.INPUT_PASSWORD:
      return setPassword(state, action);
    case ActionTypes.LOGIN:
      return getSessionId(state, action);
  }

  return state;
}

function getSessionId(state, action) {
  const {data} = action;
  return [...state, ...data];
}

function setUserName(state, action) {
  const {data} = action;
  return [...state, ...data];
}

function setPassword(state, action) {
  const {data} = action;
  return [...state, ...data];
}