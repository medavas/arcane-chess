import axios from 'axios';
import setAuthToken from 'src/shared/utils/setAuthToken';
import jwt_decode from 'jwt-decode';

import { AppDispatch } from 'src/index';

import { setLocalStorage, getLocalStorage } from 'src/shared/utils/handleLocalStorage';

import {
  GET_ERRORS,
  SET_CURRENT_USER,
  SET_CURRENT_GUEST,
  USER_LOADING,
} from 'src/shared/types/actionTypes';

// interface AuthState {
//   isAuthenticated: boolean;
//   // add other properties of auth state
// }
// type MyThunk<ReturnType = void> = ThunkAction<
//   ReturnType,
//   RootState,
//   unknown,
//   AuthActionTypes
// >;

// Register User
export const registerUser =
  (userData: object, navigate: (path: string) => void) =>
  (dispatch: AppDispatch) => {
    axios
      .post('/api/users/register', userData)
      .then((res) => {
        setLocalStorage({
          auth: {
            user: {
              id: res.data._id,
              username: res.data.username,
              campaign: {
                topScores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as number[],
              },
            },
          },
          chapter: 0,
          config: {},
          nodeScores: {},
          inventory: {},
          nodeId: '',
        });
        navigate('/login');
      })
      .catch((err) => {
        dispatch({
          type: GET_ERRORS,
          payload: err.response.data,
        });
      });
  };

export const getGuestUserFromLocalStorage = () => {
  const guestKey = Object.keys(localStorage).find((key) =>
    key.startsWith('guest')
  );
  if (guestKey) {
    const guestData = getLocalStorage(guestKey);
    if (guestData) {
      return { key: guestKey, data: guestData };
    }
  }
  return null;
};

// Login - get user token
// disabling for now unless we want server in the future
export const loginUser = (userData: any) => (dispatch: AppDispatch) => {
  return new Promise((resolve) => {
    axios
      .post('/api/users/login', userData)
      .then((res) => {
        const { token } = res.data;
        localStorage.setItem('jwtToken', token);
        setAuthToken(token);
        const decoded: object = jwt_decode(token);
        dispatch(setCurrentUser(decoded));

        const existingGuestUser = getGuestUserFromLocalStorage();

        if (userData.guest || getLocalStorage(userData.username) === null) {
          if (
            existingGuestUser &&
            existingGuestUser.data.auth &&
            existingGuestUser.data.auth.user
          ) {
            const updatedGuestData = {
              ...existingGuestUser.data,
              auth: {
                ...existingGuestUser.data.auth,
                user: {
                  ...existingGuestUser.data.auth.user,
                  id: res.data.id || '0',
                  username: existingGuestUser.data.auth.user.username,
                  campaign: {
                    ...existingGuestUser.data.auth.user.campaign,
                    topScores: [
                      ...existingGuestUser.data.auth.user.campaign.topScores,
                    ] as number[],
                  },
                },
              },
            };
            setLocalStorage(updatedGuestData);
          } else {
            setLocalStorage({
              auth: {
                user: {
                  id: res.data.id || '0',
                  username: userData.username,
                  campaign: {
                    topScores: [...res.data.campaign.topScores] as number[],
                  },
                },
              },
            });
          }
        } else {
          setLocalStorage({
            ...getLocalStorage(userData.username),
            auth: {
              user: {
                id: res.data.id || '0',
                username: userData.username,
                campaign: {
                  topScores: userData.guest
                    ? [...Array(12).fill(0)]
                    : ([...res.data.campaign.topScores] as number[]),
                },
              },
            },
          });
        }

        dispatch({ type: 'LOGIN_SUCCESS' });
        resolve({ success: true });
      })
      .catch((err) => {
        console.error('Login Error: ', err);
        const errorPayload = err.response
          ? err.response.data
          : { message: 'An error occurred. Please try again.' };
        dispatch({
          type: GET_ERRORS,
          payload: errorPayload,
        });
        resolve({ success: false, error: errorPayload.message });
      });
  });
};

// Guest Login - the static webpage solution - deprecate when ready for more users
export const loginGuest = (guestData: any) => {
  const existingGuestUser = getGuestUserFromLocalStorage();
  if (guestData.guest || getLocalStorage(guestData.username) === null) {
    if (
      existingGuestUser &&
      existingGuestUser.data.auth &&
      existingGuestUser.data.auth.user
    ) {
      const updatedGuestData = {
        ...existingGuestUser.data,
        auth: {
          ...existingGuestUser.data.auth,
          user: {
            ...existingGuestUser.data.auth.user,
            id: '0',
            username: existingGuestUser.data.auth.user.username,
            campaign: {
              ...existingGuestUser.data.auth.user.campaign,
              topScores: [
                ...existingGuestUser.data.auth.user.campaign.topScores,
              ] as number[],
            },
          },
        },
      };
      setLocalStorage(updatedGuestData);
    } else {
      // Set new localStorage data if no existing guest is found
      setLocalStorage({
        auth: {
          user: {
            id: '0',
            username: guestData.username,
            campaign: {
              topScores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as number[],
            },
          },
        },
      });
    }
  }
  return {
    type: SET_CURRENT_GUEST,
    payload: {
      authorized: true,
    },
  };
};

// Set logged in user
export const setCurrentUser = (decoded: object) => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded,
  };
};

// User loading
export const setUserLoading = () => {
  return {
    type: USER_LOADING,
  };
};

// Log user out
export const logoutUser = () => (dispatch: AppDispatch) => {
  localStorage.removeItem('jwtToken');
  setAuthToken(false);
  dispatch(setCurrentUser({}));
};
