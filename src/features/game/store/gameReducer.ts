// import { JOIN_GAME, SAVE_GAME, LEAVE_GAME } from 'src/shared/types/actionTypes';

// const initState = {
//   gameObject: {},
//   whitePlayerId: '',
//   blackPlayerId: '',
//   inGame: false,
// };

// export default function (
//   state = initState,
//   action: { type: string; payload: { [key: string]: any } }
// ) {
//   switch (action.type) {
//     case JOIN_GAME:
//       return {
//         ...state,
//         gameObject: action.payload.metaData,
//         whitePlayerId: action.payload.metaData.white.playerId,
//         blackPlayerId: action.payload.metaData.black.playerId,
//         inGame: true,
//       };
//     case SAVE_GAME:
//       return {
//         ...state,
//         metaData: action.payload.metaData,
//         uiMetaData: action.payload.uiMetaData,
//       };
//     case LEAVE_GAME:
//       return {
//         ...state,
//         gameObject: {},
//         whitePlayerId: '',
//         blackPlayerId: '',
//         inGame: false,
//       };
//     default:
//       return state;
//   }
// }
