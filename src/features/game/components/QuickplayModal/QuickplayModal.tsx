import React from 'react';
import Modal from 'react-modal';
import _ from 'lodash';

import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { connect } from 'react-redux';

import { getLocalStorage } from 'src/shared/utils/handleLocalStorage';

import './QuickplayModal.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';

import Select from 'src/shared/components/Select/Select';

// import CharacterSelect from './CharacterSelect';
import ArcanaSelect from 'src/features/campaign/components/ArcanaSelect/ArcanaSelect';
import ArmySelect, {
  armies,
} from 'src/features/game/components/ArmySelect/ArmySelect';

import {
  startingSpellBook,
  modes,
  characters,
} from 'src/features/game/components/CharacterSelect/charactersModes';

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
  hoverId: string;
  whiteArcana: ArcanaDetail[];
  blackArcana: ArcanaDetail[];
  whiteSetup: string;
  blackSetup: string;
  playerColor: string;
  engineColor: string;
  animatedValue: number;
  targetValue: number;
  reducedScore: number;
  chapterNum: number;
  difficulty: string;
  difficultyDescriptions: { [key: string]: string };
  hoverDifficulty: string;
  showCharacterSelect: string;
  showArmySelect: string;
  showArcanaSelect: string;
  playerCharacterImgPath: string;
  engineCharacterImgPath: string;
  characterDescription: string;
  selectedModeName: string;
  activeTab: 'player' | 'engine' | 'settings';
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

interface Character {
  name: string;
  spellBook: ArcanaDetail[];
  setup: string;
  imagePath: string;
  color: string;
  description: string;
}

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

