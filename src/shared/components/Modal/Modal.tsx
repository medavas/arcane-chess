import React from 'react';
import Modal from 'react-modal';
import _ from 'lodash';

import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { connect } from 'react-redux';

import {
  setLocalStorage,
  getLocalStorage,
} from 'src/shared/utils/handleLocalStorage';

import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
// import { Chessground } from 'src/features/game/board/chessgroundMod';

import Button from '../Button/Button';

import { unlockableArcana } from 'src/features/campaign/pages/book/ArcanaSelect';
// import { characters, modes } from 'src/features/game/components/CharacterSelect/charactersModes';

import './Modal.scss';

import arcanaJson from 'src/shared/data/arcana.json';

interface ModalProps {
  isOpen: boolean;
  type: string;
  imgPath?: string;
  toggleModal: () => void;
  handleClose: () => void;
  navigate: (path: string) => void;
  message?: string;
  auth: any;
  chapterNumber?: number;
  lessonBackButton?: boolean;
  disableSecondary?: boolean;
  score?: number;
  updateConfig?: (key: string, value: any) => void;
}
interface ModalState {
  config: { [key: string]: any };
  hoverArcane: string;
  whiteArcana: { [key: string]: boolean | number | string | null };
  blackArcana: { [key: string]: boolean | number | string | null };
  playerColor: string;
  animatedValue: number;
  targetValue: number;
  reducedScore: number;
  chapterNum: number;
  difficulty: string;
  difficultyDescriptions: { [key: string]: string };
  hoverDifficulty: string;
  showCharacterPicker: boolean;
}

interface ArcanaDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  imagePath: string;
}
interface ArcanaMap {
  [key: string]: ArcanaDetail;
}

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

// Modal.setAppElement('#root');

