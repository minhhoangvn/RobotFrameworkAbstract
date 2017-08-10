import {createStore, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import reducer from '../reducers/index';

const logger = createLogger();

const createStoreWithMiddleware = applyMiddleware(logger)(createStore);

function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}

let store = configureStore();

export {store};