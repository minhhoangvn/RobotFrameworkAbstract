import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import reducer from '../reducers/index';
import thunkMiddleware from 'redux-thunk';
const logger = createLogger();

const createStoreWithMiddleware = applyMiddleware(thunkMiddleware)(createStore);

function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}

let LoginStore = configureStore();

export { LoginStore };