class UnwrappedTactoriusModal extends React.Component<ModalProps, ModalState> {
  constructor(props: ModalProps) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);

    // Use defaults if LS is null (for Skirmish/QuickPlay without login)
    const config = LS?.config || {
      multiplier: 80,
      color: 'white',
      thinkingTime: 2,
      depth: 1,
      clock: false,
    };
    const nodeScores = LS?.nodeScores || {};
    const chapter = LS?.chapter ?? 0;
    const difficulty = LS?.difficulty || 'novice';

    this.state = {
      config: {
        multiplier: config.multiplier,
        color: config.color,
        thinkingTime: config.thinkingTime,
        depth: config.depth,
        clock: config.clock,
        blunderVision: false,
        threatVision: false,
        checkVision: false,
        hints: false,
        autopromotion: 'Select',
      },
      hoverArcane: '',
      whiteArcana: {},
      blackArcana: {},
      playerColor: 'white',
      animatedValue: 0,
      targetValue: 0,
      reducedScore: _.reduce(
        nodeScores,
        (accumulator, value) => {
          return accumulator + value;
        },
        0
      ),
      chapterNum: chapter + 1,
      difficulty: difficulty,
      difficultyDescriptions: {
        novice:
          'NOVICE: For players looking to experiement and take their time with the new rules.',
        intermediate:
          'INTERMEDIATE: The clock is enabled, with slightly stronger moves from the engine.',
        advanced:
          'ADVANCED: Players should expect to be more patient and will not have the first move.',
        expert: 'EXPERT: Full-strength challenge for veteran players.',
      },
      hoverDifficulty: difficulty,
      showCharacterPicker: false,
    };
  }

  updateConfig = (
    value:
      | boolean
      | string
      | number
      | null
      | React.ChangeEvent<HTMLSelectElement>,
    key: string,
    multiplier: number
  ) => {
    this.setState((prevState) => ({
      config: {
        ...this.state.config,
        [key]: value,
        multiplier: prevState.config.multiplier + multiplier,
      },
    }));
  };

  // todo save to local storage and update chapter number to db on click save or submit? FC?
  // todo dyanmicize for different types
  // chapter setttings
  // endgame
  // promotion

  saveSettingsStartBook = () => {
    const currLS = getLocalStorage(this.props.auth.user.username);
    setLocalStorage({
      ...currLS,
      chapter: this.props.chapterNumber,
      config: this.state.config,
      nodeScores: {},
      spellBook: {},
      nodeId: 'lesson-1',
      chapterEnd: false,
    });
    this.props.navigate('/chapter');
  };

  toggleHover = (arcane: string) => {
    this.setState({ hoverArcane: arcane });
  };

  componentDidMount() {
    const targetValue = this.state.reducedScore;
    this.setState({ targetValue });

    const startAnimation = () => {
      const startTime = Date.now();
      const duration = 2000;

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const normalizedTime = elapsed / duration;

        if (normalizedTime < 1) {
          const easedTime = normalizedTime;
          const nextValue = targetValue * easedTime;
          this.setState({ animatedValue: nextValue });
          requestAnimationFrame(animate);
        } else {
          this.setState({ animatedValue: targetValue });
        }
      };

      requestAnimationFrame(animate);
    };

    const pauseDuration = 1000;
    setTimeout(startAnimation, pauseDuration);
  }

  render() {
    // Convert number to string with comma formatting
    const formattedNumber = Math.round(
      this.state.animatedValue
    ).toLocaleString();
    // Split formatted number into individual characters
    const digits = formattedNumber.split('').map((char, index) => (
      <span key={index} className="digit-box">
        {char}
      </span>
    ));

    if (this.props.type === 'armory') {
      return (
        <Modal
          style={armoryModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          {/* <div className="cg-wrap armory-board">
              <Chessground
                // fen={this.state.fenHistory[this.state.fenHistory.length - 1]}
                // check={this.tactorius.inCheck().isAttacked}
                // viewOnly={this.isCheckmate()}

                fen="8/8/P7/QRRRRK2"
                coordinates={false}
                // notation={true}
                // onChange={(move) => {
                //   console.log('hello', move);
                // }}
                resizable={true}
                wFaction={'normal'}
                bFaction={'normal'}
                // wRoyalty={this.state.wRoyalty}
                // bRoyalty={this.state.bRoyalty}
                // wVisible={this.state.wVisCount === 0}
                // bVisible={this.state.bVisCount === 0}
                // width={520}
                // height={520}
                width={480}
                height={240}
                // inline styling for aspect ratio? OR interpolating in this case based on the page type, use a global state string?
                // don't, just go by the page type
                // width={360}
                // height={360}
                animation={{
                  enabled: true,
                  duration: 1,
                }}
                highlight={{
                  lastMove: false,
                  check: true,
                }}
                // orientation={this.state.orientation}
                disableContextMenu={false}
                // turnColor={GameBoard.side === 0 ? 'white' : 'black'}
                // movable={{
                //   free: false,
                //   // todo swap out placeholder for comment
                //   // color: "both",
                //   color: GameBoard.side === 0 ? 'white' : 'black',
                //   // todo show summon destinations
                //   dests: this.arcaneChess().getGroundMoves(),
                // }}
                dimensions={{
                  height: 4,
                  width: 8,
                }}
                events={{
                  change: () => {
                    // if (this.state.)
                    // this.setState({
                    //   fen:
                    // })
                    // this.arcaneChess().engineReply();
                    // this.setState({})
                    // console.log(cg.FEN);
                    // send moves to redux store, then to server (db), then to opponent
                  },
                  // move: (orig, dest, capturedPiece) => {
                  //   const parsed = this.arcaneChess().makeUserMove(orig, dest);
                  //   console.log(generatePowers());
                  //   if (!PrMove(parsed)) {
                  //     console.log('invalid move');
                  //     debugger; // eslint-disable-line
                  //   }
                  //   this.setState((prevState) => ({
                  //     history: [...prevState.history, PrMove(parsed)],
                  //     fenHistory: [
                  //       ...prevState.fenHistory,
                  //       outputFenOfCurrentPosition(),
                  //     ],
                  //   }));
                  //   this.engineGo();
                  // },
                  // select: (key) => {
                  //   ParseFen(this.state.fen);
                  //   AddPiece(prettyToSquare(key), PIECES.wN);
                  //   this.setState({
                  //     fen: outputFenOfCurrentPosition(),
                  //     fenHistory: [outputFenOfCurrentPosition()],
                  //   });
                  // },
                }}
              />
            </div> */}
        </Modal>
      );
    }

    if (this.props.type === 'victory') {
      return (
        <Modal
          style={endgameModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="endgame">
            {/* <img className="endgame-image" src="/assets/victory2.webp" /> */}
            <div className="endgame-content">
              <strong className="endgame-text">
                <i>
                  Victory... {this.props.score ? '+' : ''}{' '}
                  {this.props.score?.toLocaleString()}
                </i>
              </strong>
              <div className="buttons">
                <button
                  type="button"
                  className="endgame-btn primary-btn"
                  onClick={() => {
                    (window as any).allowNavigation = true;
                    this.props.navigate('/chapter');
                  }}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'defeat') {
      return (
        <Modal
          style={endgameModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="endgame">
            {/* <img className="endgame-image" src="/assets/defeat2.webp" /> */}
            <div className="endgame-content">
              <strong>
                <i>Defeat...</i>
              </strong>
              <div className="buttons">
                <div className="left-buttons">
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.navigate('/chapter');
                    }}
                  >
                    TO CHAPTER
                  </button>
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.handleClose();
                    }}
                  >
                    ANALYZE
                  </button>
                </div>
                <button
                  type="button"
                  className="endgame-btn primary-btn"
                  onClick={() => {
                    window.removeEventListener(
                      'beforeunload',
                      (window as any).handleBeforeUnload
                    );
                    location.reload();
                  }}
                >
                  RETRY
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'draw') {
      return (
        <Modal
          style={endgameModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="endgame">
            <div className="endgame-content">
              <strong>
                <i>Draw</i>
              </strong>
              <p style={{ textAlign: 'center', marginTop: '10px' }}>
                {this.props.message}
              </p>
              <div className="buttons">
                <div className="left-buttons">
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.navigate('/chapter');
                    }}
                  >
                    TO CHAPTER
                  </button>
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.handleClose();
                    }}
                  >
                    ANALYZE
                  </button>
                </div>
                <button
                  type="button"
                  className="endgame-btn primary-btn"
                  onClick={() => {
                    window.removeEventListener(
                      'beforeunload',
                      (window as any).handleBeforeUnload
                    );
                    location.reload();
                  }}
                >
                  RETRY
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'chapterEnd') {
      return (
        <Modal
          style={chapterEndModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="chapter-end">
            <div className="chapter-end-text" style={{ padding: '20px' }}>
              <div className="chapter-end-text-top">
                <h1>BOOK END</h1>
                <div className="chapter-end-points">
                  <h1 className="digit-box">{digits}</h1>
                </div>
              </div>
              <div className="chapter-end-buttons">
                <div className="unlocked-arcana">
                  ARCANA UNLOCKED:
                  <div>
                    {_.map(
                      unlockableArcana[this.state.chapterNum],
                      (_name: string, key: number) => {
                        return (
                          <img
                            key={key}
                            className={`arcane ${
                              this.state.hoverArcane === `${key}` ? 'focus' : ''
                            }`}
                            src={`/assets/arcanaImages${arcana[key].imagePath}.svg`}
                            onMouseEnter={() => this.toggleHover(`${key}`)}
                            onMouseLeave={() => this.toggleHover('')}
                          />
                        );
                      }
                    )}
                  </div>
                  <div className="arcana-description">
                    <span>
                      <b>
                        {arcana[this.state.hoverArcane.split('-')[0]]?.name}
                      </b>
                    </span>
                    <p>
                      {
                        arcana[this.state.hoverArcane.split('-')[0]]
                          ?.description
                      }
                    </p>
                  </div>
                </div>
                <Button
                  text="CONTINUE"
                  className="primary"
                  color="S"
                  width={200}
                  height={60}
                  onClick={() => {
                    (window as any).allowNavigation = true;
                    setLocalStorage({
                      ...getLocalStorage(this.props.auth.user.username),
                      chapter: 0,
                      config: {},
                      nodeScores: {},
                      spellBook: {},
                      nodeId: '',
                      chapterEnd: false,
                    });
                    this.props.navigate('/campaign');
                  }}
                />
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'quickPlay') {
      return (
        <Modal
          style={quickPlayModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="quickplay">
            <div className="top-buttons">
              <Button className="tertiary" color="S" text="BACK" />
            </div>
            <div className="player-options-text">
              <div className="sides">
                <div className="player">
                  <div className="buttons-arcana">
                    <div className="buttons">
                      <div className="color">
                        <img
                          src={`/assets/images/blueuser.svg`}
                          style={{
                            width: '180px',
                            height: '60px',
                            background: '#4A90E2',
                          }}
                        />
                      </div>
                      <div className="character">
                        <img
                          src={`/assets/characters/viking-head.svg`}
                          style={{
                            width: '180px',
                            height: '60px',
                            background: '#4A90E2',
                          }}
                          onClick={() => {
                            this.setState({
                              showCharacterPicker: this.state
                                .showCharacterPicker
                                ? false
                                : true,
                            });
                          }}
                        />
                        {/* {this.state.showCharacterPicker ? (
                            <CharacterSelect />
                          ) : null} */}
                      </div>
                    </div>
                    <div className="arcana"></div>
                  </div>
                  <div className="army-section">{/* <ArmySelect /> */}</div>
                </div>
                <div className="engine">
                  <div className="buttons-arcana">
                    <div className="buttons">
                      <div className="color"></div>
                      <div className="character"></div>
                    </div>
                    <div className="arcana"></div>
                  </div>
                  <div className="army"></div>
                </div>
              </div>
              <div className="hover-text">{/* hover text */}</div>
            </div>
            <div className="settings-go">
              {/* difficulty */}
              {/* promotion */}
              {/* randomize template */}
              {/* randomize */}
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'victory-qp') {
      return (
        <Modal
          style={endgameModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="endgame">
            {/* <img className="endgame-image" src="/assets/victory2.webp" /> */}
            <div className="endgame-content">
              <strong className="endgame-text">
                <i>
                  Victory... {this.props.score ? '+' : ''}{' '}
                  {this.props.score?.toLocaleString()}
                </i>
              </strong>
              <div className="buttons">
                <div className="left-buttons">
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      (window as any).allowNavigation = true;
                      this.props.navigate('/');
                    }}
                  >
                    HOME
                  </button>
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.handleClose();
                    }}
                  >
                    ANALYZE
                  </button>
                </div>
                <button
                  type="button"
                  className="endgame-btn primary-btn"
                  onClick={() => {
                    (window as any).allowNavigation = true;
                    location.reload();
                  }}
                >
                  RETRY
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'defeat-qp') {
      return (
        <Modal
          style={endgameModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="endgame">
            {/* <img className="endgame-image" src="/assets/defeat2.webp" /> */}
            <div className="endgame-content">
              <strong>
                <i>Defeat...</i>
              </strong>
              <div className="buttons">
                <div className="left-buttons">
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      (window as any).allowNavigation = true;
                      this.props.navigate('/');
                    }}
                  >
                    HOME
                  </button>
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.handleClose();
                    }}
                  >
                    ANALYZE
                  </button>
                </div>
                <button
                  type="button"
                  className="endgame-btn primary-btn"
                  onClick={() => {
                    (window as any).allowNavigation = true;
                    location.reload();
                  }}
                >
                  RETRY
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    if (this.props.type === 'draw-qp') {
      return (
        <Modal
          style={endgameModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="endgame">
            <div className="endgame-content">
              <strong>
                <i>Draw</i>
              </strong>
              <p style={{ textAlign: 'center', marginTop: '10px' }}>
                {this.props.message}
              </p>
              <div className="buttons">
                <div className="left-buttons">
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      (window as any).allowNavigation = true;
                      this.props.navigate('/');
                    }}
                  >
                    HOME
                  </button>
                  <button
                    type="button"
                    className="endgame-btn secondary-btn"
                    onClick={() => {
                      this.props.handleClose();
                    }}
                  >
                    ANALYZE
                  </button>
                </div>
                <button
                  type="button"
                  className="endgame-btn primary-btn"
                  onClick={() => {
                    (window as any).allowNavigation = true;
                    location.reload();
                  }}
                >
                  RETRY
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    return <div>other modal</div>;
  }
}

