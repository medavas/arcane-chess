import React, { createRef } from 'react';
import _ from 'lodash';
import axios from 'axios';

import 'src/styles/main.scss';
import './InGameMenu.scss';
import 'src/pages/inGameMenu/Create.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/lambda.scss';

import arcanaJson from 'src/shared/data/arcana.json';
const arcana = arcanaJson as ArcanaMap;

import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';
import { PerftTest } from 'src/features/game/engine/perft.mjs';

import {
  GameBoard,
  ParseFen,
  PrintBoard,
  PrintPieceLists,
  FROMSQ,
  TOSQ,
} from 'src/features/game/engine/board.mjs';
import { AddPiece, ClearPiece } from 'src/features/game/engine/makemove.mjs';
import { PrMove, PrSq } from 'src/features/game/engine/io.mjs';
import { generatePlayableOptions } from 'src/features/game/engine/movegen.mjs';
import {
  prettyToSquare,
  BOOL,
  PIECES,
  PceChar,
  RtyChar,
  ARCANE_BIT_VALUES,
  COLOURS,
} from 'src/features/game/engine/defs.mjs';
import {
  outputFenOfCurrentPosition,
  InCheck,
} from 'src/features/game/engine/board.mjs';
import { SearchController } from 'src/features/game/engine/search.mjs';
import { editMovePiece } from 'src/features/game/engine/gui.mjs';

// import engine
// import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';

// import arcaneChess correctly
// import arcaneChess from "@shared/arcaneChess/arcaneChess";

import Input from '../../components/Input/Input';
import Button from 'src/shared/components/Button/Button';
import Select from '../../components/Select/Select';

import { Chessground, IChessgroundApi } from 'src/features/game/board/chessgroundMod';

import book1 from 'src/shared/data/books/book1.json';
import book2 from 'src/shared/data/books/book2.json';
import book3 from 'src/shared/data/books/book3.json';
import book4 from 'src/shared/data/books/book4.json';
import book5 from 'src/shared/data/books/book5.json';
import book6 from 'src/shared/data/books/book6.json';
import book7 from 'src/shared/data/books/book7.json';
import book8 from 'src/shared/data/books/book8.json';
import book9 from 'src/shared/data/books/book9.json';
import book10 from 'src/shared/data/books/book10.json';
import book11 from 'src/shared/data/books/book11.json';
import book12 from 'src/shared/data/books/book12.json';

export const whitePiecePickupArray = [
  'wW',
  'wV',
  'wS',
  'wM',
  'wQ',
  'wT',
  'wZ',
  'wN',
  'wU',
  'wP',
  'wK',
  'wH',
  'wB',
  'wR',
];
export const blackPiecePickupArray = [
  'bW',
  'bV',
  'bS',
  'bM',
  'bQ',
  'bT',
  'bZ',
  'bN',
  'bU',
  'bP',
  'bK',
  'bH',
  'bB',
  'bR',
];
export const extraPickupArray = {
  Q: 'yellow',
  E: 'orange',
  M: 'green',
  V: 'purple',
  T: 'blue',
};
export const factionColorMap: { [key: string]: string } = {
  R: '#c53939',
  O: '#c77c35',
  Y: '#d6be44',
  G: '#34aa48',
  B: '#3f48cc',
  V: '#a043a2',
  W: '#888888',
  BK: '#222222',
};

const pieces: Tokens = PIECES;
const royalties: Tokens = ARCANE_BIT_VALUES;

interface Tokens {
  [key: string]: number;
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
interface PanelInfo {
  fen: string;
  fenHistory: string[];
  history: string[];
  panelText: string;
  preset: any;
  viewOnly: boolean;
  orientation: string;
  whiteArcane: any;
  blackArcane: any;
  correctMoves: string[];
  config: object;
  royalties: object;
}

interface PuzzleData {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  RatingDeviation: number;
  Popularity: number;
  NbPlays: number;
  Themes: string;
  GameUrl: string;
  OpeningTags: string;
}

interface Node {
  id: string; // 'lesson-1';
  title: string;
  time: number[][]; // seconds
  nodeText: string;
  reward: (number | string)[];
  diagWinLose: {
    win1: string;
    win2: string;
    win3: string;
    victory: string;
    lose1: string;
    lose2: string;
    lose3: string;
    defeat: string;
  };
  prereq: string;
  theme: string;
  opponent: string;
  panels: {
    [key: string]: {
      fen: string;
      fenHistory: string[];
      history: string[];
      panelText: string;
      arrowsCircles?: {
        orig: string;
        brush: string;
        dest?: string | undefined;
      }[];
      // todo initRoyalties in arcaneChess return object
      royalties: {
        [key: string]: { [key: string]: number };
      };
      preset: string;
      whiteArcane?: { [key: string]: number | string };
      blackArcane?: { [key: string]: number | string };
      // orientation: string;
      config: {
        [key: string]: boolean | string | number;
      };
      correctMoves: string[];
      // dialogue: [
      //   // [ 'narrator', 'message']
      //   // [ 'medavas', 'message']
      //   // no text from creator, just put in a blank message that doesn't add anything to the ui
      //   [string | null, string | null],
      // ];
    };
  };
}

interface State {
  title: string;
  time: number[][];
  thinking: boolean;
  thinkingTime: number;
  history: string[];
  fenHistory: string[];
  pvLine?: string[];
  fen: string;
  lastMove: string[];
  whiteFaction: string;
  blackFaction: string;
  selectedFaction: string;
  selectedSide: string;
  hoverArcane: string;
  orientation: string;
  config: {
    [key: string | number]: {
      disabled: boolean;
      arcana: {
        [key: string | number]: string | number | readonly string[] | undefined;
      };
      picks: number;
      setting: string;
    };
  };
  description: string;
  nodeText: string;
  panelText: string;
  playing: boolean;
  currBook: string;
  bookObject: { [key: string]: Node };
  nodeObject: Node['panels'];
  panelObject: {
    fen: string;
    fenHistory: string[];
    history: string[];
    panelText: string;
    // is arrows this a map?
    arrowsCircles?: {
      orig: string;
      brush: string;
      dest?: string | undefined;
    }[];
    // todo initRoyalties in arcaneChess return object
    royalties: {
      [key: string]: { [key: string]: number };
    };
    preset: string;
    whiteArcane?: { [key: string]: number | string };
    blackArcane?: { [key: string]: number | string };
    // orientation: string;
    config: {
      [key: string]: boolean | string | number;
    };
    correctMoves: string[];
    // dialogue: [
    //   // [ 'narrator', 'message']
    //   // [ 'medavas', 'message']
    //   // no text from creator, just put in a blank message that doesn't add anything to the ui
    //   [string | null, string | null],
    // ];
  };
  selectedBook: number;
  newNodeName: string;
  newBoardName: string;
  currNode: string;
  currPanel: string;
  correctMoves: string[];
  correctMovesString: string;
  arcaneHover: string;
  placingPiece: number;
  placingRoyalty: number;
  royaltyHover: string;
  swapType: string;
  arrowsCircles?: { orig: string; brush: string; dest?: string | undefined }[];
  royalties: {
    [key: string]: { [key: string]: number };
  };
  preset: string;
  reward: (number | string)[];
  prereq: string;
  opponent: string;
  theme: string;
  puzzleEpsilon: string;
  puzzleNum: number;
  puzzleResponse: any[];
}

interface Props {
  // fen: string;
  // ... other props
}

class UnwrappedInGameMenu extends React.Component<object, State> {
  arcaneChess;
  // private puzzleWorker: Worker;
  chessgroundRef = createRef<IChessgroundApi>();
  booksMap: { [key: string]: { [key: string]: Node } } = {
    book1,
    book2,
    book3,
    book4,
    book5,
    book6,
    book7,
    book8,
    book9,
    book10,
    book11,
    book12,
  };
  constructor(props: Props) {
    super(props);
    this.state = {
      // todo, just make this an array of fenHistory, simplify state...
      // todo make dyanamic
      title: this.booksMap['book1']['lesson-1'].title,
      fen: this.booksMap['book1']['lesson-1']['panels']['panel-1'].fen,
      pvLine: [],
      history: this.booksMap['book1']['lesson-1']['panels']['panel-1'].history,
      fenHistory:
        this.booksMap['book1']['lesson-1']['panels']['panel-1'].fenHistory,
      thinking: false,
      lastMove: [],
      thinkingTime: 1500,
      whiteFaction: 'normal',
      blackFaction: 'normal',
      selectedFaction: 'R',
      selectedSide: 'W',
      hoverArcane: '',
      orientation: 'white',
      config: {
        // todo disable if no abilities selected
        R: { disabled: false, arcana: {}, picks: 0, setting: 'zero' },
        O: { disabled: false, arcana: {}, picks: 0, setting: 'zero' },
        Y: { disabled: false, arcana: {}, picks: 0, setting: 'zero' },
        G: { disabled: false, arcana: {}, picks: 0, setting: 'zero' },
        B: { disabled: false, arcana: {}, picks: 0, setting: 'zero' },
        V: { disabled: false, arcana: {}, picks: 0, setting: 'zero' },
        W: {
          disabled: false,
          arcana: {
            ...this.booksMap['book1']['lesson-1'].panels['panel-1'].whiteArcane,
          },
          picks: 0,
          setting: 'zero',
        },
        BK: {
          disabled: false,
          arcana: {
            ...this.booksMap['book1']['lesson-1'].panels['panel-1'].blackArcane,
          },
          picks: 0,
          setting: 'zero',
        },
      },
      // generatedName: this.generateName(),
      description: '',
      playing: false,
      bookObject: book1,
      nodeObject: this.booksMap['book1']['lesson-1'].panels,
      panelObject: {} as State['panelObject'],
      selectedBook: 1,
      newNodeName: '',
      newBoardName: '',
      currBook: 'book1',
      currNode: 'lesson-1',
      currPanel: 'panel-1',
      preset: 'CLEAR',
      correctMoves: [],
      correctMovesString: '',
      arcaneHover: '',
      placingPiece: 0,
      placingRoyalty: 0,
      royaltyHover: '',
      swapType: '',
      arrowsCircles: [],
      royalties: {
        ...this.booksMap['book1']['lesson-1']['panels']['panel-1'].royalties,
      },
      nodeText: this.booksMap['book1']['lesson-1'].nodeText,
      reward: this.booksMap['book1']['lesson-1'].reward,
      prereq: '',
      panelText: this.booksMap['book1']['lesson-1'].panels['panel-1'].panelText,
      time: this.booksMap['book1']['lesson-1'].time,
      opponent: this.booksMap['book1']['lesson-1'].opponent,
      theme: '',
      // rating: 1500,
      // keyword: '',
      puzzleEpsilon: '1500 mate',
      puzzleNum: 0,
      puzzleResponse: [],
    };

    this.arcaneChess = () => arcaneChess();
    this.chessgroundRef = React.createRef();

    // this.puzzleWorker = new Worker(
    //   new URL('src/utils/puzzleWorker.mjs', import.meta.url),
    //   {
    //     type: 'module',
    //   }
    // );
    // this.puzzleWorker.onmessage = this.handleWorkerMessage.bind(this);
  }

