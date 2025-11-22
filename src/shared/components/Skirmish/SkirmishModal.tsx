import React from 'react';
import Modal from 'react-modal';
import _ from 'lodash';

import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

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

import { startingInventory } from 'src/features/game/components/CharacterSelect/charactersModes';


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

  engineFactionId: FactionId | null;
  playerFactionId: FactionId | null;

  reducedScore: number;
  chapterNum: number;
  difficulty: string;

  hoverId: string;
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

type FactionId = 'chi' | 'gamma' | 'omega' | 'lambda' | 'sigma' | 'psi' | 'tau';

type Faction = {
  id: FactionId;
  name: string;
  army: string;
  arcana: string[];
  unlocked: boolean;
  image?: string;
  description: string;
  color: string;
};

export const MENU_COLORS = {
  S_MENU: '#808080',
  R_MENU: '#c53939',
  O_MENU: '#c77c35',
  Y_MENU: '#d9b800',
  G_MENU: '#34aa48',
  B_MENU: '#3f48cc',
  V_MENU: '#a043a2',
};

export const FACTIONS: Record<FactionId, Faction> = {
  chi: {
    id: 'chi',
    name: 'chi',
    army: 'RNBQKBNR',
    arcana: ['dyadB', 'modsGLU', 'offrM', 'sumnX'],
    unlocked: true,
    description: 'Law-breaking Pawns, unpredictable Valkyrie impersonation.',
    color: MENU_COLORS.R_MENU,
  },
  gamma: {
    id: 'gamma',
    name: 'gamma',
    army: 'RNBTKBNR',
    arcana: ['shftP', 'modsDIM', 'offrM'],
    unlocked: true,
    description:
      'Dangerous, flexible Pawns, unpredictable Valkyrie impersonation',
    color: MENU_COLORS.O_MENU,
  },
  omega: {
    id: 'omega',
    name: 'omega',
    army: 'RNBMKBNR',
    arcana: ['sumnRQ', 'modsEXT', 'offrN'],
    unlocked: true,
    description:
      'Queen impersonation, flexible and dangerous double-moves at a price',
    color: MENU_COLORS.Y_MENU,
  },
  lambda: {
    id: 'lambda',
    name: 'lambda',
    army: '1SWTKWS1',
    arcana: ['sumnRE', 'modsSIL', 'offrN'],
    unlocked: true,
    description:
      'Trap and capture pieces in a web, flexible and dangerous double-moves at a price',
    color: MENU_COLORS.G_MENU,
  },
  sigma: {
    id: 'sigma',
    name: 'sigma',
    army: '1SWMKWS1',
    arcana: ['modsREA', 'offrR'],
    unlocked: true,
    description: 'Heavy-hitting Wraiths, trap pieces in multiple webs.',
    color: MENU_COLORS.B_MENU,
  },
  psi: {
    id: 'psi',
    name: 'psi',
    army: '1SWQKWS1',
    arcana: ['modsBAN', 'offrR'],
    unlocked: true,
    description: 'Buff Spectres, trap pieces in multiple webs.',
    color: MENU_COLORS.V_MENU,
  },
  tau: {
    id: 'tau',
    name: 'tau',
    army: '2VVKV2',
    arcana: ['modsREA', 'shftG', 'dyadA', 'offrZ'],
    unlocked: true,
    description: 'Small army with many spells.',
    color: MENU_COLORS.S_MENU,
  },
};

const HEX_ROWS: FactionId[][] = [
  ['omega', 'sigma'],
  ['chi', 'tau', 'lambda'],
  ['psi', 'gamma'],
];

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

export const GREEK_CAP: Record<FactionId, string> = {
  chi: 'Χ',
  gamma: 'Γ',
  omega: 'Ω',
  lambda: 'Λ',
  sigma: 'Σ',
  psi: 'Ψ',
  tau: 'Τ',
};

class UnwrappedSkirmishModal extends React.Component<ModalProps, ModalState> {
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

