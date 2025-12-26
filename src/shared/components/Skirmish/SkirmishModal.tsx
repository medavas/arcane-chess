import React from 'react';
import Modal from 'react-modal';
import _ from 'lodash';

import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { connect } from 'react-redux';

import { getLocalStorage } from 'src/shared/utils/handleLocalStorage';

import './SkirmishModal.scss';

import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/chi.scss';
import 'src/features/game/board/styles/lambda.scss';
import 'src/features/game/board/styles/sigma.scss';
import 'src/features/game/board/styles/omega.scss';
import 'src/features/game/board/styles/psi.scss';
import 'src/features/game/board/styles/gamma.scss';

import ArcanaSelect from 'src/features/campaign/components/ArcanaSelect/ArcanaSelect';
import ArmySelect from 'src/features/game/components/ArmySelect/ArmySelect';

import { startingSpellBook } from 'src/features/game/components/CharacterSelect/charactersModes';

import arcanaJson from 'src/shared/data/arcana.json';
import Select from 'src/shared/components/Select/Select';

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

  whiteArcana: ArcanaDetail[];
  blackArcana: ArcanaDetail[];
  whiteSetup: string;
  blackSetup: string;

  playerColor: 'white' | 'black';
  engineColor: 'white' | 'black';

  engineArchetypeId: ArchetypeId | null;
  playerArchetypeId: ArchetypeId | null;

  reducedScore: number;
  chapterNum: number;
  difficulty: string;

  hoverId: string;
  activeTab: 'player' | 'engine';
  showPlayerArchetypePicker: boolean;
  showEngineArchetypePicker: boolean;
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

type ArchetypeId =
  | 'gladiator'
  | 'mage'
  | 'priest'
  | 'ephilate'
  | 'illusionist'
  | 'hermit'
  | 'tactician'
  | 'alien';

type FactionId = 'chi' | 'gamma' | 'omega' | 'lambda' | 'sigma' | 'psi' | 'tau';

type Archetype = {
  id: ArchetypeId;
  name: string;
  army: string;
  arcana: string[];
  faction: FactionId;
  image?: string;
  description: string;
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  gladiator: {
    id: 'gladiator',
    name: 'Gladiator',
    army: 'TMQVKQMT',
    arcana: ['modsBLI', 'modsBLI'],
    faction: 'tau',
    image: '/assets/archetypes/gladiator.svg',
    description:
      'Elite compact force that pushes back enemy pawns with Blitz, creating unstoppable forward momentum.',
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    army: 'RNBMKBNR',
    arcana: ['sumnRT', 'sumnRN', 'sumnRY', 'sumnRZ', 'sumnRI', 'modsSIL'],
    faction: 'omega',
    image: '/assets/archetypes/mage.svg',
    description:
      'Hexweaver who conjures entanglement zones across files, ranks, and grids while capturing frozen enemies.',
  },
  priest: {
    id: 'priest',
    name: 'Priest',
    army: '1NBQKBN1',
    arcana: ['modsINH', 'sumnP', 'sumnZ', 'sumnU', 'sumnR', 'sumnM'],
    faction: 'psi',
    image: '/assets/archetypes/priest.svg',
    description:
      'Begins without rooks but summons vast reinforcements—pawns, knights, and even mystics—with early promotions.',
  },
  ephilate: {
    id: 'ephilate',
    name: 'Ephilate',
    army: 'RSWMKWSR',
    arcana: [
      'modsCON',
      'modsCON',
      'modsREI',
      'modsBAN',
      'modsREA',
      'shftG',
      'moriPAW',
    ],
    faction: 'sigma',
    image: '/assets/archetypes/ephilate.svg',
    description:
      'Necromancer who devours allies to reincarnate them, extends spectral reach, and empowers wraiths.',
  },
  illusionist: {
    id: 'illusionist',
    name: 'Illusionist',
    army: 'RNZTKWUR',
    arcana: ['doplC', 'modsFLA', 'swapADJ', 'swapADJ', 'gainFOR', 'modsMAG'],
    faction: 'chi',
    image: '/assets/archetypes/illusionist.svg',
    description:
      'Reality-bender with random powerful magic, position swaps, flank inversions, and magnetic tricks.',
  },
  hermit: {
    id: 'hermit',
    name: 'Hermit',
    army: 'RSBQKBSR',
    arcana: ['toknHER', 'sumnH', 'sumnH', 'modsEXT', 'shftI', 'modsRED'],
    faction: 'gamma',
    image: '/assets/archetypes/hermit.svg',
    description:
      'Mystical hermit with royal auras, herring summons, board-wide reach, piece hopping, and slider reduction.',
  },
  tactician: {
    id: 'tactician',
    name: 'Tactician',
    army: 'RNWVKWNR',
    arcana: ['dyadA', 'modsAET', 'modsSUR', 'shftK', 'sumnX', 'modsFUT'],
    faction: 'lambda',
    image: '/assets/archetypes/tactician.svg',
    description:
      'Strategic master with double-move dyads, aethereal pawn abilities, aggressive king mobility, and exile summons.',
  },
  alien: {
    id: 'alien',
    name: 'Alien',
    army: 'RSBMKZUW',
    arcana: ['modsBOU', 'modsTRA', 'modsGLA', 'swapDEP', 'modsPHA', 'modsGLI'],
    faction: 'omega',
    image: '/assets/archetypes/alien.svg',
    description:
      'Bizarre entity with bouncing bishops, trampling knights, disarming rooks, invisibility, and mind scrambling.',
  },
};

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

