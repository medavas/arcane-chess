import { GET_ERRORS } from 'src/shared/types/actionTypes';

const initialState = {};

export default function (
  state = initialState,
  action: {
    type: string;
    payload: { [key: string]: object | string | number | null };
  }
) {
  switch (action.type) {
    case GET_ERRORS:
      return action.payload;
    default:
      return state;
  }
}