      whiteArcana: [...startingInventory],
      blackArcana: [...startingInventory],
      whiteSetup: 'RNBQKBNR',
      blackSetup: 'rnbqkbnr',

      playerColor: 'white',
      engineColor: 'black',

      engineFactionId: null,
      playerFactionId: null,

      reducedScore: _.reduce(LS.nodeScores, (acc, v) => acc + v, 0),
      chapterNum: LS.chapter + 1,
      difficulty: LS.difficulty,

      hoverId: '',
    };
  }

  componentDidMount() {
    const unlocked = Object.values(FACTIONS)
      .filter((f) => f.unlocked)
      .map((f) => f.id);
    if (unlocked.length) {
      const rnd = (arr: FactionId[]) =>
        arr[Math.floor(Math.random() * arr.length)];
      this.setFactionForRole('engine', rnd(unlocked));
      this.setFactionForRole('player', rnd(unlocked));
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

  transformedInventory = (inventory: ArcanaDetail[]) => {
    const object: { [key: string]: number } = {};
    _.forEach(inventory, (item) => {
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
    const unlocked = Object.values(FACTIONS)
      .filter((f) => f.unlocked)
      .map((f) => f.id) as FactionId[];
    if (!unlocked.length) return;

    const rnd = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const nextPlayerColor: 'white' | 'black' =
      Math.random() < 0.5 ? 'white' : 'black';
    const nextEngineColor: 'white' | 'black' =
      nextPlayerColor === 'white' ? 'black' : 'white';

    const playerFaction = rnd(unlocked);
    const engineFaction = rnd(unlocked);

    // set colors first, then set factions so setFactionForRole reads correct color
    this.setState(
      {
        playerColor: nextPlayerColor,
        engineColor: nextEngineColor,
        hoverId: '',
        // reset so UI reflects new picks after we set them below
        playerFactionId: null,
        engineFactionId: null,
      },
      () => {
        this.setFactionForRole('player', playerFaction);
        this.setFactionForRole('engine', engineFaction);
      }
    );
  };

  descriptions = (): Record<string, string> => {
    const base = {
      engineDiff: 'Engine difficulty & knobs.',
      engineFact: 'Choose an Engine faction.',
      randomize: 'Randomize colors & factions for both sides.',
      swapSides: `Swap sides: you are ${this.state.playerColor}.`,
      '': 'Choose a faction or adjust engine settings.',
    };

    // faction hover: "faction:<id>"
    const factionDescs: Record<string, string> = {};
    Object.values(FACTIONS).forEach((f) => {
      factionDescs[`faction:${f.id}`] = `${f.name}: ${f.description}`;
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

    return { ...base, ...factionDescs, ...arcanaDescs };
  };

  setFactionForRole = (role: 'engine' | 'player', id: FactionId) => {
    const f = FACTIONS[id];
    if (!f || !f.unlocked) return;

    const inv = f.arcana
      .map((aid) => arcana[aid])
      .filter(Boolean)
      .slice(0, 6) as ArcanaDetail[];
    const invCounts = this.transformedInventory(inv);

    const roleColor =
      role === 'engine' ? this.state.engineColor : this.state.playerColor;

    const next: Partial<ModalState> = {};
    if (roleColor === 'white') {
      next.whiteSetup = f.army;
      next.whiteArcana = inv.length ? inv : this.state.whiteArcana;
    } else {
      next.blackSetup = f.army.toLowerCase();
      next.blackArcana = inv.length ? inv : this.state.blackArcana;
    }
    if (role === 'engine') next.engineFactionId = id;
    else next.playerFactionId = id;

    this.setState(next as ModalState, () => {
      if (this.props.updateConfig) {
        if (roleColor === 'white') {
          this.props.updateConfig('whiteSetup', f.army);
          this.props.updateConfig('whiteArcana', invCounts);
          this.props.updateConfig('whiteFaction', id);
        } else {
          this.props.updateConfig('blackSetup', f.army.toLowerCase());
          this.props.updateConfig('blackArcana', invCounts);
          this.props.updateConfig('blackFaction', id);
        }
      }
    });
  };

  handleHexHover = (id: FactionId | null) => {
    this.setState({ hoverId: id ? `faction:${id}` : '' });
  };
  handleHexClick = (id: FactionId) => {
    this.setFactionForRole('player', id);
  };

  swapSides = () => {
    const prevPlayerColor = this.state.playerColor;
    const prevEngineColor = this.state.engineColor;

    const nextPlayerColor = prevPlayerColor === 'white' ? 'black' : 'white';
    const nextEngineColor = prevEngineColor === 'white' ? 'black' : 'white';

    const playerArmy =
      prevPlayerColor === 'white'
        ? this.state.whiteSetup
        : this.state.blackSetup;
    const playerInv =
      prevPlayerColor === 'white'
        ? this.state.whiteArcana
        : this.state.blackArcana;

    const engineArmy =
      prevEngineColor === 'white'
        ? this.state.whiteSetup
        : this.state.blackSetup;
    const engineInv =
      prevEngineColor === 'white'
        ? this.state.whiteArcana
        : this.state.blackArcana;

    // enforce casing by color
    const nextWhiteSetup = (
      nextPlayerColor === 'white' ? playerArmy : engineArmy
    ).toUpperCase();
    const nextBlackSetup = (
      nextPlayerColor === 'black' ? playerArmy : engineArmy
    ).toLowerCase();

    const nextWhiteArc = nextPlayerColor === 'white' ? playerInv : engineInv;
    const nextBlackArc = nextPlayerColor === 'black' ? playerInv : engineInv;

    this.setState(
      {
        playerColor: nextPlayerColor,
        engineColor: nextEngineColor,
        whiteSetup: nextWhiteSetup,
        blackSetup: nextBlackSetup,
        whiteArcana: nextWhiteArc,
        blackArcana: nextBlackArc,
      },
      () => {
        const wCounts = this.transformedInventory(this.state.whiteArcana);
        const bCounts = this.transformedInventory(this.state.blackArcana);

        this.props.updateConfig?.('whiteSetup', this.state.whiteSetup);
        this.props.updateConfig?.('blackSetup', this.state.blackSetup);
        this.props.updateConfig?.('whiteArcana', wCounts);
        this.props.updateConfig?.('blackArcana', bCounts);

        const whiteFaction =
          this.state.playerColor === 'white'
            ? this.state.playerFactionId
            : this.state.engineFactionId;

        const blackFaction =
          this.state.playerColor === 'black'
            ? this.state.playerFactionId
            : this.state.engineFactionId;

        if (whiteFaction)
          this.props.updateConfig?.('whiteFaction', whiteFaction);
        if (blackFaction)
          this.props.updateConfig?.('blackFaction', blackFaction);
      }
    );
  };

  start = () => {
    const wCounts = this.transformedInventory(this.state.whiteArcana);
    const bCounts = this.transformedInventory(this.state.blackArcana);
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
    const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

    const hoverText =
      this.descriptions()[this.state.hoverId] ?? this.descriptions()[''];

    const canStart = Boolean(
      this.state.engineFactionId && this.state.playerFactionId
    );

    const engineFactionOptions = Object.values(FACTIONS)
      .filter((f) => f.unlocked)
      .map((f) => cap(f.name));
    const factionIdByName = (name: string): FactionId =>
      name.toLowerCase() as FactionId;

    const engineFactionLabel = this.state.engineFactionId
      ? cap(FACTIONS[this.state.engineFactionId].name)
      : 'Select Engine Faction';

    const engineImg =
      this.state.engineFactionId && FACTIONS[this.state.engineFactionId].image;
    const playerImg =
      this.state.playerFactionId && FACTIONS[this.state.playerFactionId].image;

    const engineGreek = this.state.engineFactionId
      ? GREEK_CAP[this.state.engineFactionId]
      : '';
    const playerGreek = this.state.playerFactionId
      ? GREEK_CAP[this.state.playerFactionId]
      : '';

    const engineAccent = this.state.engineFactionId
      ? FACTIONS[this.state.engineFactionId].color
      : undefined;
    const playerAccent = this.state.playerFactionId
      ? FACTIONS[this.state.playerFactionId].color
      : undefined;

    const engineFactionName = this.state.engineFactionId
      ? cap(FACTIONS[this.state.engineFactionId].name)
      : 'Engine Faction';
    const playerFactionName = this.state.playerFactionId
      ? cap(FACTIONS[this.state.playerFactionId].name)
      : 'Player Faction';

    return (
      <div className="container">
        <Modal
          style={skirmishModal}
          isOpen={this.props.isOpen}
          ariaHideApp={false}
        >
          <div className="skirmish-modal">
            <div className="skirmish-header">
              <Link className="home-button" to="/">
                <img className="logo" src="/assets/logoall+.png" alt="" />
              </Link>
              <div className="description" aria-live="polite">
                {hoverText}
              </div>
            </div>
            <div className="buttons" role="group" aria-label="Controls">
              <div className="engine-settings">
                <div
                  onMouseEnter={() => this.setState({ hoverId: 'engineDiff' })}
                  onMouseLeave={() => this.setState({ hoverId: '' })}
                >
                  <Select
                    title="Difficulty"
                    type="number"
                    width={240}
                    height={40}
                    defaultOption={'Novice'}
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
                <div
                  onMouseEnter={() => this.setState({ hoverId: 'engineFact' })}
                  onMouseLeave={() => this.setState({ hoverId: '' })}
                >
                  <Select
                    title="Engine Faction"
                    type="text"
                    width={240}
                    height={40}
                    defaultOption={engineFactionLabel}
                    options={engineFactionOptions}
                    onChange={(val: string) =>
                      this.setFactionForRole('engine', factionIdByName(val))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="randomize-btn"
                  onClick={this.randomizeAll}
                  onMouseEnter={() => this.setState({ hoverId: 'randomize' })}
                  onMouseLeave={() => this.setState({ hoverId: '' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      this.randomizeAll();
                    }
                  }}
                  aria-label="Randomize colors and factions"
                >
                  <img src="/assets/icons/randomize.svg" alt="Randomize" />
                </button>
              </div>
              <div
                className="swap-sides"
                onClick={this.swapSides}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.swapSides();
                  }
                }}
                onMouseEnter={() => this.setState({ hoverId: 'swapSides' })}
                onMouseLeave={() => this.setState({ hoverId: '' })}
              >
                SWAP SIDES
              </div>
            </div>
            <div className="hex-setups">
              <div
                className="hex"
                role="list"
                aria-label="Choose Player Faction"
              >
                {HEX_ROWS.map((row, rowIdx) => (
                  <div className="hex-row" key={`row-${rowIdx}`}>
                    {row.map((id) => {
                      const f = FACTIONS[id];
                      const isLocked = !f.unlocked;
                      const selectedAsPlayer =
                        this.state.playerFactionId === id;

                      return (
                        <div
                          key={id}
                          role="listitem"
                          className={[
                            'hex-cell',
                            selectedAsPlayer ? 'is-selected' : '',
                            isLocked ? 'is-locked' : 'is-unlocked',
                          ].join(' ')}
                          onMouseEnter={() => this.handleHexHover(id)}
                          onMouseLeave={() => this.handleHexHover(null)}
                          onClick={() => !isLocked && this.handleHexClick(id)}
                          aria-label={`${f.name}${isLocked ? ' (locked)' : ''}`}
                          tabIndex={isLocked ? -1 : 0}
                          onKeyDown={(e) => {
                            if (
                              !isLocked &&
                              (e.key === 'Enter' || e.key === ' ')
                            ) {
                              e.preventDefault();
                              this.handleHexClick(id);
                            }
                          }}
                        >
                          <div
                            className="tile"
                            style={{ ['--accent' as any]: f.color }}
                          >
                            <div className="img-wrap">
                              <span className="faction-glyph large">
                                {GREEK_CAP[id]}
                              </span>
                            </div>
                            <span
                              className="color-dot"
                              style={{ background: f.color }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="setups">
                {/* ENGINE */}
                <div className="engine-setup">
                  <div
                    className="setup-row"
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      gap: 6,
                      ['--arcana-w' as any]: '360px',
                    }}
                  >
                    <div className="faction-img flex-fill" aria-live="polite">
                      {/* background image/glyph block */}
                      {engineImg ? (
                        <>
                          <span className="faction-glyph">{engineGreek}</span>
                        </>
                      ) : (
                        <div className="img-placeholder-block" />
                      )}

                      {/* NEW: visible faction badge */}
                      <span
                        className="faction-badge"
                        style={
                          engineAccent
                            ? { borderColor: engineAccent, color: engineAccent }
                            : {}
                        }
                        aria-label={
                          this.state.engineFactionId
                            ? `Engine faction: ${engineFactionName}`
                            : 'Engine faction not selected'
                        }
                        title={
                          this.state.engineFactionId
                            ? `${engineFactionName}`
                            : 'Select Engine Faction'
                        }
                      >
                        <span className="badge-glyph">
                          {engineGreek || '–'}
                        </span>
                      </span>
                    </div>

                    <div
                      className="arcana"
                      style={{ flex: '0 1 var(--arcana-w)' }}
                    >
                      <ArcanaSelect
                        inventory={
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
                  </div>

                  <div className="army" style={{ marginTop: 6 }}>
                    <ArmySelect
                      army={
                        this.state.engineColor === 'white'
                          ? this.state.whiteSetup
                          : this.state.blackSetup
                      }
                      faction={this.state.engineFactionId ?? undefined}
                      isOpen={false}
                      color={this.state.engineColor}
                      readOnly
                    />
                  </div>
                </div>

                {/* PLAYER */}
                <div className="human-setup">
                  <div
                    className="setup-row"
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      gap: 6,
                      ['--arcana-w' as any]: '360px',
                    }}
                  >
                    <div className="faction-img flex-fill" aria-live="polite">
                      {playerImg ? (
                        <>
                          <span className="faction-glyph">{playerGreek}</span>
                        </>
                      ) : (
                        <div className="img-placeholder-block" />
                      )}

                      {/* NEW: visible faction badge */}
                      <span
                        className="faction-badge"
                        style={
                          playerAccent
                            ? { borderColor: playerAccent, color: playerAccent }
                            : {}
                        }
                        aria-label={
                          this.state.playerFactionId
                            ? `Player faction: ${playerFactionName}`
                            : 'Player faction not selected'
                        }
                        title={
                          this.state.playerFactionId
                            ? `${playerFactionName}`
                            : 'Select Player Faction'
                        }
                      >
                        <span className="badge-glyph">
                          {playerGreek || '–'}
                        </span>
                      </span>
                    </div>
                    <div
                      className="arcana"
                      style={{ flex: '0 1 var(--arcana-w)' }}
                    >
                      <ArcanaSelect
                        inventory={
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
                  </div>

                  <div className="army" style={{ marginTop: 6 }}>
                    <ArmySelect
                      army={
                        this.state.playerColor === 'white'
                          ? this.state.whiteSetup
                          : this.state.blackSetup
                      }
                      faction={this.state.playerFactionId ?? undefined}
                      isOpen={false}
                      color={this.state.playerColor}
                      readOnly
                    />
                  </div>
                </div>

                {/* START button unchanged */}
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="nav-item start-button"
                    onClick={this.start}
                    disabled={!canStart}
                    aria-disabled={!canStart}
                  >
                    START
                  </button>
                </div>
              </div>
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
    height: '100%',
    width: '100%',
    background: '#111111',
    border: 'none',
    overflowY: 'scroll' as const,
    overflowX: 'hidden' as const,
    msOverflowStyle: 'none' as const,
    scrollbarWidth: 'none' as const,
  },
  overlay: { zIndex: 10, backgroundColor: '#111111CC' },
};