// please do mapstatetoprops stuff

function mapStateToProps({ auth }: { auth: any }) {
  return {
    auth,
  };
}

const TactoriusModal = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedTactoriusModal));

export default TactoriusModal;

const quickPlayModal = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: 'auto',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    height: '100%',
    width: '100vw',
    background: '#000000',
    // borderRadius: '10px',
    border: 'none',
    padding: '0px',
  },
  overlay: {
    zIndex: 10,
    backgroundColor: '#111111',
  },
};

const armoryModal = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: 'auto',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    height: '500px',
    width: '1000px',
    background: '#111111',
    borderRadius: '10px',
    border: '2px solid #a043a2',
  },
  overlay: {
    zIndex: 10,
    backgroundColor: '#111111EE',
  },
};

const endgameModal = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    width: '100%',
    background: '#00000000',
    border: 'none',
    padding: '0',
    borderRadius: '0',
    overflow: 'hidden',
  },
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    zIndex: 10,
    background:
      'radial-gradient(circle at center, rgba(0, 0, 0, 0) 0%, black 100%)',
  },
};

const chapterEndModal = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: 'auto',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    // height: '500px', // Removed fixed height
    // width: '1000px', // Removed fixed width
    background: '#111111',
    borderRadius: '10px',
    border: '2px solid #3f48cc',
    padding: '0',
    maxWidth: '95vw', // Added max-width for responsiveness
    maxHeight: '95vh', // Added max-height for responsiveness
  },
  overlay: {
    zIndex: 1000, // Increased z-index to overlay everything
    backgroundColor: '#111111EE', // Added transparency to match other modals
  },
};
