import { SET_CURRENT_USER, USER_LOADING } from 'src/shared/types/actionTypes';

import isEmpty from 'is-empty';

interface InitialStateTypes {
  isAuthenticated: boolean;
  user: object;
  loading: false;
}

const initialState: InitialStateTypes = {
  isAuthenticated: false,
  user: { id: '' },
  loading: false,
};

export default function (
  state = initialState,
  action: {
    type: string;
    payload: { [key: string]: object | string | number | null };
  }
) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload),
        user: action.payload,
      };
    case USER_LOADING:
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
}