  perftTest = () => {
    PrintPieceLists();
    PrintBoard();
    PerftTest(3);
  };

  setFen = (fen: string) => {
    this.setState({ fen, fenHistory: [fen] });
    ParseFen(fen);
  };

  engineGo = () => {
    this.setState({
      thinking: true,
      // fenHistory: GameBoard.fenHistory,
    });

    generatePlayableOptions(true, false, 'COMP', 'COMP');

    SearchController.thinking = BOOL.TRUE;

    new Promise((resolve) => {
      setTimeout(() => {
        const engineResult = this.arcaneChess().engineReply(
          this.state.thinkingTime
        );
        resolve(engineResult);
      }, this.state.thinkingTime);
    })
      .then((reply) => {
        this.setState((prevState) => ({
          pvLine: GameBoard.cleanPV,
          history: [...prevState.history, PrMove(reply)],
          fenHistory: [...prevState.fenHistory, outputFenOfCurrentPosition()],
          thinking: false,
          lastMove: [PrSq(FROMSQ(reply)), PrSq(TOSQ(reply))],
          royalties: {
            royaltyQ: _.mapValues(
              prevState.royalties.royaltyQ,
              (value) => value - 1
            ),
            royaltyT: _.mapValues(
              prevState.royalties.royaltyT,
              (value) => value - 1
            ),
            royaltyM: _.mapValues(
              prevState.royalties.royaltyM,
              (value) => value - 1
            ),
            royaltyV: _.mapValues(
              prevState.royalties.royaltyV,
              (value) => value - 1
            ),
            royaltyE: _.mapValues(
              prevState.royalties.royaltyE,
              (value) => value - 1
            ),
          },
        }));
      })
      .then(() => {
        generatePlayableOptions(true, false, 'COMP', 'COMP');
      })
      .catch((error) => {
        console.error('An error occurred:', error);
      });

    // new Promise((resolve, reject) => {
    //   resolve()
    // });
  };

  calculateFen = () => {
    // this.setState({ fen });
    // todo to animate, set classnames, timeouts, clock conditionals,promise?
    // todo promise or thinking timeout time for returning makemove
    // any edge cases?
    // this.setState({
    //   thinking: true,
    // });
    // this.arcaneChess().getScoreAndLine(
    //   this.state.fenHistory[this.state.fenHistory.length - 1]
    // );

    ParseFen(this.state.fen);

    generatePlayableOptions(true, false, 'COMP', 'COMP');

    this.setState({
      pvLine: [],
      history: [],
      fenHistory: [this.state.fen],
    });
  };

  onChangeUses = (e: React.ChangeEvent<HTMLSelectElement>, arcane: string) => {
    const uses = Number(e.target.value) || e.target.value;
    this.setState((prevState) => ({
      ...prevState,
      config: {
        ...prevState.config,
        [this.state.selectedFaction]: {
          ...prevState.config[this.state.selectedFaction],
          arcana: {
            ...prevState.config[this.state.selectedFaction].arcana,
            [arcane]: uses,
          },
        },
        [this.state.selectedSide]: {
          ...prevState.config[this.state.selectedSide],
          arcana: {
            ...prevState.config[this.state.selectedSide].arcana,
            [arcane]: uses,
          },
        },
      },
    }));
  };

  toggleHover = (arcane: string) => {
    this.setState({ hoverArcane: arcane });
  };

  selectFaction = (color: string) => {
    if (
      color === 'R' ||
      color === 'O' ||
      color === 'Y' ||
      color === 'G' ||
      color === 'B' ||
      color === 'V'
    ) {
      this.setState({ selectedFaction: color });
    }
  };

  selectSide = (color: string) => {
    if (color === 'BK' || color === 'W') {
      this.setState({ selectedSide: color });
    }
  };

  componentDidMount(): void {
    // const arcanaKeys = Object.keys(arcana);
    ParseFen(this.state.fen);
    // this.chessgroundRef.current?.setAutoShapes([{ orig: 'e2', brush: 'blue' }]);
  }

