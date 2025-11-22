import { combineReducers } from 'redux';
import auth from 'src/features/auth/store/authReducer';
// import tournament from "./tournamentReducer";
// import game from 'src/features/game/store/gameReducer';
// import room from "./saveRoom";
import loginRegisterErrors from 'src/features/auth/store/authError';

export default combineReducers({
  auth,
  // tournament,
  // game,
  // room,
  loginRegisterErrors,
});
