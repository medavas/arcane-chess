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

import Button from 'src/shared/components/Button/Button';
import './CampaignSettingsModal.scss';

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

class UnwrappedCampaignSettingsModal extends React.Component<
  ModalProps,
  ModalState
> {
  constructor(props: ModalProps) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);
    this.state = {
      config: {
        multiplier: LS.config.multiplier,
        color: LS.config.color,
        thinkingTime: LS.config.thinkingTime,
        depth: LS.config.depth,
        clock: LS.config.clock,
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
        LS.nodeScores,
        (accumulator, value) => {
          return accumulator + value;
        },
        0
      ),
      chapterNum: LS.chapter + 1,
      difficulty: LS.difficulty,
      difficultyDescriptions: {
        novice:
          'NOVICE: For players looking to experience the story, experiement and take their time with the new rules.',
        intermediate:
          'INTERMEDIATE: The clock is enabled, with slightly stronger moves from the engine.',
        advanced:
          'ADVANCED: Players should expect to be more patient and will not have the first move.',
        expert: 'EXPERT: Full-strength challenge for veteran players.',
      },
      hoverDifficulty: LS.difficulty,
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
    const currLS = getLocalStorage(this.props.auth.user.username);
    return (
      <div className="container">
        <Modal
          style={bookSettingsModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="campaign-settings-modal">
            <div className="campaign-header">
              <div className="header-left">
                <button
                  className="home-button"
                  onClick={() => this.props.navigate('/')}
                >
                  <img src="/assets/logoall+.png" alt="Home" className="logo" />
                </button>
              </div>
            </div>
            <div className="multiplier-settings-buttons">
              <div className="difficulty-text">
                <div className="multiplier">SELECT A DIFFICULTY</div>
                <div className="difficulty-description">
                  {
                    this.state.difficultyDescriptions[
                      this.state.hoverDifficulty
                    ]
                  }
                </div>
              </div>
              <div className="difficulties">
                <img
                  className="level level-1"
                  src="/assets/levels/novice.svg"
                  alt="novice"
                  onMouseEnter={() =>
                    this.setState({
                      hoverDifficulty: 'novice',
                    })
                  }
                  onMouseLeave={() =>
                    this.setState({
                      hoverDifficulty: '',
                    })
                  }
                  style={{
                    overflow: 'hidden',
                    // objectFit: 'cover',
                    outline:
                      this.state.hoverDifficulty === 'novice'
                        ? '2px solid #3f48cc'
                        : currLS.difficulty === 'novice'
                        ? '2px solid #3f48cc'
                        : 'none',
                    borderRadius: '5px',
                    cursor:
                      "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                  }}
                  onClick={() => {
                    setLocalStorage({
                      ...getLocalStorage(this.props.auth.user.username),
                      difficulty: 'novice',
                      config: {
                        ...getLocalStorage(this.props.auth.user.username)
                          .config,
                        multiplier: 80,
                        clock: false,
                        color: 'white',
                        depth: 1,
                        thinkingTime: 2,
                      },
                    });
                    this.setState({
                      difficulty: 'novice',
                      config: {
                        ...this.state.config,
                        multiplier: 80,
                        clock: false,
                        color: 'white',
                        depth: 1,
                        thinkingTime: 2,
                      },
                    });
                  }}
                />
                <img
                  className="level level-2"
                  src="/assets/levels/intermediate.svg"
                  alt="intermediate"
                  onMouseEnter={() =>
                    this.setState({
                      hoverDifficulty: 'intermediate',
                    })
                  }
                  onMouseLeave={() =>
                    this.setState({
                      hoverDifficulty: '',
                    })
                  }
                  style={{
                    overflow: 'hidden',
                    // objectFit: 'cover',
                    outline:
                      this.state.hoverDifficulty === 'intermediate'
                        ? '2px solid #34aa48'
                        : currLS.difficulty === 'intermediate'
                        ? '2px solid #34aa48'
                        : 'none',
                    borderRadius: '5px',
                    cursor:
                      "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                  }}
                  onClick={() => {
                    setLocalStorage({
                      ...getLocalStorage(this.props.auth.user.username),
                      difficulty: 'intermediate',
                      config: {
                        ...getLocalStorage(this.props.auth.user.username)
                          .config,
                        multiplier: 95,
                        clock: true,
                        color: 'white',
                        depth: 3,
                        thinkingTime: 4,
                      },
                    });
                    this.setState({
                      difficulty: 'intermediate',
                      config: {
                        ...this.state.config,
                        multiplier: 95,
                        clock: true,
                        color: 'white',
                        depth: 3,
                        thinkingTime: 4,
                      },
                    });
                  }}
                />
                <img
                  className="level level-3"
                  src="/assets/levels/advanced.svg"
                  alt="advanced"
                  onMouseEnter={() =>
                    this.setState({
                      hoverDifficulty: 'advanced',
                    })
                  }
                  onMouseLeave={() =>
                    this.setState({
                      hoverDifficulty: '',
                    })
                  }
                  style={{
                    overflow: 'hidden',
                    // objectFit: 'cover',
                    outline:
                      this.state.hoverDifficulty === 'advanced'
                        ? '2px solid #d9b800'
                        : currLS.difficulty === 'advanced'
                        ? '2px solid #d9b800'
                        : 'none',
                    borderRadius: '5px',
                    cursor:
                      "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                  }}
                  onClick={() => {
                    setLocalStorage({
                      ...getLocalStorage(this.props.auth.user.username),
                      difficulty: 'advanced',
                      config: {
                        ...getLocalStorage(this.props.auth.user.username)
                          .config,
                        multiplier: 110,
                        clock: true,
                        color: 'black',
                        depth: 5,
                        thinkingTime: 6,
                      },
                    });
                    this.setState({
                      difficulty: 'advanced',
                      config: {
                        ...this.state.config,
                        multiplier: 110,
                        clock: true,
                        color: 'black',
                        depth: 5,
                        thinkingTime: 6,
                      },
                    });
                  }}
                />
                <img
                  className="level level-4"
                  src="/assets/levels/expert.svg"
                  alt="expert"
                  onMouseEnter={() =>
                    this.setState({
                      hoverDifficulty: 'expert',
                    })
                  }
                  onMouseLeave={() =>
                    this.setState({
                      hoverDifficulty: '',
                    })
                  }
                  style={{
                    overflow: 'hidden',
                    // objectFit: 'cover',
                    outline:
                      this.state.hoverDifficulty === 'expert'
                        ? '2px solid #c53939'
                        : currLS.difficulty === 'expert'
                        ? '2px solid #c53939'
                        : 'none',
                    borderRadius: '5px',
                    cursor:
                      "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                  }}
                  onClick={() => {
                    setLocalStorage({
                      ...getLocalStorage(this.props.auth.user.username),
                      difficulty: 'expert',
                      config: {
                        ...getLocalStorage(this.props.auth.user.username)
                          .config,
                        multiplier: 125,
                        clock: true,
                        color: 'black',
                        depth: 7,
                        thinkingTime: 8,
                      },
                    });
                    this.setState({
                      difficulty: 'expert',
                      config: {
                        ...this.state.config,
                        multiplier: 125,
                        clock: true,
                        color: 'black',
                        depth: 7,
                        thinkingTime: 8,
                      },
                    });
                  }}
                />
              </div>
              <div className="settings-buttons">
                <div className="settings">
                  <div className="multiplier">
                    <div className="setting">CHALLENGE MULTIPLIER:</div>x
                    {currLS.config.multiplier}
                  </div>
                  <div className="setting-descriptions">
                    <div className="setting">
                      <div>ENGINE DEPTH:</div>
                      <div>{currLS.config.depth} moves</div>
                    </div>
                    <div className="setting">
                      <div>PLAYER CLOCK:</div>
                      <div>{currLS.config.clock ? 'ON' : 'OFF'}</div>
                    </div>
                    <div className="setting">
                      <div>ENGINE TIME:</div>
                      <div>{currLS.config.thinkingTime} seconds</div>
                    </div>
                    <div className="setting">
                      <div>PLAYER COLOR:</div>
                      <div>{currLS.config.color}</div>
                    </div>
                  </div>
                </div>
                <div className="buttons">
                  {/* <div className="handicaps">
                    <div className="settings-block">
                      <Toggle
                        title="Blunder Vision"
                        callback={(val) =>
                          this.updateConfig(
                            val,
                            'blunderVision',
                            val ? -30 : 30
                          )
                        }
                      />
                    </div>
                    <div className="settings-block">
                      <Toggle
                        title="Check Vision"
                        callback={(val) =>
                          this.updateConfig(val, 'threatVision', val ? -30 : 30)
                        }
                      />
                    </div>
                  </div>
                  <div className="handicap-descriptions"></div> */}
                  <div className="action-buttons">
                    <Button
                      text="CANCEL"
                      className="secondary"
                      color="S"
                      height={60}
                      width={120}
                      onClick={() => this.props.toggleModal()}
                    />
                    <Button
                      text="START"
                      className="primary"
                      color="S"
                      height={60}
                      width={120}
                      onClick={() => this.saveSettingsStartBook()}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

// please do mapstatetoprops stuff

function mapStateToProps({ auth }: { auth: any }) {
  return {
    auth,
  };
}

const CampaignSettingsModal = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedCampaignSettingsModal));

export default CampaignSettingsModal;

const bookSettingsModal = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: 'auto',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    height: '95vh',
    maxHeight: '95vh',
    width: '90vw',
    maxWidth: '95vw',
    background: 'transparent',
    border: 'none',
    padding: 0,
    overflow: 'hidden' as const,
  },
  overlay: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
  },
};