  toggleAndRandomizeArcana(color: string) {
    if (color !== 'W' && color !== 'BK') {
      console.error('Invalid color. Only W and BK are allowed.');
      return;
    }

    this.setState((prevState) => {
      const newConfig = { ...prevState.config };
      const currentSetting = newConfig[color].setting;
      const arcanaKeys = Object.keys(arcana);

      arcanaKeys.forEach((key) => {
        newConfig[color].arcana[key];
        const isBooleanString =
          newConfig[color].arcana[key] === 'true' ||
          newConfig[color].arcana[key] === 'false';

        if (currentSetting === 'zero') {
          if (isBooleanString) {
            newConfig[color].arcana[key] = 'true';
          } else {
            newConfig[color].arcana[key] = 1;
          }
        } else if (currentSetting === 'one') {
          if (isBooleanString) {
            newConfig[color].arcana[key] =
              Math.random() < 0.5 ? 'true' : 'false';
          } else {
            newConfig[color].arcana[key] = Math.floor(Math.random() * 9);
          }
        } else {
          if (isBooleanString) {
            newConfig[color].arcana[key] = 'false';
          } else {
            newConfig[color].arcana[key] = 0;
          }
        }
      });

      newConfig[color].setting =
        currentSetting === 'zero'
          ? 'one'
          : currentSetting === 'one'
          ? 'rand'
          : 'zero';

      return { config: newConfig };
    });
  }

