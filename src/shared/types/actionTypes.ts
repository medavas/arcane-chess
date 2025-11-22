export const GET_ERRORS = 'GET_ERRORS';
export const USER_LOADING = 'USER_LOADING';
export const SET_CURRENT_USER = 'SET_CURRENT_USER';
export const SET_CURRENT_GUEST = 'SET_CURRENT_GUEST';

export const JOIN_TOURNAMENT = 'JOIN_TOURNAMENT';
export const LEAVE_TOURNAMENT = 'LEAVE_TOURNAMENT';

// export const GET_GAME = "GET_GAME";
export const JOIN_GAME = 'JOIN_GAME';
export const SAVE_GAME = 'SAVE_GAME';
export const LEAVE_GAME = 'LEAVE_GAME';

export const SAVE_ROOM = 'ADD_USER';
export const REMOVE_ROOM = 'REMOVE_ROOM';

// campaign actions
export const LOAD_CAMPAIGN = 'LOAD_CAMPAIGN';
export const SAVE_CAMPAIGN = 'SAVE_CAMPAIGN';
export const SET_NODE = 'SET_NODE';

interface GetErrorsAction {
  type: typeof GET_ERRORS;
  payload: object;
}

interface SetCurrentUserAction {
  type: typeof SET_CURRENT_USER;
  payload: object;
}

interface UserLoadingAction {
  type: typeof USER_LOADING;
}

export type AuthActionTypes =
  | GetErrorsAction
  | SetCurrentUserAction
  | UserLoadingAction;
