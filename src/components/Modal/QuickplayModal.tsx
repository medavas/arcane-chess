import React from 'react';
import Modal from 'react-modal';
import _ from 'lodash';

import { withRouter } from '../withRouter/withRouter';
import { connect } from 'react-redux';

import { getLocalStorage } from 'src/utils/handleLocalStorage';

import 'src/components/Modal/QuickplayModal.scss';
import 'src/chessground/styles/chessground.scss';
import 'src/chessground/styles/normal.scss';

import Button from '../Button/Button';
import Select from '../Select/Select';

// import CharacterSelect from './CharacterSelect';
import ArcanaSelect from './ArcanaSelect';
import ArmySelect, { armies } from './ArmySelect';

import {
  startingInventory,
  modes,
  characters,
} from 'src/components/Modal/charactersModes';

import './Modal.scss';

import arcanaJson from 'src/data/arcana.json';

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
  inventory: ArcanaDetail[];
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
      whiteArcana: [...startingInventory],
      blackArcana: [...startingInventory],
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

  transformedInventory = (inventory: ArcanaDetail[]) => {
    const object: { [key: string]: number } = {};
    _.forEach(inventory, (item) => {
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

    const configArcanaA = this.transformedInventory(characterA?.inventory);
    const configArcanaB = this.transformedInventory(characterB?.inventory);

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
        whiteArcana: characterA.inventory,
        blackArcana: characterA.inventory,
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
        whiteArcana: characterA.inventory,
        blackArcana: characterB.inventory,
        showArmySelect: '',
        showArcanaSelect: '',
        showCharacterSelect: '',
        playerCharacterImgPath: playerImagePath,
        engineCharacterImgPath: engineImagePath,
      });
    }
  };

  trueRandomize = (type: 'same' | 'different') => {
    const inventoryA = _.sampleSize(arcanaJson, 6) as ArcanaDetail[];
    const inventoryB = _.sampleSize(arcanaJson, 6) as ArcanaDetail[];

    const configArcanaA = this.transformedInventory(inventoryA);
    const configArcanaB = this.transformedInventory(inventoryB);

    const characterASetup = _.sample(armies) as string;
    const characterBSetup = _.sample(armies)?.toLowerCase() as string;

    if (!this.props.updateConfig) return;

    console.log('White Arcana:', inventoryA, configArcanaA);
    console.log('Black Arcana:', inventoryB, configArcanaB);

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
        whiteArcana: inventoryA,
        blackArcana: inventoryA,
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
        whiteArcana: inventoryA,
        blackArcana: inventoryB,
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

    this.props.updateConfig('wArcana', this.transformedInventory(white.arcana));
    this.props.updateConfig('bArcana', this.transformedInventory(black.arcana));
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
    this.randomGameMode('test1');
  }

  descriptions = (): Record<string, string> => {
    return {
      playerSwapSides: `Human is playing with the ${this.state.playerColor} pieces. Click to swap sides.`,
      engineSwapSides: `Engine is playing with the ${this.state.engineColor} pieces. Click to swap sides.`,
      playerCharacter: 'Click to choose an inventory of spells for the human.',
      engineCharacter: 'Click to choose an inventory of spells for the engine.',
      playerArmy: "The human's army, click to choose a different setup.",
      engineArmy: "The engine's army, click to choose a different setup.",
      promotion:
        'Choose what a Pawn promotes to or leave on Select to pick each time.',
      difficulty: "Choose the engine's difficulty.",
      gameMode: 'Choose a tutorial, or balanced scenario, or themed battle.',
      gameModeRand: 'Click to roll a new game mode.',
      tempRandSame:
        'The human and engine get a random, matching army and inventory of spells from the existing template themes.',
      tempRandDiff:
        'The human and engine get a random, different army and inventory of spells from the existing template themes.',
      trueRandSame:
        'The human and engine get a truly random, matching army and inventory of spells from all options available.',
      start: 'Rock and Roll!',
      trueRandDiff:
        'This one is truly random and unbalanced... but great for experimenting! Click if you dare.',
      '': 'Click Start or choose a new position!',
    };
  };

  render() {
    return (
      <div className="container">
        <Modal
          style={quickPlayModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="quickplay-modal">
            <>
              <div className="player-options-text">
                <div className="top">
                  <Button
                    className="tertiary"
                    color="B"
                    text="HOME"
                    onClick={() => {
                      this.props.navigate('/');
                    }}
                  />
                  <div className="hover-text">
                    <p>{arcana[this.state.hoverId]?.name || ''}</p>
                    <p>
                      {arcana[this.state.hoverId]?.description
                        ? arcana[this.state.hoverId]?.description
                        : this.state.characterDescription !== ''
                        ? this.state.characterDescription
                        : this.descriptions()[this.state.hoverId]}
                    </p>
                  </div>
                </div>
                <div className="sides">
                  <div className="engine">
                    <div className="buttons-arcana">
                      <div className="buttons">
                        <div className="color">
                          <img
                            src={`/assets/images/engine.svg`}
                            style={{
                              width: '180px',
                              height: '60px',
                              background:
                                this.state.hoverId === 'engineSwapSides'
                                  ? '#4A90E2'
                                  : this.state.engineColor === 'white'
                                  ? '#AAAAAA'
                                  : '#333333',
                              cursor:
                                "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                            }}
                            onClick={() =>
                              this.setState(
                                (prevState) => ({
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
                                }),
                                () => {
                                  if (this.props.updateConfig) {
                                    this.props.updateConfig(
                                      'playerColor',
                                      this.state.playerColor === 'white'
                                        ? 'white'
                                        : 'black'
                                    );
                                    this.props.updateConfig(
                                      'engineColor',
                                      this.state.playerColor === 'white'
                                        ? 'black'
                                        : 'white'
                                    );
                                  }
                                }
                              )
                            }
                            onMouseEnter={() => {
                              this.setState({
                                hoverId: 'engineSwapSides',
                              });
                            }}
                            onMouseLeave={() => {
                              this.setState({
                                hoverId: '',
                              });
                            }}
                          />
                        </div>
                        {/* <div className="character-select-container">
                          <img
                            src={`${
                              this.state.engineCharacterImgPath ||
                              '/assets/characters/other'
                            }.svg`}
                            style={{
                              width: '180px',
                              height: '60px',
                              background:
                                this.state.hoverId === 'engineCharacter'
                                  ? '#4A90E2'
                                  : '#808080',
                              cursor:
                                "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                            }}
                            onClick={() => {
                              this.setState({
                                showCharacterSelect:
                                  this.state.engineColor ===
                                  this.state.showCharacterSelect
                                    ? ''
                                    : this.state.engineColor,
                                showArcanaSelect: '',
                                showArmySelect: '',
                              });
                            }}
                            onMouseEnter={() => {
                              this.setState({
                                hoverId: 'engineCharacter',
                              });
                            }}
                            onMouseLeave={() => {
                              this.setState({
                                hoverId: '',
                              });
                            }}
                          />
                          {this.state.showCharacterSelect ? (
                            <CharacterSelect
                              color={this.state.engineColor}
                              isOpen={this.state.showCharacterSelect}
                              sendCharacterSelect={(character) => {
                                const configArcana = this.transformedInventory(
                                  character.inventory
                                );
                                if (this.props.updateConfig)
                                  this.props.updateConfig(
                                    `${
                                      this.state.engineColor === 'white'
                                        ? 'w'
                                        : 'b'
                                    }Arcana`,
                                    configArcana
                                  );
                                if (this.state.engineColor === 'white') {
                                  this.setState({
                                    whiteArcana: character.inventory,
                                    whiteSetup: character.setup,
                                    engineCharacterImgPath: character.imagePath,
                                  });
                                }
                                if (this.state.engineColor === 'black') {
                                  this.setState({
                                    blackArcana: character.inventory,
                                    blackSetup: character.setup.toLowerCase(),
                                    engineCharacterImgPath: character.imagePath,
                                  });
                                }
                              }}
                              handleToggle={() => {
                                this.setState({
                                  showCharacterSelect:
                                    this.state.engineColor ===
                                    this.state.showCharacterSelect
                                      ? ''
                                      : this.state.engineColor,
                                  showArcanaSelect: '',
                                  showArmySelect: '',
                                });
                              }}
                              updateHover={(description: string) => {
                                this.setState({
                                  characterDescription: description,
                                });
                              }}
                            />
                          ) : null}
                        </div> */}
                      </div>
                      <div className="arcana">
                        <ArcanaSelect
                          inventory={
                            this.state.engineColor === 'white'
                              ? this.state.whiteArcana
                              : this.state.blackArcana
                          }
                          isOpen={
                            this.state.showArcanaSelect ===
                            this.state.engineColor
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
                          updateInventory={(inventory) => {
                            const configArcana =
                              this.transformedInventory(inventory);
                            if (this.props.updateConfig)
                              this.props.updateConfig(
                                `${
                                  this.state.engineColor === 'white' ? 'w' : 'b'
                                }Arcana`,
                                configArcana
                              );
                            if (this.state.engineColor === 'white') {
                              this.setState({
                                whiteArcana: inventory,
                                engineCharacterImgPath: '',
                              });
                            }
                            if (this.state.engineColor === 'black') {
                              this.setState({
                                blackArcana: inventory,
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
                              this.state.engineColor ===
                              this.state.showArmySelect
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
                  </div>
                  <div className="player">
                    <div className="buttons-arcana">
                      <div className="buttons">
                        <div className="color">
                          <img
                            src={`/assets/images/user.svg`}
                            style={{
                              width: '180px',
                              height: '60px',
                              background:
                                this.state.hoverId === 'playerSwapSides'
                                  ? '#4A90E2'
                                  : this.state.playerColor === 'white'
                                  ? '#AAAAAA'
                                  : '#333333',
                              cursor:
                                "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                            }}
                            onClick={() =>
                              this.setState(
                                (prevState) => ({
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
                                }),
                                () => {
                                  if (this.props.updateConfig) {
                                    this.props.updateConfig(
                                      'playerColor',
                                      this.state.playerColor === 'white'
                                        ? 'white'
                                        : 'black'
                                    );
                                    this.props.updateConfig(
                                      'engineColor',
                                      this.state.playerColor === 'white'
                                        ? 'black'
                                        : 'white'
                                    );
                                  }
                                }
                              )
                            }
                            onMouseEnter={() => {
                              this.setState({
                                hoverId: 'playerSwapSides',
                              });
                            }}
                            onMouseLeave={() => {
                              this.setState({
                                hoverId: '',
                              });
                            }}
                          />
                        </div>
                        {/* <div className="character-select-container">
                          <div className="character">
                            <img
                              src={`${
                                this.state.playerCharacterImgPath ||
                                '/assets/characters/other'
                              }.svg`}
                              style={{
                                width: '180px',
                                height: '60px',
                                background:
                                  this.state.hoverId === 'playerCharacter'
                                    ? '#4A90E2'
                                    : '#808080',
                                cursor:
                                  "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
                              }}
                              onClick={() => {
                                this.setState({
                                  showCharacterSelect:
                                    this.state.playerColor ===
                                    this.state.showCharacterSelect
                                      ? ''
                                      : this.state.playerColor,
                                  showArcanaSelect: '',
                                  showArmySelect: '',
                                });
                              }}
                              onMouseEnter={() => {
                                this.setState({
                                  hoverId: 'playerCharacter',
                                });
                              }}
                              onMouseLeave={() => {
                                this.setState({
                                  hoverId: '',
                                });
                              }}
                            />
                          </div>
                          {this.state.showCharacterSelect ? (
                            <CharacterSelect
                              color={this.state.playerColor}
                              isOpen={this.state.showCharacterSelect}
                              sendCharacterSelect={(character) => {
                                const configArcana = this.transformedInventory(
                                  character.inventory
                                );
                                if (this.props.updateConfig)
                                  this.props.updateConfig(
                                    `${
                                      this.state.playerColor === 'white'
                                        ? 'w'
                                        : 'b'
                                    }Arcana`,
                                    configArcana
                                  );
                                if (this.state.playerColor === 'white') {
                                  this.setState({
                                    whiteArcana: character.inventory,
                                    whiteSetup: character.setup,
                                    playerCharacterImgPath: character.imagePath,
                                  });
                                }
                                if (this.state.playerColor === 'black') {
                                  this.setState({
                                    blackArcana: character.inventory,
                                    blackSetup: character.setup.toLowerCase(),
                                    playerCharacterImgPath: character.imagePath,
                                  });
                                }
                              }}
                              handleToggle={() => {
                                this.setState({
                                  showCharacterSelect:
                                    this.state.playerColor ===
                                    this.state.showCharacterSelect
                                      ? ''
                                      : this.state.playerColor,
                                  showArcanaSelect: '',
                                  showArmySelect: '',
                                });
                              }}
                              updateHover={(description: string) => {
                                this.setState({
                                  characterDescription: description,
                                });
                              }}
                            />
                          ) : null}
                        </div> */}
                      </div>
                      <div className="arcana">
                        <ArcanaSelect
                          inventory={
                            this.state.playerColor === 'white'
                              ? this.state.whiteArcana
                              : this.state.blackArcana
                          }
                          isOpen={
                            this.state.showArcanaSelect ===
                            this.state.playerColor
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
                          updateInventory={(inventory) => {
                            const configArcana =
                              this.transformedInventory(inventory);
                            if (this.props.updateConfig)
                              this.props.updateConfig(
                                `${
                                  this.state.playerColor === 'white' ? 'w' : 'b'
                                }Arcana`,
                                configArcana
                              );
                            if (this.state.playerColor === 'white') {
                              this.setState({
                                whiteArcana: inventory,
                                playerCharacterImgPath: '',
                              });
                            }
                            if (this.state.playerColor === 'black') {
                              this.setState({
                                blackArcana: inventory,
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
                              this.state.playerColor ===
                              this.state.showArmySelect
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
                        updateHover={(id: string) => {
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
                  </div>
                </div>
              </div>
            </>
            <div className="settings-go">
              <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('difficulty')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Select
                  title="Difficulty"
                  type="number"
                  width={260}
                  height={40}
                  defaultOption={'Novice'}
                  options={['Novice', 'Intermediate', 'Advanced', 'Expert']}
                  onChange={(val) => {
                    if (!this.props.updateConfig) return;
                    if (val === 'Novice') {
                      this.props.updateConfig('thinkingTime', 2);
                      this.props.updateConfig('engineDepth', 1);
                      this.setState((prevState) => {
                        return {
                          config: {
                            ...prevState.config,
                            thinkingTime: 2,
                            engineDepth: 1,
                          },
                        };
                      });
                    }
                    if (val === 'Intermediate') {
                      this.props.updateConfig('thinkingTime', 4);
                      this.props.updateConfig('engineDepth', 3);
                      this.setState((prevState) => {
                        return {
                          config: {
                            ...prevState.config,
                            thinkingTime: 4,
                            engineDepth: 3,
                          },
                        };
                      });
                    }
                    if (val === 'Advanced') {
                      this.props.updateConfig('thinkingTime', 6);
                      this.props.updateConfig('engineDepth', 5);
                      this.setState((prevState) => {
                        return {
                          config: {
                            ...prevState.config,
                            thinkingTime: 6,
                            engineDepth: 5,
                          },
                        };
                      });
                    }
                    if (val === 'Expert') {
                      this.props.updateConfig('thinkingTime', 8);
                      this.props.updateConfig('engineDepth', 7);
                      this.setState((prevState) => {
                        return {
                          config: {
                            ...prevState.config,
                            thinkingTime: 8,
                            engineDepth: 7,
                          },
                        };
                      });
                    }
                  }}
                />
                <div className="engine-strength">
                  <p>
                    ENGINE DEPTH: {this.state.config.engineDepth} half move(s)
                  </p>
                  <p>
                    ENGINE THINK TIME: {this.state.config.thinkingTime}{' '}
                    second(s)
                  </p>
                </div>
              </div>
              {/* <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('promotion')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Select
                  title="Promotion"
                  type="string"
                  width={260}
                  height={40}
                  options={[
                    'Select',
                    'N',
                    'Z',
                    'U',
                    'B',
                    'R',
                    'Q',
                    'T',
                    'M',
                    'W',
                    'S',
                  ]}
                  onChange={(val) => {
                    if (this.props.updateConfig)
                      this.props.updateConfig('placingPromotion', val);
                  }}
                />
              </div> */}
              <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('gameMode')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Select
                  title="Game Mode"
                  type="string"
                  width={260}
                  height={40}
                  options={[
                    // 'Game Mode',
                    ...Object.values(modes).map((mode) => mode.name),
                  ]}
                  defaultOption={this.state.selectedModeName}
                  onChange={(val) => {
                    const selectedMode = Object.values(modes).find(
                      (mode) => mode.name === val
                    );
                    if (selectedMode && this.props.updateConfig) {
                      const whiteConfigArcana = this.transformedInventory(
                        selectedMode.white.arcana
                      );
                      const blackConfigArcana = this.transformedInventory(
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
                      this.props.updateConfig('wArcana', whiteConfigArcana);
                      this.props.updateConfig('bArcana', blackConfigArcana);
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
              {/* <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('tempRandSame')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Button
                  text="Template Randomize Match"
                  className="tertiary"
                  color="B"
                  width={260}
                  height={40}
                  styles={{ marginTop: '20px' }}
                  onClick={() => {
                    this.randomizeTemplates('same');
                  }}
                />
              </div> */}
              {/* <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('tempRandDiff')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Button
                  text="Template Randomize Mismatch"
                  className="tertiary"
                  color="B"
                  width={260}
                  height={40}
                  onClick={() => {
                    this.randomizeTemplates('different');
                  }}
                />
              </div> */}
              <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('gameModeRand')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Button
                  text="New Position"
                  className="tertiary"
                  color="B"
                  width={260}
                  height={40}
                  onClick={() => {
                    this.randomGameMode();
                  }}
                  backgroundColorOverride="linear-gradient(135deg, #00c6ff, #0072ff)"
                />
              </div>
              {/* <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('trueRandDiff')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Button
                  text="True Randomize Mismatch"
                  className="tertiary"
                  color="B"
                  width={260}
                  height={40}
                  onClick={() => {
                    this.trueRandomize('different');
                  }}
                />
              </div> */}
              <div
                className="quickplay-select"
                onMouseEnter={() => this.toggleHover('start')}
                onMouseLeave={() => this.toggleHover('')}
              >
                <Button
                  text="START"
                  className="primary"
                  color="B"
                  width={260}
                  height={60}
                  styles={{ marginTop: '20px' }}
                  onClick={() => {
                    this.props.handleClose();
                  }}
                />
              </div>
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
    height: '100%',
    width: '100%',
    background: '#1111111',
    border: 'none',
    overflowY: 'scroll' as const,
    overflowX: 'hidden' as const,
    msOverflowStyle: 'none' as const,
    scrollbarWidth: 'none' as const,
  },
  overlay: {
    zIndex: 10,
    backgroundColor: '#111111CC',
  },
};