  render() {
    const greekLetters = ['X', 'Ω', 'Θ', 'Σ', 'Λ', 'Φ', 'M', 'N'];
    // const { auth } = this.props;
    return (
      <div className="outer-creator">
        <div className="creator">
          <div className="top-left">
            <div className="arcane-history">
              <div className="arcane-input">
                {this.state.playing ? (
                  <div className="arcana">
                    <div className="arcana-side-buttons">
                      <Button
                        className="tertiary"
                        onClick={() => {
                          this.setState({ selectedSide: 'W' });
                        }}
                        backgroundColorOverride="#333333"
                        color="B"
                        text="WHITE"
                        width={190}
                      />
                      <Button
                        className="tertiary"
                        onClick={() => {
                          this.setState({ selectedSide: 'BK' });
                        }}
                        backgroundColorOverride="#333333"
                        color="B"
                        text="BLACK"
                        width={190}
                        disabled={false}
                      />
                    </div>
                    <div className="arcana-select">
                      {_.map(
                        this.state.config[this.state.selectedSide].arcana,
                        (_value: number, key: string) => {
                          return (
                            <img
                              key={key}
                              className={`arcane ${
                                this.state.hoverArcane === key ? 'focus' : ''
                              }`}
                              src={`/assets/arcanaImages${arcana[key].imagePath}.svg`}
                              onClick={() => {
                                if (
                                  this.state.placingPiece > 0 ||
                                  this.state.swapType !== '' ||
                                  this.state.placingRoyalty !== 0
                                ) {
                                  this.setState({
                                    placingPiece: 0,
                                    swapType: '',
                                    placingRoyalty: 0,
                                  });
                                } else {
                                  if (key.includes('sumn')) {
                                    if (
                                      key.includes('sumnR') &&
                                      key !== 'sumnR'
                                    ) {
                                      this.setState({
                                        placingPiece: 0,
                                        placingRoyalty:
                                          royalties[`${key.split('sumn')[1]}`],
                                        swapType: '',
                                      });
                                    } else {
                                      this.setState({
                                        placingRoyalty: 0,
                                        placingPiece:
                                          pieces[
                                            key
                                              .split('sumn')[1]
                                              .toUpperCase() === 'X'
                                              ? 'X'
                                              : `${
                                                  this.state.selectedSide ===
                                                  'W'
                                                    ? 'w'
                                                    : 'b'
                                                }${key.split('sumn')[1]}`
                                          ],
                                      });
                                    }
                                  }
                                  if (key.includes('swap')) {
                                    if (this.state.swapType === '') {
                                      this.setState(() => ({
                                        swapType: key.split('swap')[1],
                                      }));
                                    } else {
                                      this.setState(() => ({
                                        swapType: '',
                                      }));
                                    }
                                  }
                                  if (key.includes('modsSUS')) {
                                    if (GameBoard.suspend > 0) return;
                                    GameBoard.suspend = 6;
                                  }
                                }
                              }}
                              onMouseEnter={() => this.toggleHover(key)}
                              onMouseLeave={() => this.toggleHover('')}
                            />
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  _.map(arcanaJson, (arcane, arcaneId) => {
                    return (
                      <div
                        className="create-arcane-item"
                        key={arcaneId}
                        onMouseEnter={() => {
                          this.setState({ hoverArcane: arcaneId });
                        }}
                        onMouseLeave={() => this.setState({ hoverArcane: '' })}
                      >
                        <span className="title">{arcane['name']}</span>
                        <div className="select-extension">
                          <div className="uses">
                            <span>
                              {this.state.config[this.state.selectedSide][
                                'arcana'
                              ][arcaneId]
                                ? this.state.config[this.state.selectedSide][
                                    'arcana'
                                  ][arcaneId]
                                : arcane.type === 'active' ||
                                  arcane.type === 'passive'
                                ? 0
                                : 'false'}
                            </span>
                          </div>
                          <select
                            className="arcane-use-drop"
                            value={
                              this.state.config[this.state.selectedSide][
                                'arcana'
                              ][arcaneId]
                                ? this.state.config[this.state.selectedSide][
                                    'arcana'
                                  ][arcaneId]
                                : arcane.type === 'active' ||
                                  arcane.type === 'passive'
                                ? 0
                                : 'false'
                            }
                            onChange={(e) => {
                              console.log(e, arcaneId);
                              this.onChangeUses(e, arcaneId.toString());
                            }}
                          >
                            {arcane.type === 'active' ||
                            arcane.type === 'passive'
                              ? Array.from({ length: 9 }, (_, index) => (
                                  <option key={index} value={index}>
                                    {index}
                                  </option>
                                ))
                              : [0, 1].map((value, i) => (
                                  <option key={i} value={value}>
                                    {value}
                                  </option>
                                ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="history">
                {this.state.playing ? (
                  this.state.history.map((move, i) => <div key={i}>{move}</div>)
                ) : (
                  <div>
                    <Select
                      options={[
                        'red',
                        'orange',
                        'yellow',
                        'green',
                        'blue',
                        'purple',
                        'grey',
                        'black',
                      ]}
                      onChange={(val) => {
                        this.setState({
                          theme: val,
                        });
                      }}
                    />
                    <Select
                      options={[
                        'book1',
                        'book2',
                        'book3',
                        'book4',
                        'book5',
                        'book6',
                        'book7',
                        'book8',
                        'book9',
                        'book10',
                        'book11',
                        'book12',
                      ]}
                      onChange={(val) => {
                        this.setState({
                          currBook: val,
                          bookObject: this.booksMap[val],
                        });
                      }}
                    />
                    {_.map(this.state.bookObject, (node: any, key: string) => {
                      return (
                        <div
                          className="book-node"
                          key={key}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            background:
                              this.state.currNode === key
                                ? 'darkblue'
                                : '#444444',
                          }}
                          onClick={() => {
                            // this.state.nodeObject[key];
                            const nodeA = this.state.bookObject[key];
                            const panelA = nodeA.panels['panel-1'];
                            // this.booksMap[this.state.currBook][node.id];
                            const newRoyalties = JSON.parse(
                              JSON.stringify(panelA.royalties)
                            );
                            const newWhiteArcane = JSON.parse(
                              JSON.stringify(panelA.whiteArcane)
                            );
                            const newBlackArcane = JSON.parse(
                              JSON.stringify(panelA.blackArcane)
                            );
                            this.setState(
                              {
                                currNode: node.id,
                                currPanel: 'panel-1',
                                nodeObject: nodeA.panels,
                                panelObject: {
                                  ...panelA,
                                  royalties: newRoyalties,
                                  whiteArcane: newWhiteArcane,
                                  blackArcane: newBlackArcane,
                                },
                                title: nodeA.title,
                                time: nodeA.time,
                                nodeText: nodeA.nodeText,
                                panelText: nodeA.panels['panel-1'].panelText,
                                reward: nodeA.reward,
                                prereq: nodeA.prereq, // split node name and decrement
                                opponent: nodeA.opponent,
                                theme: nodeA.theme,
                                fen: panelA.fen,
                                fenHistory: [...panelA.fenHistory],
                                history: [...panelA.history],
                              },
                              () => {
                                ParseFen(panelA.fen);
                              }
                            );
                          }}
                        >
                          {node.id}
                        </div>
                      );
                    })}
                    <Input
                      color="B"
                      value={this.state.newNodeName}
                      width={110}
                      onChange={(value) => {
                        this.setState({ newNodeName: value });
                      }}
                      placeholder="mission-x"
                      password={false}
                    />
                    <Button
                      text="+"
                      className="tertiary"
                      color="G"
                      height={31}
                      width={110}
                      onClick={() => {
                        this.setState((prevState) => ({
                          ...prevState,
                          currNode: this.state.newNodeName,
                          bookObject: {
                            ...prevState.bookObject,
                            [this.state.newNodeName]: {
                              id: this.state.newNodeName,
                              title: 'Example Title',
                              time: [
                                [0, 0],
                                [0, 0],
                              ],
                              nodeText: '',
                              panelText: '',
                              reward: [500, 'a', 'b', 'c'],
                              diagWinLose: {
                                win1: '',
                                win2: '',
                                win3: '',
                                victory: '',
                                lose1: '',
                                lose2: '',
                                lose3: '',
                                defeat: '',
                              },
                              prereq: '',
                              opponent: '',
                              theme: 'red',
                              panels: {},
                            },
                          },
                          nodeObject: {},
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="preset-correct-moves">
              {/* <Select
              options={['LESSON', 'STANDARD', 'UYA', 'PUZZLE']}
              onChange={(value) => {
                this.setState({ preset: value });
              }}
              type="string"
            /> */}
              <Select
                options={[
                  'setup',
                  'CLEAR',
                  'CHESS',
                  'HORDE',
                  'THRONE',
                  'DELIVERANCE',
                  'XCHECK',
                  'CRAZYHOUSE',
                  'CAPALL',
                ]}
                onChange={(value) => {
                  if (value === 'CLEAR') {
                    this.setState({
                      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
                      fenHistory: ['8/8/8/8/8/8/8/8 w - - 0 1'],
                    });
                    ParseFen('8/8/8/8/8/8/8/8 w - - 0 1');
                  }
                  if (value === 'CHESS') {
                    this.setState({
                      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                      fenHistory: [
                        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                      ],
                    });
                    ParseFen(
                      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                    );
                  }
                  if (value === 'HORDE') {
                    this.setState({
                      fen: 'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1',
                      fenHistory: [
                        'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1',
                      ],
                      preset: 'HORDE',
                    });
                    ParseFen(
                      'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1'
                    );
                  }
                  if (value === 'THRONE') {
                    this.setState({
                      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                      fenHistory: [
                        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                      ],
                      preset: 'THRONE',
                    });
                    ParseFen(
                      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                    );
                  }
                  if (value === 'DELIVERANCE') {
                    this.setState({
                      fen: '8/8/8/8/8/8/KRBNnbrk/QRBNnbrq w - - 0 1',
                      fenHistory: ['8/8/8/8/8/8/KRBNnbrk/QRBNnbrq w - - 0 1'],
                      preset: 'DELIVERANCE',
                    });
                    ParseFen('8/8/8/8/8/8/KRBNnbrk/QRBNnbrq w - - 0 1');
                  }
                  if (value === 'XCHECK') {
                    this.setState({
                      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
                      fenHistory: ['8/8/8/8/8/8/8/8 w - - 0 1'],
                      preset: 'XCHECK',
                    });
                    ParseFen('8/8/8/8/8/8/8/8 w - - 0 1');
                  }
                  if (value === 'CRAZYHOUSE') {
                    this.setState({
                      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                      fenHistory: [
                        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                      ],
                      preset: 'CRAZYHOUSE',
                    });
                    ParseFen(
                      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                    );
                  }
                  if (value === 'CAPALL') {
                    this.setState({
                      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
                      fenHistory: ['8/8/8/8/8/8/8/8 w - - 0 1'],
                      preset: 'CAPALL',
                    });
                    ParseFen('8/8/8/8/8/8/8/8 w - - 0 1');
                  }
                }}
                type="string"
              />
              <div className="puzzle-input">
                <Input
                  color="B"
                  value={this.state.puzzleEpsilon}
                  width={160}
                  height={60}
                  onChange={(value) => {
                    this.setState({
                      puzzleEpsilon: value,
                    });
                  }}
                  placeholder="rating and keyword"
                  password={false}
                />
                <Button
                  text="<"
                  onClick={() => {
                    if (!this.state.puzzleResponse.length) return;
                    if (this.state.puzzleNum === 0) return;
                    if (this.state.playing) return;
                    this.setState((prevState) => {
                      const newPuzzleNum = prevState.puzzleNum - 1;
                      return {
                        puzzleNum: newPuzzleNum,
                        fen: this.state.puzzleResponse[newPuzzleNum].FEN,
                        fenHistory: [
                          this.state.puzzleResponse[newPuzzleNum].FEN,
                        ],
                        correctMoves:
                          this.state.puzzleResponse[newPuzzleNum].Moves.split(
                            ' '
                          ),
                      };
                    });
                    ParseFen(
                      this.state.puzzleResponse[this.state.puzzleNum].FEN
                    );
                  }}
                  className="tertiary"
                  color="B"
                  height={60}
                  width={20}
                />
                <Button
                  text=">"
                  onClick={() => {
                    if (!this.state.puzzleResponse.length) return;
                    if (
                      this.state.puzzleNum ===
                      this.state.puzzleResponse.length - 1
                    )
                      return;
                    if (this.state.playing) return;
                    this.setState((prevState) => {
                      const newPuzzleNum = prevState.puzzleNum + 1;
                      return {
                        puzzleNum: newPuzzleNum,
                        fen: this.state.puzzleResponse[newPuzzleNum].FEN,
                        fenHistory: [
                          this.state.puzzleResponse[newPuzzleNum].FEN,
                        ],
                        correctMoves:
                          this.state.puzzleResponse[newPuzzleNum].Moves.split(
                            ' '
                          ),
                      };
                    });
                    ParseFen(
                      this.state.puzzleResponse[this.state.puzzleNum].FEN
                    );
                  }}
                  className="tertiary"
                  color="B"
                  height={60}
                  width={20}
                />
              </div>
              <div className="nav">
                <Button
                  text="<<"
                  onClick={() => {
                    // this.setState((prevState) => ({
                    //   ...prevState,
                    //   correctMoves: [],
                    // }));
                  }}
                  className="tertiary"
                  color="B"
                  height={60}
                  width={50}
                />
                <Button
                  text="<"
                  onClick={() => {
                    // this.setState((prevState) => ({
                    //   ...prevState,
                    //   correctMoves: [],
                    // }));
                  }}
                  className="tertiary"
                  color="B"
                  height={60}
                  width={50}
                />
                <Button
                  text=">"
                  onClick={() => {
                    // this.setState((prevState) => ({
                    //   ...prevState,
                    //   correctMoves: [],
                    // }));
                  }}
                  className="tertiary"
                  color="B"
                  height={60}
                  width={50}
                />
                <Button
                  text=">>"
                  onClick={() => {
                    // this.setState((prevState) => ({
                    //   ...prevState,
                    //   correctMoves: [],
                    // }));
                  }}
                  className="tertiary"
                  color="B"
                  height={60}
                  width={50}
                />
              </div>
              <Input
                color="B"
                value={this.state.correctMovesString}
                width={200}
                height={60}
                onChange={(value) => {
                  this.setState({ correctMovesString: value });
                }}
                placeholder="correct moves"
                password={false}
              />
            </div>
          </div>
          <div className="creator-board fade blue-board">
            <Chessground
              // theme={this.state.theme}
              forwardedRef={this.chessgroundRef}
              // viewOnly={this.isCheckmate()}
              fen={this.state.fenHistory[this.state.fenHistory.length - 1]}
              resizable={true}
              wFaction={this.state.whiteFaction}
              bFaction={this.state.blackFaction}
              royalties={this.state.royalties}
              // wVisible={this.state.wVisCount === 0}
              // bVisible={this.state.bVisCount === 0}
              width={480}
              height={480}
              check={InCheck() ? true : false}
              animation={{
                enabled: true,
                duration: 200,
              }}
              highlight={{
                lastMove: true,
                check: true,
                royalties: true,
              }}
              lastMove={this.state.lastMove}
              orientation={this.state.orientation}
              disableContextMenu={false}
              turnColor={
                this.state.playing
                  ? GameBoard.side === 0
                    ? 'white'
                    : 'black'
                  : ''
              }
              movable={{
                free: this.state.playing ? false : true,
                rookCastle: false,
                color: this.state.playing
                  ? GameBoard.side === 0
                    ? 'white'
                    : 'black'
                  : 'both',
                dests:
                  this.state.placingPiece === 0
                    ? this.state.placingRoyalty === 0
                      ? this.state.swapType === ''
                        ? this.arcaneChess().getGroundMoves()
                        : this.arcaneChess().getSwapMoves(this.state.swapType)
                      : this.arcaneChess().getSummonMoves(
                          `R${RtyChar.split('')[this.state.placingRoyalty]}`
                        )
                    : this.arcaneChess().getSummonMoves(
                        PceChar.split('')[this.state.placingPiece]
                      ),
                events: {},
              }}
              selectable={{
                enabled: true,
                selected:
                  this.state.placingPiece !== 0
                    ? {
                        role: `${PceChar.split('')[
                          this.state.placingPiece
                        ].toLowerCase()}-piece`,
                        color: 'white',
                      }
                    : this.state.placingRoyalty !== 0
                    ? {
                        role: `r${RtyChar.split('')[
                          this.state.placingRoyalty
                        ].toLowerCase()}-piece`,
                        color: 'white',
                      }
                    : null,
                fromPocket: false,
              }}
              events={{
                change: () => {},
                dropNewPiece: (_piece: string, key: string) => {
                  if (
                    this.state.playing &&
                    GameBoard.pieces[prettyToSquare(key)] === PIECES.EMPTY
                  ) {
                    const parsed = this.arcaneChess().makeUserMove(
                      null,
                      key,
                      this.state.placingPiece,
                      '',
                      this.state.placingRoyalty
                    );
                    if (!PrMove(parsed)) {
                      console.log('invalid move');
                    }
                    this.setState(
                      (prevState) => ({
                        history: [...prevState.history, PrMove(parsed)],
                        fen: outputFenOfCurrentPosition(),
                        fenHistory: [
                          ...prevState.fenHistory,
                          outputFenOfCurrentPosition(),
                        ],
                        lastMove: [key, key],
                        placingPiece: 0,
                        placingRoyalty: 0,
                        swapType: '',
                      }),
                      () => {
                        this.engineGo();
                      }
                    );
                  }
                  if (this.state.placingRoyalty !== 0) {
                    this.setState((prevState) => ({
                      ...prevState,
                      royalties: {
                        ...prevState.royalties,
                        [`royalty${
                          RtyChar.split('')[this.state.placingRoyalty]
                        }`]: {
                          ...prevState.royalties[
                            `royalty${
                              RtyChar.split('')[this.state.placingRoyalty]
                            }`
                          ],
                          [key]: 6,
                        },
                      },
                      placingRoyalty: this.state.playing
                        ? 0
                        : this.state.placingRoyalty,
                    }));
                  }
                },
                move: (orig: string, dest: string) => {
                  if (this.state.playing) {
                    // to pass promotion to makeusermove epsilon
                    // console.log(capturedPiece);
                    const parsed = this.arcaneChess().makeUserMove(
                      orig,
                      dest,
                      0,
                      this.state.swapType,
                      this.state.placingRoyalty
                    );
                    if (!PrMove(parsed)) {
                      console.log('invalid move');
                      // debugger;
                    }
                    this.setState(
                      (prevState) => ({
                        history: [...prevState.history, PrMove(parsed)],
                        fen: outputFenOfCurrentPosition(),
                        fenHistory: [
                          ...prevState.fenHistory,
                          outputFenOfCurrentPosition(),
                        ],
                        lastMove: [orig, dest],
                        placingPiece: 0,
                        placingRoyalty: 0,
                        swapType: '',
                        royalties: {
                          royaltyQ: _.mapValues(
                            prevState.royalties.royaltyQ,
                            (value) => value - 1
                          ),
                          royaltyT: _.mapValues(
                            prevState.royalties.royaltyT,
                            (value) => value - 1
                          ),
                          royaltyM: _.mapValues(
                            prevState.royalties.royaltyM,
                            (value) => value - 1
                          ),
                          royaltyV: _.mapValues(
                            prevState.royalties.royaltyV,
                            (value) => value - 1
                          ),
                          royaltyE: _.mapValues(
                            prevState.royalties.royaltyE,
                            (value) => value - 1
                          ),
                        },
                      }),
                      () => this.engineGo()
                    );
                  } else {
                    editMovePiece(orig, dest);
                    this.setState({
                      fen: outputFenOfCurrentPosition(),
                      fenHistory: [outputFenOfCurrentPosition()],
                    });
                  }
                },
                select: (key: string) => {
                  const char = RtyChar.split('')[this.state.placingRoyalty];
                  const whiteLimit =
                    100 - 10 * (8 - GameBoard.summonRankLimits[0]);
                  const blackLimit =
                    20 + 10 * (8 - GameBoard.summonRankLimits[1]);
                  if (this.state.playing) {
                    if (this.state.placingRoyalty > 0) {
                      if (
                        ((GameBoard.side === COLOURS.WHITE &&
                          prettyToSquare(key) < whiteLimit) ||
                          (GameBoard.side === COLOURS.BLACK &&
                            prettyToSquare(key) > blackLimit)) &&
                        GameBoard.pieces[prettyToSquare(key)] !== PIECES.EMPTY
                      ) {
                        const parsed = this.arcaneChess().makeUserMove(
                          null,
                          key,
                          this.state.placingPiece,
                          '',
                          this.state.placingRoyalty
                        );
                        if (!PrMove(parsed)) {
                          console.log('invalid move');
                        }
                        this.setState(
                          (prevState) => ({
                            ...prevState,
                            history: [...prevState.history, PrMove(parsed)],
                            fen: outputFenOfCurrentPosition(),
                            fenHistory: [
                              ...prevState.fenHistory,
                              outputFenOfCurrentPosition(),
                            ],
                            royalties: {
                              // todo remove old keys
                              ...prevState.royalties,
                              [`royalty${char}`]: {
                                ...prevState.royalties[`royalty${char}`],
                                [key]: 8,
                              },
                            },
                            lastMove: [key, key],
                            placingPiece: 0,
                            placingRoyalty: 0,
                            swapType: '',
                          }),
                          () => this.engineGo()
                        );
                      } else {
                        this.setState({
                          placingRoyalty: this.state.placingRoyalty,
                        });
                      }
                    }
                  } else {
                    if (
                      this.state.placingPiece === 0 &&
                      this.state.placingRoyalty === 0
                    )
                      return;
                    if (this.state.placingPiece === 333)
                      ClearPiece(prettyToSquare(key));
                    if (this.state.placingRoyalty !== 0) {
                      this.arcaneChess().addRoyalty(`royalty${char}`, key, 8);
                      this.setState((prevState) => ({
                        ...prevState,
                        royalties: {
                          ...prevState.royalties,
                          [`royalty${char}`]: {
                            ...prevState.royalties[`royalty${char}`],
                            [key]: 8,
                          },
                        },
                      }));
                    } else {
                      AddPiece(prettyToSquare(key), this.state.placingPiece);
                    }
                    this.setState({
                      fen: outputFenOfCurrentPosition(),
                      fenHistory: [outputFenOfCurrentPosition()],
                    });
                  }
                },
              }}
              draggable={{
                enabled: this.state.placingRoyalty === 0 ? true : false,
              }}
            />
          </div>
          <div className="top-right">
            <div className="panels-title-description">
              <div className="panels">
                {_.map(this.state.nodeObject, (_panel: any, key: string) => {
                  return (
                    <div
                      className="panel"
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        background:
                          this.state.currPanel === key ? 'darkblue' : '#444444',
                      }}
                      onClick={() => {
                        // const nodeA =
                        //   this.state.bookObject[this.state.currNode];
                        const panelA = this.state.nodeObject[key];

                        // No need to retrieve newPanelData using a function unless it's coming from outside this onClick handler's scope.
                        // If panelA already contains the data you need, just use it directly.

                        // Deep clone objects that you're going to update to ensure immutability.
                        // This includes royalties, whiteArcane, and blackArcane.
                        // Adjust the cloning method based on your data structure and what you need to copy (shallow vs. deep clone).
                        const newRoyalties = JSON.parse(
                          JSON.stringify(panelA.royalties)
                        );
                        const newWhiteArcane = JSON.parse(
                          JSON.stringify(panelA.whiteArcane)
                        );
                        const newBlackArcane = JSON.parse(
                          JSON.stringify(panelA.blackArcane)
                        );

                        this.chessgroundRef.current?.setAutoShapes([
                          ...(panelA.arrowsCircles ?? []),
                        ]);

                        this.setState(
                          (prevState) => ({
                            ...prevState,
                            currPanel: key,
                            panelObject: {
                              ...panelA,
                              royalties: newRoyalties,
                              whiteArcane: newWhiteArcane,
                              blackArcane: newBlackArcane,
                            },
                            royalties: newRoyalties,
                            panelText: panelA.panelText,
                            fen: panelA.fen,
                            fenHistory: [...panelA.fenHistory],
                            history: [...panelA.history],
                            preset: panelA.preset,
                            description: panelA.panelText,
                            config: {
                              ...prevState.config,
                              W: {
                                ...prevState.config.W,
                                arcana: newWhiteArcane,
                              },
                              BK: {
                                ...prevState.config.BK,
                                arcana: newBlackArcane,
                              },
                            },
                            correctMoves: [...panelA.correctMoves],
                          }),
                          () => ParseFen(panelA.fen)
                        );
                      }}
                    >
                      {key}
                      {/* <div
                      className="delete-panel"
                      onClick={() => {
                        this.setState((prevState) => ({
                          ...prevState,
                          nodeObject: _.omit(
                            this.booksMap[this.state.currBook]['lesson-1'].panels,
                            key
                          ),
                        }));
                      }}
                    >
                      -
                    </div> */}
                    </div>
                  );
                })}
                <Input
                  placeholder="panel-x"
                  color="B"
                  value={this.state.newBoardName}
                  width={110}
                  onChange={(value) => {
                    this.setState({ newBoardName: value });
                  }}
                  password={false}
                />
                <Button
                  text="+"
                  className="tertiary"
                  color="G"
                  height={31}
                  width={110}
                  onClick={() => {
                    this.setState((prevState) => ({
                      ...prevState,
                      currNode: this.state.newNodeName,
                      currPanel: this.state.newBoardName,
                      bookObject: {
                        ...prevState.bookObject,
                        [this.state.currNode]: {
                          ...prevState.bookObject[this.state.currNode],
                          panels: {
                            ...prevState.bookObject[this.state.currNode].panels,
                            [this.state.newBoardName]: {
                              fen: '8/8/8/8/8/8/8/8 w - - 0 1',
                              fenHistory: ['8/8/8/8/8/8/8/8 w - - 0 1'],
                              history: [],
                              panelText: '',
                              arrowsCircles: [],
                              royalties: {
                                royaltyQ: {},
                                royaltyT: {},
                                royaltyM: {},
                                royaltyV: {},
                                royaltyE: {},
                              },
                              preset: 'CLEAR',
                              whiteArcane: {},
                              blackArcane: {},
                              config: {},
                              correctMoves: [],
                            },
                          },
                        },
                      },
                      nodeObject: {
                        ...prevState.nodeObject,
                        [this.state.newBoardName]: {
                          fen: '8/8/8/8/8/8/8/8 w - - 0 1',
                          fenHistory: ['8/8/8/8/8/8/8/8 w - - 0 1'],
                          history: [],
                          panelText: '',
                          arrowsCircles: [],
                          nodeText: '',
                          reward: [],
                          description: '',
                          opponent: '',
                          prereq: '',
                          royalties: {
                            royaltyQ: {},
                            royaltyT: {},
                            royaltyM: {},
                            royaltyV: {},
                            royaltyE: {},
                          },
                          preset: 'CLEAR',
                          whiteArcane: {},
                          blackArcane: {},
                          config: {},
                          correctMoves: [],
                        },
                      },
                      title: '',
                      panelObject:
                        this.state.nodeObject[this.state.newBoardName],
                      nodeText: '',
                      panelText: '',
                      reward: [],
                      description: '',
                      opponent: '',
                      prereq: '',
                    }));
                  }}
                />
              </div>
              <div className="title-description">
                <Input
                  // id="test"
                  className="input title"
                  color="B"
                  height={40}
                  width={280}
                  placeholder="TITLE"
                  value={this.state.title}
                  onChange={(value) => this.setState({ title: value })}
                  password={false}
                />
                <Input
                  // id="test"
                  className="input title"
                  color="B"
                  height={40}
                  width={280}
                  placeholder="OPPONENT"
                  value={this.state.opponent}
                  onChange={(value) => this.setState({ opponent: value })}
                  password={false}
                />
                {/* <input
                className="input description"
                color="B"
                height={280}
                width={280}
                placeholder="DESCRIPTION"
                // current
                value={this.state.fen} // Changed to use the value prop
                onChange={(value) => this.setFen(value)}
                // textArg={this.state.fenHistory[this.state.fenHistory.length - 1]}
                // setTextArg={() => this.setFen}
              /> */}
                <textarea
                  className="description"
                  placeholder="NODE DESCRIPTIONS"
                  style={{
                    color: 'white',
                    background: '#333333',
                    border: 'solid #555555 2px',
                    borderRadius: '5px',
                    resize: 'none',
                  }}
                  value={this.state.nodeText}
                  onChange={(event) =>
                    this.setState({ nodeText: event.target.value })
                  }
                ></textarea>
                <textarea
                  className="description"
                  placeholder="PANEL TEXT"
                  style={{
                    color: 'white',
                    background: '#333333',
                    border: 'solid #555555 2px',
                    borderRadius: '5px',
                    resize: 'none',
                  }}
                  value={this.state.panelText}
                  onChange={(event) =>
                    this.setState({ panelText: event.target.value })
                  }
                ></textarea>
              </div>
            </div>
            <div className="piece-pickup">
              <div className="piece-pickup-white">
                {whitePiecePickupArray.map((piece, index) => (
                  <div
                    className="piece-pickup-square"
                    key={index}
                    onClick={() => {
                      this.setState({
                        placingPiece: pieces[piece],
                        placingRoyalty: 0,
                      });
                    }}
                  >
                    <div
                      className={`${piece
                        .substring(1, 2)
                        .toLocaleLowerCase()}-piece ${
                        piece.substring(0, 1) === 'w'
                          ? `white ${this.state.whiteFaction}`
                          : `black ${this.state.blackFaction}`
                      }`}
                      style={{
                        position: 'relative',
                        top: '4px',
                        left: '4px',
                        width: '40px',
                        height: '40px',
                        transform: 'scale(1.25)',
                      }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="piece-pickup-extra">
                {_.map(extraPickupArray, (value, key: string) => (
                  <div
                    key={key}
                    className="piece-pickup-square"
                    onMouseEnter={() => this.setState({ royaltyHover: key })}
                    onMouseLeave={() => this.setState({ royaltyHover: '' })}
                    onClick={() => {
                      this.setState({
                        placingRoyalty: royalties[`R${key}`],
                        placingPiece: 0,
                      });
                    }}
                  >
                    <div
                      className="royalty-hover"
                      style={{
                        width: '50px',
                        height: '50px',
                        background: '#333333',
                        position: 'relative',
                        backgroundImage: `radial-gradient(
          circle at 50% 50%,
          ${value} 0%,
          rgba(0, 0, 0, 0) 100%
        )`,
                        backgroundColor:
                          this.state.royaltyHover === key
                            ? '#555555'
                            : '#333333',
                      }}
                    ></div>
                  </div>
                ))}
                <div className="piece-pickup-square">
                  <div
                    className="x-piece"
                    style={{
                      position: 'relative',
                      top: '-25px',
                      left: '-25px',
                      width: '100px',
                      height: '100px',
                      transform: 'scale(.4)',
                    }}
                    onClick={() => {
                      this.setState({
                        placingPiece: pieces.X,
                        placingRoyalty: 0,
                      });
                    }}
                  ></div>
                </div>
              </div>
              <div className="piece-pickup-black">
                {blackPiecePickupArray.map((piece, index) => (
                  <div
                    className="piece-pickup-square"
                    key={index}
                    onClick={() => {
                      this.setState({
                        placingPiece: pieces[piece],
                        placingRoyalty: 0,
                      });
                    }}
                  >
                    <div
                      className={`${piece
                        .substring(1, 2)
                        .toLocaleLowerCase()}-piece ${
                        piece.substring(0, 1) === 'w'
                          ? `white ${this.state.whiteFaction}`
                          : `black ${this.state.blackFaction}`
                      }`}
                      style={{
                        position: 'relative',
                        top: '4px',
                        left: '4px',
                        width: '40px',
                        height: '40px',
                        transform: 'scale(1.25)',
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bottom-left">
            <div className="faction-input">
              {['R', 'O', 'W', 'Y', 'G', 'BK', 'B', 'V'].map((color, index) => (
                <Button
                  text={greekLetters[index]}
                  key={index}
                  // className=""
                  className={`faction-swatch${
                    this.state.selectedSide === color ||
                    this.state.selectedFaction === color
                      ? '-selected'
                      : ''
                  } tertiary`}
                  color={color}
                  width={50}
                  height={30}
                  onClick={() => {
                    this.selectFaction(color);
                    this.selectSide(color);
                  }}
                  backgroundColorOverride={
                    this.state.selectedSide === color ||
                    this.state.selectedFaction === color
                      ? factionColorMap[color]
                      : ''
                  }
                ></Button>
              ))}
            </div>
            <div className="pv-line">
              {this.state.hoverArcane ? (
                <div className="arcana-detail">
                  <p>{arcana[this.state.hoverArcane].name}</p>
                  <p>{arcana[this.state.hoverArcane].description}</p>
                </div>
              ) : (
                this.state.pvLine
              )}
            </div>
          </div>
          <div className="bottom-center">
            <div className="fen-input">
              <Input
                // id="test"
                className="input fen-text-box"
                color="B"
                height={26}
                width={360}
                placeholder="FEN"
                // current
                value={this.state.fen} // Changed to use the value prop
                onChange={(value) => {
                  this.setState({
                    fen: value,
                  });
                }}
                password={false}
                // textArg={this.state.fenHistory[this.state.fenHistory.length - 1]}
                // setTextArg={() => this.setFen}
              />
              {this.state.playing ? (
                <Button
                  text="RESET"
                  onClick={() => {
                    // this.calculateFen();
                    this.setState({
                      playing: false,
                      fen: this.booksMap[this.state.currBook][
                        this.state.currNode
                      ]['panels'][this.state.currPanel].fen,
                      fenHistory: [
                        this.booksMap[this.state.currBook][this.state.currNode][
                          'panels'
                        ][this.state.currPanel].fen,
                      ],
                      history:
                        this.booksMap[this.state.currBook][this.state.currNode][
                          'panels'
                        ][this.state.currPanel].history,
                      arrowsCircles:
                        this.booksMap[this.state.currBook][this.state.currNode][
                          'panels'
                        ][this.state.currPanel].arrowsCircles,
                      royalties:
                        this.booksMap[this.state.currBook][this.state.currNode][
                          'panels'
                        ][this.state.currPanel].royalties,
                      preset:
                        this.booksMap[this.state.currBook][this.state.currNode][
                          'panels'
                        ][this.state.currPanel].preset,
                    });
                  }}
                  className="primary"
                  color="B"
                  height={26}
                  width={120}
                  // disabled={this.state.fen === ''}
                  disabled={false}
                  // strong={true}
                />
              ) : (
                <Button
                  text="SET"
                  onClick={() => {
                    this.setFen(this.state.fen);
                    // console.log(
                    //   this.state.config.W.arcana,
                    //   this.state.config.BK.arcana
                    // );
                    // // const fischer = randomize(
                    // //   this.state.config.W.arcana,
                    // //   this.state.config.BK.arcana
                    // // );
                    // this.arcaneChess().startGame(
                    //   this.state.fen,
                    //   this.state.config.W.arcana,
                    //   this.state.config.BK.arcana,
                    //   this.state.royalties,
                    //   this.state.preset
                    // );
                    // if (this.state.fen.split(' ')[1] === 'b') {
                    //   this.engineGo();
                    // }

                    // this.setState((prevState) => ({
                    //   ...prevState,
                    //   playing: true,
                    //   placingPiece: 0,
                    //   placingRoyalty: 0,
                    //   swapType: '',
                    //   fen: this.state.fen,
                    //   fenHistory: [this.state.fen],
                    //   royalties: {
                    //     royaltyQ: _.fromPairs(
                    //       _.map(GameBoard.royaltyQ, (v, k) => [PrSq(k), v])
                    //     ),
                    //     royaltyT: _.fromPairs(
                    //       _.map(GameBoard.royaltyT, (v, k) => [PrSq(k), v])
                    //     ),
                    //     royaltyM: _.fromPairs(
                    //       _.map(GameBoard.royaltyM, (v, k) => [PrSq(k), v])
                    //     ),
                    //     royaltyV: _.fromPairs(
                    //       _.map(GameBoard.royaltyV, (v, k) => [PrSq(k), v])
                    //     ),
                    //     royaltyE: _.fromPairs(
                    //       _.map(GameBoard.royaltyE, (v, k) => [PrSq(k), v])
                    //     ),
                    //   },
                    // }));
                  }}
                  className="primary"
                  color="B"
                  height={26}
                  width={120}
                  // disabled={this.state.fen === ''}
                  disabled={false}
                  // strong={true}
                />
              )}
            </div>
            <div></div>
            <div className="time-input">
              <Select
                type="number"
                width={90}
                height={26}
                options={[20, 30, 45, 60, 90, 120, 180, 300, 600]}
                onChange={(value) => {
                  this.setState((prevState) => ({
                    ...prevState,
                    time: [
                      [Number(value), prevState.time[0][1]],
                      [prevState.time[1][0], prevState.time[1][1]],
                    ],
                  }));
                }}
              />
              <Select
                type="number"
                width={90}
                height={26}
                options={[1, 2, 3, 4, 5, 10, 15, 20, 30, 60]}
                onChange={(value) => {
                  this.setState((prevState) => ({
                    ...prevState,
                    time: [
                      [prevState.time[0][0], Number(value)],
                      [prevState.time[1][0], prevState.time[1][1]],
                    ],
                  }));
                }}
              />
            </div>
            <div className="reward-input">
              <Input
                color="B"
                value={this.state.prereq}
                placeholder="PREREQ"
                width={180}
                height={26}
                onChange={(value) => {
                  this.setState({ prereq: value });
                }}
                password={false}
              ></Input>
            </div>
            <div></div>
            <div className="time-input">
              <Select
                type="number"
                width={90}
                height={26}
                options={[20, 30, 45, 60, 90, 120, 180, 300, 600]}
                onChange={(value) => {
                  this.setState((prevState) => ({
                    ...prevState,
                    time: [
                      [prevState.time[0][0], prevState.time[0][1]],
                      [Number(value), prevState.time[1][1]],
                    ],
                  }));
                }}
              />
              <Select
                type="number"
                width={90}
                height={26}
                options={[1, 2, 3, 4, 5, 10, 15, 20, 30, 60]}
                onChange={(value) => {
                  this.setState((prevState) => ({
                    ...prevState,
                    time: [
                      [prevState.time[0][0], prevState.time[0][1]],
                      [prevState.time[1][0], Number(value)],
                    ],
                  }));
                }}
              />
            </div>
            <div className="material">
              <div className="white-material">
                {GameBoard.material[0] ? GameBoard.material[0] - 150000 : 0}
              </div>
              <div className="black-material">
                {GameBoard.material[1] ? GameBoard.material[1] - 150000 : 0}
              </div>
            </div>
            {/* <Button
              text="FACTIONIZE"
              onClick={() => this.calculateFen()}
              className="primary"
              color="B"
              height={31}
              width={120}
              // disabled={this.state.fen === ''}
              disabled={false}
              // strong={true}
            /> */}
          </div>
          <div className="bottom-right">
            <div className="create-buttons">
              <div className="content">
                <Button
                  text="PUZZLE"
                  onClick={() => {
                    if (process.env.NODE_ENV === 'production') return;
                    const rating = this.state.puzzleEpsilon.split(' ')[0];
                    const keyword = this.state.puzzleEpsilon
                      .split(' ')
                      .slice(1)
                      .join(' ');

                    console.log('getting puzzles', rating, keyword);
                    axios
                      .get(
                        `http://localhost:8080/api/puzzles?rating=${rating}&keyword=${keyword}`
                      )
                      .then((response) => {
                        const allPanels: Record<string, PanelInfo> = {};
                        response.data.forEach(
                          (item: PuzzleData, index: number) => {
                            const panelKey = `panel-${index + 1}`;
                            allPanels[panelKey] = {
                              ...this.state.nodeObject[this.state.currPanel],
                              fen: item.FEN,
                              fenHistory: [item.FEN],
                              history: [...this.state.history],
                              panelText: '',
                              preset: '',
                              viewOnly: true,
                              orientation: 'white',
                              whiteArcane: { ...this.state.config.W.arcana },
                              blackArcane: { ...this.state.config.BK.arcana },
                              correctMoves: item.Moves.split(' '),
                              config: {},
                              royalties: {
                                royaltyQ: {},
                                royaltyT: {},
                                royaltyM: {},
                                royaltyV: {},
                                royaltyE: {},
                              },
                            };
                          }
                        );
                        console.log(response.data, allPanels);
                        if (response.data.length > 0) {
                          ParseFen(response.data[0].FEN);
                        }
                      })
                      .catch((error) => {
                        console.error('Error:', error);
                      });
                  }}
                  className="tertiary"
                  color="B"
                  height={30}
                  width={100}
                  disabled={false}
                />
                <Button
                  text="RAND"
                  className="tertiary"
                  color="B"
                  height={30}
                  width={100}
                  disabled={false}
                  onClick={() => {
                    this.toggleAndRandomizeArcana(
                      this.state.selectedSide === 'W' ? 'W' : 'BK'
                    );
                    // this.toggleAndRandomizeArcana('BK');
                  }}
                />
              </div>
              <div className="picker-extension">
                <Button
                  className="tertiary"
                  color="B"
                  text="MOUSE"
                  height={30}
                  onClick={() => this.setState({ placingPiece: 0 })}
                />
                <Button
                  className="tertiary"
                  color="B"
                  text="TRASH"
                  height={30}
                  // onClick={() => this.setState({ placingPiece: 333 })}
                />
              </div>
              <div className="reset-output">
                <Button
                  text="PANEL"
                  onClick={() => {
                    const elements = document.getElementsByTagName('g');
                    let arrowsCircles: any[] = [];
                    for (let i = 0; i < elements.length; i++) {
                      const children = elements[i].children;
                      for (let j = 0; j < children.length; j++) {
                        const items = children[j].getAttribute('cgHash');
                        const itemsArray = items?.split(',');
                        if (itemsArray && itemsArray.length >= 4) {
                          if (
                            itemsArray.length === 5 ||
                            itemsArray[5] === 'true'
                          ) {
                            arrowsCircles = [
                              ...arrowsCircles,
                              {
                                orig: itemsArray[2],
                                dest: itemsArray[3],
                                brush: itemsArray[4],
                              },
                            ];
                          } else {
                            arrowsCircles = [
                              ...arrowsCircles,
                              {
                                orig: itemsArray[2],
                                brush: itemsArray[3],
                              },
                            ];
                          }
                        }
                      }
                    }
                    const objectToCopy = {
                      ...this.state.nodeObject[this.state.currPanel],
                      fen: this.state.fen,
                      fenHistory: [...this.state.fenHistory],
                      history: [...this.state.history],
                      panelText: this.state.panelText,
                      arrowsCircles: [
                        ...arrowsCircles,
                        ...(this.state.arrowsCircles ?? []),
                      ],
                      royalties: { ...this.state.royalties },
                      preset: this.state.preset,
                      config: {},
                      viewOnly: true,
                      orientation: 'white',
                      whiteArcane: { ...this.state.config.W.arcana },
                      blackArcane: { ...this.state.config.BK.arcana },
                      // config: { ...this.state.config },
                      correctMoves: [
                        ...this.state.correctMovesString.split(' '),
                      ],
                    };
                    const keyAndPanel = `"${
                      this.state.currPanel
                    }": ${JSON.stringify(objectToCopy)},`;
                    navigator.clipboard.writeText(keyAndPanel);
                  }}
                  className="tertiary"
                  color="B"
                  height={30}
                  width={133}
                  disabled={false}
                />
                <Button
                  text="NODE"
                  onClick={() => {
                    const objectToCopy = {
                      id: this.state.currNode,
                      prereq: this.state.prereq,
                      title: this.state.title,
                      nodeText: this.state.nodeText,
                      storyTitle: '',
                      storyText: this.state.panelText,
                      hero: '',
                      opponent: this.state.opponent,
                      theme: this.state.theme,
                      bookTheme: '',
                      time: this.state.time,
                      boss: false,
                      reward: [],
                      panels: { ...this.state.nodeObject },
                      diagWinLose: {
                        win1: '',
                        win2: '',
                        win3: '',
                        lose1: '',
                        lose2: '',
                        lose3: '',
                        victory: '',
                        defeat: '',
                      },
                    };
                    const keyAndNode = `"${
                      this.state.currNode
                    }": ${JSON.stringify(objectToCopy)},`;
                    navigator.clipboard.writeText(keyAndNode);
                  }}
                  className="tertiary"
                  color="B"
                  height={30}
                  width={133}
                  disabled={false}
                />
                <Button
                  text="TEMPLE"
                  onClick={() => null}
                  className="tertiary"
                  color="B"
                  height={30}
                  width={133}
                  disabled={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// function mapStateToProps({}) {
//   return {};
// }

export const InGameMenu = UnwrappedInGameMenu;
// connect(mapStateToProps)(
//   withRouter(UnwrappedFrontPage)
// );

// .hero-text {
//   font-size: 48px;
//   font-weight: 800;
// }
