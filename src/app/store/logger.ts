import { Dispatch, Middleware, AnyAction } from 'redux';

const logger: Middleware<object, object, Dispatch<AnyAction>> =
  (store) => (next) => (action) => {
    console.group(action.type);
    console.log('the action: ', action);
    const returnValue = next(action);
    console.log('the new state: ', store.getState());
    console.groupEnd();
    return returnValue;
  };

export default logger;