class UnwrappedTactoriusModal extends React.Component<ModalProps, ModalState> {
  constructor(props: ModalProps) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);
    this.state = {
      config: {
        multiplier: LS.config.multiplier,
        color: LS.config.color,
        thinkingTime: 2,
        engineDepth: 1,
        clock: LS.config.clock,
        blunderVision: false,
        threatVision: false,
        checkVision: false,
        hints: false,
        autopromotion: 'Select',
      },
      hoverId: '',
      whiteArcana: [...startingSpellBook],
      blackArcana: [...startingSpellBook],
      whiteSetup: 'RNBQKBNR',
      blackSetup: 'rnbqkbnr',
      playerColor: 'white',
      engineColor: 'black',
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
          'NOVICE: For players looking to experiement and take their time with the new rules.',
        intermediate:
          'INTERMEDIATE: The clock is enabled, with slightly stronger moves from the engine.',
        advanced:
          'ADVANCED: Players should expect to be more patient and will not have the first move.',
        expert: 'EXPERT: Full-strength challenge for veteran players.',
      },
      hoverDifficulty: LS.difficulty,
      showCharacterSelect: '',
      showArmySelect: '',
      showArcanaSelect: '',
      playerCharacterImgPath: '',
      engineCharacterImgPath: '',
      characterDescription: '',
      selectedModeName: '',
      activeTab: 'player' as 'player' | 'engine' | 'settings',
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

  transformedSpellBook = (spellBook: ArcanaDetail[]) => {
    const object: { [key: string]: number } = {};
    _.forEach(spellBook, (item) => {
      if (item.id === 'empty') return;
      if (object[item.id] > 0) {
        object[item.id] += 1;
      } else {
        object[item.id] = 1;
      }
    });
    return object;
  };

  toggleHover = (text: string) => {
    this.setState({ hoverId: text });
  };

  randomizeTemplates = (type: 'same' | 'different') => {
    const characterA = _.sample(characters) as Character;
    const characterB = _.sample(characters) as Character;

    const configArcanaA = this.transformedSpellBook(characterA?.spellBook);
    const configArcanaB = this.transformedSpellBook(characterB?.spellBook);

    if (!this.props.updateConfig) return;

    if (type === 'same') {
      this.props.updateConfig('wArcana', configArcanaA);
      this.props.updateConfig('bArcana', configArcanaA);
      this.props.updateConfig('whiteSetup', characterA.setup);
      this.props.updateConfig(
        'blackSetup',
        characterA.setup.toLocaleLowerCase()
      );
      this.setState({
        whiteSetup: characterA.setup,
        blackSetup: characterA.setup,
        whiteArcana: characterA.spellBook,
        blackArcana: characterA.spellBook,
        showArmySelect: '',
        showArcanaSelect: '',
        showCharacterSelect: '',
        playerCharacterImgPath: characterA.imagePath,
        engineCharacterImgPath: characterA.imagePath,
      });
    }

    const playerImagePath =
      this.state.playerColor === 'white'
        ? characterA.imagePath
        : characterB.imagePath;
    const engineImagePath =
      this.state.engineColor === 'white'
        ? characterA.imagePath
        : characterB.imagePath;

    if (type === 'different') {
      this.props.updateConfig('wArcana', configArcanaA);
      this.props.updateConfig('bArcana', configArcanaB);
      this.props.updateConfig('whiteSetup', characterA.setup);
      this.props.updateConfig(
        'blackSetup',
        characterB.setup.toLocaleLowerCase()
      );
      this.setState({
        whiteSetup: characterA.setup,
        blackSetup: characterB.setup,
        whiteArcana: characterA.spellBook,
        blackArcana: characterB.spellBook,
        showArmySelect: '',
        showArcanaSelect: '',
        showCharacterSelect: '',
        playerCharacterImgPath: playerImagePath,
        engineCharacterImgPath: engineImagePath,
      });
    }
  };

  trueRandomize = (type: 'same' | 'different') => {
    const spellBookA = _.sampleSize(arcanaJson, 6) as ArcanaDetail[];
    const spellBookB = _.sampleSize(arcanaJson, 6) as ArcanaDetail[];

    const configArcanaA = this.transformedSpellBook(spellBookA);
    const configArcanaB = this.transformedSpellBook(spellBookB);

    const characterASetup = _.sample(armies) as string;
    const characterBSetup = _.sample(armies)?.toLowerCase() as string;

    if (!this.props.updateConfig) return;

    console.log('White Arcana:', spellBookA, configArcanaA);
    console.log('Black Arcana:', spellBookB, configArcanaB);

    if (type === 'same') {
      this.props.updateConfig('wArcana', configArcanaA);
      this.props.updateConfig('bArcana', configArcanaA);
      this.props.updateConfig('whiteSetup', characterASetup);
      this.props.updateConfig(
        'blackSetup',
        characterASetup.toLocaleLowerCase()
      );
      this.setState({
        whiteSetup: characterASetup,
        blackSetup: characterASetup,
        whiteArcana: spellBookA,
        blackArcana: spellBookA,
        showArmySelect: '',
        showArcanaSelect: '',
        showCharacterSelect: '',
        playerCharacterImgPath: '',
        engineCharacterImgPath: '',
      });
    }

    if (type === 'different') {
      this.props.updateConfig('wArcana', configArcanaA);
      this.props.updateConfig('bArcana', configArcanaB);
      this.props.updateConfig('whiteSetup', characterASetup);
      this.props.updateConfig('blackSetup', characterBSetup);
      this.setState({
        whiteSetup: characterASetup,
        blackSetup: characterBSetup,
        whiteArcana: spellBookA,
        blackArcana: spellBookB,
        showArmySelect: '',
        showArcanaSelect: '',
        showCharacterSelect: '',
        playerCharacterImgPath: '',
        engineCharacterImgPath: '',
      });
    }
  };

  randomGameMode = (modeKey?: string) => {
    const chosenKey = modeKey || (_.sample(Object.keys(modes)) as string);
    const chosenMode = modes[chosenKey];

    if (!chosenMode || !this.props.updateConfig) return;

    const { white, black } = chosenMode;

    this.props.updateConfig('wArcana', this.transformedSpellBook(white.arcana));
    this.props.updateConfig('bArcana', this.transformedSpellBook(black.arcana));
    this.props.updateConfig('whiteSetup', white.setup);
    this.props.updateConfig('blackSetup', black.setup);

    this.setState({
      whiteArcana: white.arcana,
      blackArcana: black.arcana,
      whiteSetup: white.setup,
      blackSetup: black.setup,
      playerCharacterImgPath: '',
      engineCharacterImgPath: '',
      showArmySelect: '',
      showArcanaSelect: '',
      showCharacterSelect: '',
      selectedModeName: chosenMode.name,
    });
  };

  componentDidMount() {
    this.randomGameMode('test5');
  }

  descriptions = (): Record<string, string> => {
    return {
      playerSwapSides: `Human is playing with the ${this.state.playerColor} pieces. Click to swap sides.`,
      engineSwapSides: `Engine is playing with the ${this.state.engineColor} pieces. Click to swap sides.`,
      playerCharacter: 'Click to choose an spellBook of spells for the human.',
      engineCharacter: 'Click to choose an spellBook of spells for the engine.',
      playerArmy: "The human's army, click to choose a different setup.",
      engineArmy: "The engine's army, click to choose a different setup.",
      promotion:
        'Choose what a Pawn promotes to or leave on Select to pick each time.',
      difficulty: "Choose the engine's difficulty.",
      gameMode: 'Choose a tutorial, or balanced scenario, or themed battle.',
      gameModeRand: 'Click to roll a new game mode.',
      swapSides: 'Swap the player and engine colors.',
      randomize: 'Get a random Game Mode.',
      '': 'Hover over options to see details',
    };
  };

  render() {
    const hoverContent = arcana[this.state.hoverId]?.description
      ? arcana[this.state.hoverId]?.description
      : this.state.characterDescription !== ''
        ? this.state.characterDescription
        : this.descriptions()[this.state.hoverId];

    return (
      <div className="container">
        <Modal
          style={quickPlayModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="quickplay-modal">
            {/* Header */}
            <div className="quickplay-header">
              <div className="header-left">
                <button
                  className="home-button"
                  onClick={() => {
                    this.props.navigate('/');
                  }}
                >
                  <img className="logo" src="/assets/logoall+.png" alt="Home" />
                </button>
                {/* Hover Panel - inline with home button on medium screens */}
                <div className="hover-panel">
                  {this.state.hoverId ? (
                    <>
                      <div className="hover-title">
                        {arcana[this.state.hoverId]?.name || 'Info'}
                      </div>
                      <div className="hover-description">{hoverContent}</div>
                    </>
                  ) : (
                    <div className="hover-empty">
                      Hover over options to see details.
                    </div>
                  )}
                </div>
              </div>
              {/* Tab Navigation */}
              <div className="tab-nav">
                <button
                  className={`tab-button ${this.state.activeTab === 'player' ? 'active' : ''
                    }`}
                  onClick={() => this.setState({ activeTab: 'player' })}
                >
                  Player
                </button>
                <button
                  className={`tab-button ${this.state.activeTab === 'engine' ? 'active' : ''
                    }`}
                  onClick={() => this.setState({ activeTab: 'engine' })}
                >
                  Engine
                </button>
                <button
                  className={`tab-button ${this.state.activeTab === 'settings' ? 'active' : ''
                    }`}
                  onClick={() => this.setState({ activeTab: 'settings' })}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Mobile Hover Panel - conditional, between header and content */}
            <div className="hover-panel mobile-hover">
              {arcana[this.state.hoverId]?.name || hoverContent ? (
                <>
                  <div className="hover-title">
                    {arcana[this.state.hoverId]?.name || ''}
                  </div>
                  <div className="hover-description">{hoverContent}</div>
                </>
              ) : (
                <div className="hover-empty">
                  Hover over options to see details
                </div>
              )}
            </div>

            {/* Content Container with Tabs */}
            <div className="content-container">
              {/* Player Section */}
              <div
                className={`player-section ${this.state.activeTab === 'player' ? 'active' : ''
                  }`}
              >
                <div className="section-header">
                  <h3>Your Setup</h3>
                  <div className="color-indicator">
                    {this.state.playerColor === 'white' ? '⚪' : '⚫'}{' '}
                    {this.state.playerColor}
                  </div>
                </div>
                <div className="buttons-arcana">
                  <div className="arcana">
                    <ArcanaSelect
                      spellBook={
                        this.state.playerColor === 'white'
                          ? this.state.whiteArcana
                          : this.state.blackArcana
                      }
                      isOpen={
                        this.state.showArcanaSelect === this.state.playerColor
                      }
                      handleToggle={() => {
                        this.setState({
                          showArcanaSelect:
                            this.state.playerColor ===
                              this.state.showArcanaSelect
                              ? ''
                              : this.state.playerColor,
                          showCharacterSelect: '',
                          showArmySelect: '',
                        });
                      }}
                      color={this.state.playerColor}
                      updateSpellBook={(spellBook) => {
                        const configArcana =
                          this.transformedSpellBook(spellBook);
                        if (this.props.updateConfig)
                          this.props.updateConfig(
                            `${this.state.playerColor === 'white' ? 'w' : 'b'
                            }Arcana`,
                            configArcana
                          );
                        if (this.state.playerColor === 'white') {
                          this.setState({
                            whiteArcana: spellBook,
                            playerCharacterImgPath: '',
                          });
                        }
                        if (this.state.playerColor === 'black') {
                          this.setState({
                            blackArcana: spellBook,
                            playerCharacterImgPath: '',
                          });
                        }
                      }}
                      updateHover={(arcaneObject) => {
                        this.setState({
                          hoverId: arcaneObject.id || '',
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="army-section">
                  <ArmySelect
                    army={
                      this.state.playerColor === 'white'
                        ? this.state.whiteSetup
                        : this.state.blackSetup
                    }
                    isOpen={
                      this.state.showArmySelect === this.state.playerColor
                    }
                    handleToggle={() => {
                      this.setState({
                        showArmySelect:
                          this.state.playerColor === this.state.showArmySelect
                            ? ''
                            : this.state.playerColor,
                        showCharacterSelect: '',
                        showArcanaSelect: '',
                      });
                    }}
                    color={this.state.playerColor}
                    faction="tau"
                    updateArmy={(army) => {
                      if (this.props.updateConfig) {
                        this.props.updateConfig(
                          `${this.state.playerColor}Setup`,
                          army
                        );
                        if (this.state.playerColor === 'white') {
                          this.setState({
                            whiteSetup: army,
                            playerCharacterImgPath: '',
                          });
                        }
                        if (this.state.playerColor === 'black') {
                          this.setState({
                            blackSetup: army,
                            playerCharacterImgPath: '',
                          });
                        }
                      }
                    }}
                    updateHover={(id) => {
                      if (id !== '') {
                        this.setState({
                          hoverId: 'playerArmy',
                        });
                      } else {
                        this.setState({
                          hoverId: '',
                        });
                      }
                    }}
                  />
                </div>
                {/* Mobile Start Button */}
                <button
                  type="button"
                  className="mobile-start-button"
                  onClick={() => this.props.handleClose()}
                  onMouseEnter={() => this.setState({ hoverId: 'start' })}
                  onMouseLeave={() => this.setState({ hoverId: '' })}
                >
                  ▶ START
                </button>
              </div>

              {/* Engine Section */}
              <div
                className={`engine-section ${this.state.activeTab === 'engine' ? 'active' : ''
                  }`}
              >
                <div className="section-header">
                  <h3>Engine Setup</h3>
                  <div className="color-indicator">
                    {this.state.engineColor === 'white' ? '⚪' : '⚫'}{' '}
                    {this.state.engineColor}
                  </div>
                </div>
                <div className="buttons-arcana">
                  <div className="arcana">
                    <ArcanaSelect
                      spellBook={
                        this.state.engineColor === 'white'
                          ? this.state.whiteArcana
                          : this.state.blackArcana
                      }
                      isOpen={
                        this.state.showArcanaSelect === this.state.engineColor
                      }
                      handleToggle={() => {
                        this.setState({
                          showArcanaSelect:
                            this.state.engineColor ===
                              this.state.showArcanaSelect
                              ? ''
                              : this.state.engineColor,
                          showCharacterSelect: '',
                          showArmySelect: '',
                        });
                      }}
                      color={this.state.engineColor}
                      updateSpellBook={(spellBook) => {
                        const configArcana =
                          this.transformedSpellBook(spellBook);
                        if (this.props.updateConfig)
                          this.props.updateConfig(
                            `${this.state.engineColor === 'white' ? 'w' : 'b'
                            }Arcana`,
                            configArcana
                          );
                        if (this.state.engineColor === 'white') {
                          this.setState({
                            whiteArcana: spellBook,
                            engineCharacterImgPath: '',
                          });
                        }
                        if (this.state.engineColor === 'black') {
                          this.setState({
                            blackArcana: spellBook,
                            engineCharacterImgPath: '',
                          });
                        }
                      }}
                      updateHover={(arcaneObject) => {
                        this.setState({
                          hoverId: arcaneObject.id || '',
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="army-section">
                  <ArmySelect
                    army={
                      this.state.engineColor === 'white'
                        ? this.state.whiteSetup
                        : this.state.blackSetup
                    }
                    isOpen={
                      this.state.showArmySelect === this.state.engineColor
                    }
                    handleToggle={() => {
                      this.setState({
                        showArmySelect:
                          this.state.engineColor === this.state.showArmySelect
                            ? ''
                            : this.state.engineColor,
                        showCharacterSelect: '',
                        showArcanaSelect: '',
                      });
                    }}
                    color={this.state.engineColor}
                    faction="tau"
                    updateArmy={(army) => {
                      if (this.props.updateConfig) {
                        this.props.updateConfig(
                          `${this.state.engineColor}Setup`,
                          army
                        );
                        if (this.state.engineColor === 'white') {
                          this.setState({
                            whiteSetup: army,
                            engineCharacterImgPath: '',
                          });
                        }
                        if (this.state.engineColor === 'black') {
                          this.setState({
                            blackSetup: army,
                            engineCharacterImgPath: '',
                          });
                        }
                      }
                    }}
                    updateHover={(id) => {
                      if (id !== '') {
                        this.setState({
                          hoverId: 'engineArmy',
                        });
                      } else {
                        this.setState({
                          hoverId: '',
                        });
                      }
                    }}
                  />
                </div>
                {/* Mobile Start Button */}
                <button
                  type="button"
                  className="mobile-start-button"
                  onClick={() => this.props.handleClose()}
                  onMouseEnter={() => this.setState({ hoverId: 'start' })}
                  onMouseLeave={() => this.setState({ hoverId: '' })}
                >
                  ▶ START
                </button>
              </div>

              {/* Settings Section */}
              <div
                className={
                  this.state.activeTab === 'settings'
                    ? 'settings-section active'
                    : 'settings-section'
                }
              >
                <div className="settings-content">
                  {/* Engine strength info at top */}
                  <div className="engine-strength">
                    <p>
                      ENGINE DEPTH: {this.state.config.engineDepth} half move(s)
                    </p>
                    <p>
                      ENGINE THINK TIME: {this.state.config.thinkingTime}{' '}
                      second(s)
                    </p>
                  </div>

                  {/* Single row: Game Mode and Difficulty */}
                  <div className="settings-row">
                    <div
                      className="quickplay-select"
                      onMouseEnter={() => this.toggleHover('gameMode')}
                      onMouseLeave={() => this.toggleHover('')}
                    >
                      <Select
                        title="Game Mode"
                        type="string"
                        width="100%"
                        height={40}
                        options={[
                          ...Object.values(modes).map((mode) => mode.name),
                        ]}
                        defaultOption={this.state.selectedModeName}
                        onChange={(val) => {
                          const selectedMode = Object.values(modes).find(
                            (mode) => mode.name === val
                          );
                          if (selectedMode && this.props.updateConfig) {
                            const whiteConfigArcana = this.transformedSpellBook(
                              selectedMode.white.arcana
                            );
                            const blackConfigArcana = this.transformedSpellBook(
                              selectedMode.black.arcana
                            );
                            this.props.updateConfig(
                              'whiteSetup',
                              selectedMode.white.setup
                            );
                            this.props.updateConfig(
                              'blackSetup',
                              selectedMode.black.setup
                            );
                            this.props.updateConfig(
                              'wArcana',
                              whiteConfigArcana
                            );
                            this.props.updateConfig(
                              'bArcana',
                              blackConfigArcana
                            );
                            this.setState({
                              whiteArcana: selectedMode.white.arcana,
                              whiteSetup: selectedMode.white.setup,
                              blackArcana: selectedMode.black.arcana,
                              blackSetup: selectedMode.black.setup,
                              engineCharacterImgPath: '',
                              playerCharacterImgPath: '',
                              selectedModeName: val,
                            });
                          }
                        }}
                      />
                    </div>
                    <div
                      className="quickplay-select"
                      onMouseEnter={() => this.toggleHover('difficulty')}
                      onMouseLeave={() => this.toggleHover('')}
                    >
                      <Select
                        title="Difficulty"
                        type="string"
                        width="100%"
                        height={40}
                        options={[
                          'Novice',
                          'Intermediate',
                          'Advanced',
                          'Expert',
                        ]}
                        defaultOption={
                          this.state.difficulty.charAt(0).toUpperCase() +
                          this.state.difficulty.slice(1)
                        }
                        onChange={(val) => {
                          if (this.props.updateConfig)
                            this.props.updateConfig(
                              'difficulty',
                              val.toLowerCase()
                            );
                          this.setState({ difficulty: val.toLowerCase() });
                          if (val === 'Novice') {
                            if (this.props.updateConfig) {
                              this.props.updateConfig('thinkingTime', 2);
                              this.props.updateConfig('engineDepth', 1);
                            }
                            this.setState((prevState) => ({
                              config: {
                                ...prevState.config,
                                thinkingTime: 2,
                                engineDepth: 1,
                              },
                            }));
                          }
                          if (val === 'Intermediate') {
                            this.props.updateConfig!('thinkingTime', 4);
                            this.props.updateConfig!('engineDepth', 3);
                            this.setState((prevState) => ({
                              config: {
                                ...prevState.config,
                                thinkingTime: 4,
                                engineDepth: 3,
                              },
                            }));
                          }
                          if (val === 'Advanced') {
                            this.props.updateConfig!('thinkingTime', 6);
                            this.props.updateConfig!('engineDepth', 5);
                            this.setState((prevState) => ({
                              config: {
                                ...prevState.config,
                                thinkingTime: 6,
                                engineDepth: 5,
                              },
                            }));
                          }
                          if (val === 'Expert') {
                            this.props.updateConfig!('thinkingTime', 8);
                            this.props.updateConfig!('engineDepth', 7);
                            this.setState((prevState) => ({
                              config: {
                                ...prevState.config,
                                thinkingTime: 8,
                                engineDepth: 7,
                              },
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Action buttons like in Skirmish */}
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="action-btn swap-btn"
                      onClick={() => {
                        this.setState((prevState) => ({
                          playerColor:
                            prevState.playerColor === 'white'
                              ? 'black'
                              : 'white',
                          engineColor:
                            prevState.engineColor === 'white'
                              ? 'black'
                              : 'white',
                          playerCharacterImgPath:
                            prevState.engineCharacterImgPath,
                          engineCharacterImgPath:
                            prevState.playerCharacterImgPath,
                        }));
                      }}
                      onMouseEnter={() =>
                        this.setState({ hoverId: 'swapSides' })
                      }
                      onMouseLeave={() => this.setState({ hoverId: '' })}
                    >
                      <span>⇄</span> SWAP SIDES
                    </button>
                    <button
                      type="button"
                      className="action-btn randomize-btn"
                      onClick={() => this.randomGameMode()}
                      onMouseEnter={() =>
                        this.setState({ hoverId: 'randomize' })
                      }
                      onMouseLeave={() => this.setState({ hoverId: '' })}
                    >
                      <span>🎲</span> RANDOMIZE
                    </button>
                    <button
                      type="button"
                      className="action-btn start-btn"
                      onClick={() => this.props.handleClose()}
                      onMouseEnter={() => this.setState({ hoverId: 'start' })}
                      onMouseLeave={() => this.setState({ hoverId: '' })}
                    >
                      ▶ START
                    </button>
                  </div>
                </div>
              </div>
              {/* Close content-container */}
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

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
    height: '95vh',
    maxHeight: '95vh',
    width: '90vw',
    maxWidth: '1400px',
    background: 'transparent',
    border: 'none',
    padding: '0',
    overflow: 'hidden',
  },
  overlay: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
  },
};