class UnwrappedSkirmishModal extends React.Component<ModalProps, ModalState> {
  constructor(props: ModalProps) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);

    // Use defaults if LS is null (for Skirmish without login)
    const config = LS?.config || {
      multiplier: 80,
      color: 'white',
      clock: false,
    };
    const nodeScores = LS?.nodeScores || {};
    const chapter = LS?.chapter ?? 0;
    const difficulty = LS?.difficulty || 'novice';

    this.state = {
      config: {
        multiplier: config.multiplier,
        color: config.color,
        thinkingTime: 2,
        engineDepth: 1,
        clock: config.clock,
        blunderVision: false,
        threatVision: false,
        checkVision: false,
        hints: false,
        autopromotion: 'Select',
      },

      whiteArcana: [...startingSpellBook],
      blackArcana: [...startingSpellBook],
      whiteSetup: 'RNBQKBNR',
      blackSetup: 'rnbqkbnr',

      playerColor: 'white',
      engineColor: 'black',

      engineArchetypeId: null,
      playerArchetypeId: null,

      reducedScore: _.reduce(nodeScores, (acc, v) => acc + v, 0),
      chapterNum: chapter + 1,
      difficulty: difficulty,

      hoverId: '',
      activeTab: 'player',
      showPlayerArchetypePicker: false,
      showEngineArchetypePicker: false,
    };
  }

  componentDidMount() {
    const archetypeIds = Object.keys(ARCHETYPES) as ArchetypeId[];
    if (archetypeIds.length) {
      const rnd = (arr: ArchetypeId[]) =>
        arr[Math.floor(Math.random() * arr.length)];
      this.setArchetypeForRole('engine', rnd(archetypeIds));
      this.setArchetypeForRole('player', rnd(archetypeIds));
    }
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
      object[item.id] = (object[item.id] || 0) + 1;
    });
    return object;
  };

  setDifficulty = (
    label: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert'
  ) => {
    const mapping: Record<
      typeof label,
      { thinkingTime: number; engineDepth: number }
    > = {
      Novice: { thinkingTime: 2, engineDepth: 1 },
      Intermediate: { thinkingTime: 4, engineDepth: 3 },
      Advanced: { thinkingTime: 6, engineDepth: 5 },
      Expert: { thinkingTime: 8, engineDepth: 7 },
    } as any;

    const { thinkingTime, engineDepth } = mapping[label];
    this.props.updateConfig?.('thinkingTime', thinkingTime);
    this.props.updateConfig?.('engineDepth', engineDepth);

    this.setState((prev) => ({
      difficulty: label.toLowerCase(),
      config: { ...prev.config, thinkingTime, engineDepth },
    }));
  };

  randomizeAll = () => {
    const archetypeIds = Object.keys(ARCHETYPES) as ArchetypeId[];
    if (!archetypeIds.length) return;

    const rnd = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const nextPlayerColor: 'white' | 'black' =
      Math.random() < 0.5 ? 'white' : 'black';
    const nextEngineColor: 'white' | 'black' =
      nextPlayerColor === 'white' ? 'black' : 'white';

    const playerArchetype = rnd(archetypeIds);
    const engineArchetype = rnd(archetypeIds);

    // set colors first, then set archetypes so setArchetypeForRole reads correct color
    this.setState(
      {
        playerColor: nextPlayerColor,
        engineColor: nextEngineColor,
        hoverId: '',
        // reset so UI reflects new picks after we set them below
        playerArchetypeId: null,
        engineArchetypeId: null,
      },
      () => {
        this.setArchetypeForRole('player', playerArchetype);
        this.setArchetypeForRole('engine', engineArchetype);
      }
    );
  };

  descriptions = (): Record<string, string> => {
    const base = {
      engineDiff: 'Engine difficulty & knobs.',
      engineArch: 'Choose an Engine archetype.',
      randomize: 'Randomize colors & archetypes for both sides.',
      swapSides: `Swap sides: you are ${this.state.playerColor}.`,
      '': 'Choose an archetype or adjust engine settings.',
    };

    // archetype hover: "archetype:<id>"
    const archetypeDescs: Record<string, string> = {};
    Object.values(ARCHETYPES).forEach((a) => {
      archetypeDescs[`archetype:${a.id}`] = `${a.name}: ${a.description}`;
    });

    // arcana hover: by raw arcana id (e.g., "sumnRQ")
    const arcanaDescs: Record<string, string> = {};
    Object.values(arcana).forEach((a) => {
      if (a && a.id) {
        const name = a.name || a.id;
        const desc = a.description || '';
        arcanaDescs[a.id] = desc ? `${name}: ${desc}` : name;
      }
    });

    return { ...base, ...archetypeDescs, ...arcanaDescs };
  };

  setArchetypeForRole = (role: 'engine' | 'player', id: ArchetypeId) => {
    const archetype = ARCHETYPES[id];
    if (!archetype) return;

    const inv = archetype.arcana
      .map((aid) => arcana[aid])
      .filter(Boolean)
      .slice(0, 6) as ArcanaDetail[];
    const invCounts = this.transformedSpellBook(inv);

    const roleColor =
      role === 'engine' ? this.state.engineColor : this.state.playerColor;

    const next: Partial<ModalState> = {};
    if (roleColor === 'white') {
      next.whiteSetup = archetype.army;
      next.whiteArcana = inv.length ? inv : this.state.whiteArcana;
    } else {
      next.blackSetup = archetype.army.toLowerCase();
      next.blackArcana = inv.length ? inv : this.state.blackArcana;
    }
    if (role === 'engine') next.engineArchetypeId = id;
    else next.playerArchetypeId = id;

    this.setState(next as ModalState, () => {
      if (this.props.updateConfig) {
        if (roleColor === 'white') {
          this.props.updateConfig('whiteSetup', archetype.army);
          this.props.updateConfig('whiteArcana', invCounts);
          this.props.updateConfig('whiteFaction', archetype.faction);
        } else {
          this.props.updateConfig('blackSetup', archetype.army.toLowerCase());
          this.props.updateConfig('blackArcana', invCounts);
          this.props.updateConfig('blackFaction', archetype.faction);
        }
      }
    });
  };

  handleArchetypeClick = (id: ArchetypeId, role: 'player' | 'engine') => {
    this.setArchetypeForRole(role, id);
    if (role === 'player') {
      this.setState({ showPlayerArchetypePicker: false });
    } else {
      this.setState({ showEngineArchetypePicker: false });
    }
  };

  swapSides = () => {
    const prevPlayerColor = this.state.playerColor;
    const prevEngineColor = this.state.engineColor;

    const nextPlayerColor = prevPlayerColor === 'white' ? 'black' : 'white';
    const nextEngineColor = prevEngineColor === 'white' ? 'black' : 'white';

    // Keep armies and arcana with their colors - they don't change during swap
    // Only the player/engine roles change
    const nextWhiteSetup = this.state.whiteSetup.toUpperCase();
    const nextBlackSetup = this.state.blackSetup.toLowerCase();

    const nextWhiteArc = this.state.whiteArcana;
    const nextBlackArc = this.state.blackArcana;

    // Keep archetypes with their colors, not their roles
    const whiteArchetypeId =
      prevPlayerColor === 'white'
        ? this.state.playerArchetypeId
        : this.state.engineArchetypeId;
    const blackArchetypeId =
      prevPlayerColor === 'black'
        ? this.state.playerArchetypeId
        : this.state.engineArchetypeId;

    // After swap, assign archetypes based on who is now playing which color
    const nextPlayerArchetype =
      nextPlayerColor === 'white' ? whiteArchetypeId : blackArchetypeId;
    const nextEngineArchetype =
      nextEngineColor === 'white' ? whiteArchetypeId : blackArchetypeId;

    this.setState(
      {
        playerColor: nextPlayerColor,
        engineColor: nextEngineColor,
        whiteSetup: nextWhiteSetup,
        blackSetup: nextBlackSetup,
        whiteArcana: nextWhiteArc,
        blackArcana: nextBlackArc,
        playerArchetypeId: nextPlayerArchetype,
        engineArchetypeId: nextEngineArchetype,
      },
      () => {
        const wCounts = this.transformedSpellBook(this.state.whiteArcana);
        const bCounts = this.transformedSpellBook(this.state.blackArcana);

        this.props.updateConfig?.('whiteSetup', this.state.whiteSetup);
        this.props.updateConfig?.('blackSetup', this.state.blackSetup);
        this.props.updateConfig?.('whiteArcana', wCounts);
        this.props.updateConfig?.('blackArcana', bCounts);

        const whiteArchetypeId =
          this.state.playerColor === 'white'
            ? this.state.playerArchetypeId
            : this.state.engineArchetypeId;

        const blackArchetypeId =
          this.state.playerColor === 'black'
            ? this.state.playerArchetypeId
            : this.state.engineArchetypeId;

        const whiteFaction = whiteArchetypeId
          ? ARCHETYPES[whiteArchetypeId].faction
          : null;
        const blackFaction = blackArchetypeId
          ? ARCHETYPES[blackArchetypeId].faction
          : null;

        if (whiteFaction)
          this.props.updateConfig?.('whiteFaction', whiteFaction);
        if (blackFaction)
          this.props.updateConfig?.('blackFaction', blackFaction);
      }
    );
  };

  start = () => {
    const wCounts = this.transformedSpellBook(this.state.whiteArcana);
    const bCounts = this.transformedSpellBook(this.state.blackArcana);
    if (this.props.updateConfig) {
      this.props.updateConfig('whiteSetup', this.state.whiteSetup);
      this.props.updateConfig('blackSetup', this.state.blackSetup);
      this.props.updateConfig('whiteArcana', wCounts);
      this.props.updateConfig('blackArcana', bCounts);
      this.props.updateConfig('playerColor', this.state.playerColor);
      this.props.updateConfig('engineColor', this.state.engineColor);
    }
    this.props.handleClose();
  };

  render() {
    const hoverText =
      this.descriptions()[this.state.hoverId] ?? this.descriptions()[''];

    const canStart = Boolean(
      this.state.engineArchetypeId && this.state.playerArchetypeId
    );

    const engineArchetype = this.state.engineArchetypeId
      ? ARCHETYPES[this.state.engineArchetypeId]
      : null;
    const playerArchetype = this.state.playerArchetypeId
      ? ARCHETYPES[this.state.playerArchetypeId]
      : null;

    return (
      <div className="container">
        <Modal
          style={skirmishModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="skirmish-modal">
            <div className="top-section">
              {/* Header */}
              <div className="skirmish-header">
                <div className="header-left">
                  <button
                    className="home-button"
                    onClick={() => this.props.navigate('/')}
                  >
                    <img
                      className="logo"
                      src="/assets/logoall+.png"
                      alt="Home"
                    />
                  </button>
                </div>

                {/* Tab navigation for mobile */}
                <div className="tab-nav">
                  <button
                    className={`tab-button ${
                      this.state.activeTab === 'player' ? 'active' : ''
                    }`}
                    onClick={() => this.setState({ activeTab: 'player' })}
                  >
                    Player
                  </button>
                  <button
                    className={`tab-button ${
                      this.state.activeTab === 'engine' ? 'active' : ''
                    }`}
                    onClick={() => this.setState({ activeTab: 'engine' })}
                  >
                    Engine
                  </button>
                </div>
              </div>

              {/* Hover panel */}
              <div className="hover-panel">
                {this.state.hoverId ? (
                  <>
                    <div className="hover-title">
                      {arcana[this.state.hoverId]?.name || 'Info'}
                    </div>
                    <div className="hover-description">{hoverText}</div>
                  </>
                ) : (
                  <div className="hover-empty">
                    Choose a faction or adjust engine settings.
                  </div>
                )}
              </div>
            </div>

            {/* Content container */}
            <div className="content-container">
              {/* Player Section */}
              <div
                className={`player-section ${
                  this.state.activeTab === 'player' ? 'active' : ''
                }`}
              >
                <div className="section-header">
                  <h3>Your Setup</h3>
                  <div className="color-indicator">
                    {this.state.playerColor === 'white' ? '⚪' : '⚫'}{' '}
                    {this.state.playerColor}
                  </div>
                </div>

                <div
                  className="archetype-badge-clickable"
                  onClick={() =>
                    this.setState((prev) => ({
                      showPlayerArchetypePicker:
                        !prev.showPlayerArchetypePicker,
                      showEngineArchetypePicker: false,
                    }))
                  }
                >
                  {playerArchetype && (
                    <img
                      src={playerArchetype.image}
                      alt={playerArchetype.name}
                      className="archetype-badge-icon"
                    />
                  )}
                  <div className="archetype-name">
                    {playerArchetype?.name || 'Select Archetype'}
                  </div>
                </div>

                <div className="arcana-section">
                  <ArcanaSelect
                    spellBook={
                      this.state.playerColor === 'white'
                        ? this.state.whiteArcana
                        : this.state.blackArcana
                    }
                    color={this.state.playerColor}
                    isOpen={false}
                    readOnly
                    updateHover={(arcaneObject) => {
                      this.setState({ hoverId: arcaneObject.id || '' });
                    }}
                  />
                </div>

                <div className="army-section">
                  <ArmySelect
                    army={
                      this.state.playerColor === 'white'
                        ? this.state.whiteSetup
                        : this.state.blackSetup
                    }
                    faction={playerArchetype?.faction}
                    isOpen={false}
                    color={this.state.playerColor}
                    readOnly
                  />
                </div>

                {/* Player Archetype Picker */}
                {this.state.showPlayerArchetypePicker && (
                  <div className="archetype-picker-modal">
                    <button
                      className="archetype-picker-close"
                      onClick={() =>
                        this.setState({ showPlayerArchetypePicker: false })
                      }
                      aria-label="Close"
                    >
                      ✕
                    </button>
                    <div className="archetype-list">
                      {Object.values(ARCHETYPES).map((archetype) => {
                        const isSelected =
                          this.state.playerArchetypeId === archetype.id;

                        return (
                          <div
                            key={archetype.id}
                            className={`archetype-item ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() =>
                              this.handleArchetypeClick(archetype.id, 'player')
                            }
                            onMouseEnter={() =>
                              this.setState({
                                hoverId: `archetype:${archetype.id}`,
                              })
                            }
                            onMouseLeave={() => this.setState({ hoverId: '' })}
                          >
                            <div className="archetype-image-container">
                              <img
                                src={archetype.image}
                                alt={archetype.name}
                                className="archetype-image"
                              />
                            </div>
                            <div className="archetype-info">
                              <div className="archetype-name-text">
                                {archetype.name}
                              </div>
                              <div className="archetype-description">
                                {archetype.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Engine Section */}
              <div
                className={`engine-section ${
                  this.state.activeTab === 'engine' ? 'active' : ''
                }`}
              >
                <div className="section-header">
                  <h3>Engine Setup</h3>
                  <div className="color-indicator">
                    {this.state.engineColor === 'white' ? '⚪' : '⚫'}{' '}
                    {this.state.engineColor}
                  </div>
                </div>

                <div
                  className="archetype-badge-clickable"
                  onClick={() =>
                    this.setState((prev) => ({
                      showEngineArchetypePicker:
                        !prev.showEngineArchetypePicker,
                      showPlayerArchetypePicker: false,
                    }))
                  }
                >
                  {engineArchetype && (
                    <img
                      src={engineArchetype.image}
                      alt={engineArchetype.name}
                      className="archetype-badge-icon"
                    />
                  )}
                  <div className="archetype-name">
                    {engineArchetype?.name || 'Select Archetype'}
                  </div>
                </div>

                <div className="arcana-section">
                  <ArcanaSelect
                    spellBook={
                      this.state.engineColor === 'white'
                        ? this.state.whiteArcana
                        : this.state.blackArcana
                    }
                    color={this.state.engineColor}
                    isOpen={false}
                    readOnly
                    updateHover={(arcaneObject) => {
                      this.setState({ hoverId: arcaneObject.id || '' });
                    }}
                  />
                </div>

                <div className="army-section">
                  <ArmySelect
                    army={
                      this.state.engineColor === 'white'
                        ? this.state.whiteSetup
                        : this.state.blackSetup
                    }
                    faction={engineArchetype?.faction}
                    isOpen={false}
                    color={this.state.engineColor}
                    readOnly
                  />
                </div>

                {/* Engine Archetype Picker */}
                {this.state.showEngineArchetypePicker && (
                  <div className="archetype-picker-modal">
                    <button
                      className="archetype-picker-close"
                      onClick={() =>
                        this.setState({ showEngineArchetypePicker: false })
                      }
                      aria-label="Close"
                    >
                      ✕
                    </button>
                    <div className="archetype-list">
                      {Object.values(ARCHETYPES).map((archetype) => {
                        const isSelected =
                          this.state.engineArchetypeId === archetype.id;

                        return (
                          <div
                            key={archetype.id}
                            className={`archetype-item ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() =>
                              this.handleArchetypeClick(archetype.id, 'engine')
                            }
                            onMouseEnter={() =>
                              this.setState({
                                hoverId: `archetype:${archetype.id}`,
                              })
                            }
                            onMouseLeave={() => this.setState({ hoverId: '' })}
                          >
                            <div className="archetype-image-container">
                              <img
                                src={archetype.image}
                                alt={archetype.name}
                                className="archetype-image"
                              />
                            </div>
                            <div className="archetype-info">
                              <div className="archetype-name-text">
                                {archetype.name}
                              </div>
                              <div className="archetype-description">
                                {archetype.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Section - Third column on large screens */}
              <div className="settings-section">
                <div className="section-header">
                  <h3>Settings</h3>
                </div>

                <div className="settings-content">
                  <div
                    onMouseEnter={() =>
                      this.setState({ hoverId: 'engineDiff' })
                    }
                    onMouseLeave={() => this.setState({ hoverId: '' })}
                  >
                    <Select
                      title="Difficulty"
                      defaultOption={
                        this.state.difficulty.charAt(0).toUpperCase() +
                        this.state.difficulty.slice(1)
                      }
                      type="string"
                      width={240}
                      height={40}
                      options={['Novice', 'Intermediate', 'Advanced', 'Expert']}
                      onChange={(val: string) => {
                        if (
                          val === 'Novice' ||
                          val === 'Intermediate' ||
                          val === 'Advanced' ||
                          val === 'Expert'
                        ) {
                          this.setDifficulty(val);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Action buttons in settings section on large screens */}
                <div className="action-buttons-large">
                  <button
                    type="button"
                    className="action-btn swap-btn"
                    onClick={this.swapSides}
                    onMouseEnter={() => this.setState({ hoverId: 'swapSides' })}
                    onMouseLeave={() => this.setState({ hoverId: '' })}
                  >
                    <span>⇄</span> SWAP SIDES
                  </button>
                  <button
                    type="button"
                    className="action-btn randomize-btn"
                    onClick={this.randomizeAll}
                    onMouseEnter={() => this.setState({ hoverId: 'randomize' })}
                    onMouseLeave={() => this.setState({ hoverId: '' })}
                  >
                    <img src="/assets/icons/randomize.svg" alt="" /> RANDOMIZE
                  </button>
                  <button
                    type="button"
                    className="action-btn start-btn"
                    onClick={this.start}
                    disabled={!canStart}
                    aria-disabled={!canStart}
                    title={canStart ? 'Start Game' : 'Select factions to start'}
                  >
                    START
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons for mobile */}
            <div className="action-buttons">
              <button
                type="button"
                className="action-btn swap-btn"
                onClick={this.swapSides}
                onMouseEnter={() => this.setState({ hoverId: 'swapSides' })}
                onMouseLeave={() => this.setState({ hoverId: '' })}
              >
                <span>⇄</span> SWAP SIDES
              </button>
              <button
                type="button"
                className="action-btn randomize-btn"
                onClick={this.randomizeAll}
                onMouseEnter={() => this.setState({ hoverId: 'randomize' })}
                onMouseLeave={() => this.setState({ hoverId: '' })}
              >
                <img src="/assets/icons/randomize.svg" alt="" /> RANDOMIZE
              </button>
              <button
                type="button"
                className="action-btn start-btn"
                onClick={this.start}
                disabled={!canStart}
                aria-disabled={!canStart}
                title={canStart ? 'Start Game' : 'Select factions to start'}
              >
                START
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

function mapStateToProps({ auth }: { auth: any }) {
  return { auth };
}

const SkirmishModal = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedSkirmishModal));
export default SkirmishModal;

const skirmishModal = {
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
