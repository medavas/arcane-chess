import React from 'react';
import Modal from 'react-modal';

import './PromotionModal.scss';

interface Props {
  isOpen: boolean;
  playerColor: string;
  playerFaction: string;
  handleClose: (piece: string) => void;
}

export default class PromotionModal extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }
  componentDidMount(): void {
    Modal.setAppElement('#modal-root');
  }
  render() {
    const {
      isOpen,
      playerColor,
      playerFaction = 'normal',
      handleClose,
    } = this.props;
    return (
      <div className="modal">
        <Modal isOpen={isOpen} style={promotionModal}>
          <div className="promotion-selection-container">
            <img
              onClick={() => handleClose('N')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }N.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('Z')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }Z.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('U')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }U.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('B')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }B.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('R')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }R.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('Q')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }Q.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('T')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }T.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('M')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }M.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('W')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }W.svg`}
              alt=""
              className="piece-selection"
            />
            <img
              onClick={() => handleClose('S')}
              src={`../src/chessground/images/pieces/tactorius/${playerFaction}/${
                playerColor === 'white' ? 'w' : 'b'
              }S.svg`}
              alt=""
              className="piece-selection"
            />
          </div>
        </Modal>
      </div>
    );
  }
}

const promotionModal = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    background: '#111111',
  },
  overlay: {
    zIndex: 10,
    backgroundColor: '#111111DD',
  },
};
