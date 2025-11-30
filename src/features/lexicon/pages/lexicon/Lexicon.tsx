import React, { createRef } from 'react';
import _ from 'lodash';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';

import { audioManager } from 'src/shared/utils/audio/AudioManager';

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

import './Lexicon.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/lambda.scss';
import { getLocalStorage } from 'src/shared/utils/handleLocalStorage';

import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';

import { outputFenOfCurrentPosition } from 'src/features/game/engine/board.mjs';
import { SearchController } from 'src/features/game/engine/search.mjs';
import { editMovePiece } from 'src/features/game/engine/gui.mjs';

import Button from 'src/shared/components/Button/Button';

import { Chessground, IChessgroundApi } from 'src/features/game/board/chessgroundMod';
import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

const booksMap: { [key: string]: { [key: string]: Node } } = {
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

const allLessons: any[] = [];

Object.keys(booksMap).forEach((bookKey) => {
  const book = booksMap[bookKey];
  Object.keys(book).forEach((lessonKey) => {
    if (lessonKey.startsWith('lesson-')) {
      allLessons.push(book[lessonKey]);
    }
  });
});

interface Node {
  id: string;
  title: string;
  time: number[][];
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
  opponent: string;
  hero: string;
  boss: boolean;
  theme: string;
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
      viewOnly: boolean;
      orientation: string;
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
  turn: string;
  playerColor: string;
  engineColor: string;
  currPanel: number;
  thinking: boolean;
  thinkingTime: number;
  history: string[];
  fenHistory: string[];
  correctMoves: string[];
  pvLine?: string[];
  arrowsCircles: { orig: string; brush: string; dest?: string | undefined }[];
  hasMounted: boolean;
  nodeId: string;
  moveNumber: number;
  fen: string;
  engineLastMove: string[];
  whiteFaction: string;
  blackFaction: string;
  selected: string;
  config: {
    [key: string | number]: {
      disabled: boolean;
      powers: {
        [key: string | number]: string | number | readonly string[] | undefined;
      };
      picks: number;
    };
  };
  gameOver: boolean;
  gameOverType: string;
  arcaneHover: string;
  wArcana:
  | {
    [key: string]: number | string;
  }
  | undefined;
  bArcana:
  | {
    [key: string]: number | string;
  }
  | undefined;
  lastMove: string[];
  hideCompletedPage: boolean;
  viewOnly: boolean;
  theme: string;
  opponent: string;
  victoryMessage: string;
  defeatMessage: string;
  allLessons: Node[];
  currentLesson: Node;
  selectedCategory: string;
}

interface Props {
  auth: {
    user: {
      username: string;
      id: string;
      campaign: {
        topScores: number[];
      };
    };
  };
}

class UnwrappedLexicon extends React.Component<Props, State> {
  hasMounted = false;
  arcaneChess;
  chessgroundRef = createRef<IChessgroundApi>();
  constructor(props: Props) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);
    this.state = {
      turn: 'white',
      playerColor: 'white',
      engineColor: 'black',
      arrowsCircles: [],
      hasMounted: false,
      nodeId: LS.nodeId,
      moveNumber: 0,
      currPanel: 1,
      gameOver: false,
      gameOverType: '',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      pvLine: [],
      history: [],
      fenHistory: ['8/8/8/8/8/8/8/8 w - - 0 1'],
      correctMoves: [],
      thinking: SearchController.thinking,
      engineLastMove: [],
      thinkingTime: 500,
      whiteFaction: 'normal',
      blackFaction: 'normal',
      selected: 'white',
      config: {
        // todo disable if no abilities selected
        a: { disabled: false, powers: {}, picks: 0 },
        b: { disabled: false, powers: {}, picks: 0 },
        c: { disabled: false, powers: {}, picks: 0 },
        d: { disabled: false, powers: {}, picks: 0 },
        e: { disabled: false, powers: {}, picks: 0 },
        f: { disabled: false, powers: {}, picks: 0 },
      },
      arcaneHover: '',
      wArcana: {},
      bArcana: {},
      lastMove: [],
      hideCompletedPage: LS.nodeId?.split('-')[0] !== 'lesson',
      viewOnly: true,
      theme: '',
      opponent: '',
      victoryMessage: '',
      defeatMessage: '',
      allLessons: allLessons,
      currentLesson: {} as Node,
      selectedCategory: '',
    };
    this.arcaneChess = () => {
      return arcaneChess();
    };
    this.chessgroundRef = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  changePosition = (direction: 'inc' | 'dec') => {
    this.setState((prevState) => {
      return {
        moveNumber: prevState.moveNumber + (direction === 'inc' ? 1 : -1),
        fen: this.state.fenHistory[
          prevState.moveNumber + (direction === 'inc' ? 1 : -1)
        ],
      };
    });
  };

  changePanel = (direction: 'inc' | 'dec') => {
    // const LS = getLocalStorage(this.props.auth.user.username);
    this.setState(
      (prevState) => {
        const newPanel = prevState.currPanel + (direction === 'inc' ? 1 : -1);
        this.chessgroundRef.current?.setAutoShapes([
          ...(this.state.currentLesson?.panels[`panel-${newPanel}`]
            .arrowsCircles ?? []),
        ]);
        return {
          ...prevState,
          currPanel: newPanel,
          moveNumber: 0,
          viewOnly:
            this.state.currentLesson?.panels[`panel-${newPanel}`].viewOnly,
          orientation:
            this.state.currentLesson?.panels[`panel-${newPanel}`].orientation,
          playerColor:
            this.state.currentLesson?.panels[`panel-${newPanel}`].fen.split(
              ' '
            )[0] === 'w'
              ? 'black'
              : 'white',
          engineColor:
            this.state.currentLesson?.panels[`panel-${newPanel}`].fen.split(
              ' '
            )[0] === 'w'
              ? 'white'
              : 'black',
          fen: this.state.currentLesson?.panels[`panel-${newPanel}`].fen,
          fenHistory: [
            this.state.currentLesson?.panels[`panel-${newPanel}`].fen,
          ],
          correctMoves:
            this.state.currentLesson?.panels[`panel-${newPanel}`].correctMoves,
          wArcana:
            this.state.currentLesson?.panels[`panel-${newPanel}`].whiteArcane,
          bArcana:
            this.state.currentLesson?.panels[`panel-${newPanel}`].blackArcane,
          arrowsCircles:
            this.state.currentLesson?.panels[`panel-${newPanel}`]
              .arrowsCircles || [],
        };
      },
      () => {
        if (!this.state.viewOnly) {
          this.arcaneChess().init();
          this.arcaneChess().startGame(
            this.state.fen,
            this.state.currentLesson?.panels?.['panel-1'].whiteArcane,
            this.state.currentLesson?.panels?.['panel-1'].blackArcane,
            {},
            'CHESS'
          );
          this.setState({});
        } else {
          this.arcaneChess().startGame(
            '8/8/8/8/8/8/8/8 w - - 0 1',
            this.state.currentLesson?.panels?.['panel-1'].whiteArcane,
            this.state.currentLesson?.panels?.['panel-1'].blackArcane,
            {},
            'CHESS'
          );
          this.setState({});
        }
      }
    );
  };

  stepForward = () => {
    function isLastProperty(obj: object, property: string) {
      const keys = Object.keys(obj);
      const lastKey = keys[keys.length - 1];
      return property === lastKey;
    }
    audioManager.playSFX('move');
    if (
      this.state.moveNumber === this.state.fenHistory.length - 1 &&
      isLastProperty(
        this.state.currentLesson?.panels,
        `panel-${this.state.currPanel}`
      )
    ) {
      // this.handleVictory();
    } else if (this.state.moveNumber === this.state.fenHistory.length - 1) {
      this.changePanel('inc');
    } else {
      this.changePosition('inc');
    }
  };

  stepBackward = () => {
    audioManager.playSFX('move');
    if (this.state.gameOver) {
      this.setState({ gameOver: false });
    } else if (this.state.moveNumber === 0) {
      this.changePanel('dec');
    } else {
      this.changePosition('dec');
    }
  };

  onChangeUses = (e: React.ChangeEvent<HTMLSelectElement>, power: string) => {
    const uses = Number(e.target.value) || e.target.value;
    this.setState((prevState) => ({
      ...prevState,
      config: {
        ...prevState.config,
        [this.state.selected]: {
          ...prevState.config[this.state.selected],
          powers: {
            ...prevState.config[this.state.selected].powers,
            [power]: uses,
          },
        },
      },
    }));
  };

  toggleHover = (arcane: string) => {
    this.setState({ arcaneHover: arcane });
  };

  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        if (this.state.currPanel > 1) this.stepBackward();
        break;
      case 'ArrowRight':
        this.stepForward();
        break;
      default:
        break;
    }
  }

  filterLessonsByCategory = (category: string) => {
    return allLessons.filter((lesson) => lesson.category === category);
  };

  componentWillUnmount(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Check if relevant data has changed
    if (
      this.props.auth.user.username !== prevProps.auth.user.username ||
      this.state.currPanel !== prevState.currPanel
    ) {
      const LS = getLocalStorage(this.props.auth.user.username);

      // Ensure the LS data is available and valid
      if (LS && LS.chapter && LS.nodeId) {
        const autoShapes =
          this.state.currentLesson?.panels?.[`panel-${this.state.currPanel}`]
            ?.arrowsCircles ?? [];
        // Ensure the ref is available before setting auto shapes
        if (this.chessgroundRef.current) {
          this.chessgroundRef.current.setAutoShapes([...autoShapes]);
        } else {
          console.error('Chessground Ref is not available.');
        }
      } else {
        console.error('LS data is not available or invalid.');
      }
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.chessgroundRef.current?.setAutoShapes([
      ...(this.state.currentLesson?.panels?.[`panel-1`].arrowsCircles || []),
    ]);
    this.setState({
      arrowsCircles:
        this.state.currentLesson?.panels?.[`panel-1`].arrowsCircles || [],
    });
  }

  render() {
    return (
      <div className="tactorius-board fade">
        <div
          style={{
            height: '100vh',
            width: '100vw',
          }}
        >
          <div className="lexicon-view">
            <div className="opponent-arcana-volume">
              <div className="lesson-list">
                <Link to="/" style={{ width: '160px' }}>
                  <Button
                    text="BACK"
                    className="tertiary"
                    color="G"
                    width={160}
                    height={40}
                    disabled={false}
                  />
                </Link>
                {this.state.selectedCategory === '' ? (
                  <div style={{ width: '100%' }}>
                    <Button
                      className="tertiary"
                      color="G"
                      text="LIFE"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'life',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="SKILLS"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'skills',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="BASICS"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'basics',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="PAWNS"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'pawns',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="PATTERNS"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'patterns',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="TACTICS"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'tactics',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="ATTACKING"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'attacking',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    <Button
                      className="tertiary"
                      color="G"
                      text="MATES"
                      onClick={() => {
                        this.setState({
                          selectedCategory: 'mates',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                    }}
                  >
                    <Button
                      className="tertiary"
                      variant="<"
                      color="G"
                      onClick={() => {
                        this.setState({
                          selectedCategory: '',
                        });
                      }}
                      width="100%"
                      backgroundColorOverride="#11111188"
                    />
                    {_.map(
                      this.filterLessonsByCategory(this.state.selectedCategory),
                      (lesson, i) => {
                        return (
                          <Button
                            key={i}
                            className="tertiary"
                            color="G"
                            text={lesson.title}
                            onClick={() => {
                              this.setState({
                                turn:
                                  lesson?.panels?.['panel-1']?.fen.split(
                                    ' '
                                  )[0] === 'w'
                                    ? 'white'
                                    : 'black',
                                engineColor:
                                  lesson?.panels?.['panel-1']?.fen.split(
                                    ' '
                                  )[0] === 'w'
                                    ? 'white'
                                    : 'black',
                                arrowsCircles:
                                  lesson?.panels?.['panel-1']?.arrowsCircles ||
                                  [],
                                fen: lesson?.panels?.['panel-1']?.fen,
                                history: [
                                  ...(lesson?.panels?.['panel-1']?.history ||
                                    []),
                                ],
                                fenHistory: [lesson?.panels?.['panel-1']?.fen],
                                correctMoves:
                                  lesson?.panels?.['panel-1']?.correctMoves,
                                wArcana:
                                  lesson?.panels?.['panel-1']?.whiteArcane,
                                bArcana:
                                  lesson?.panels?.['panel-1']?.blackArcane,
                                viewOnly: lesson?.panels?.['panel-1']?.viewOnly,
                                theme: lesson?.theme,
                                opponent: lesson?.opponent,
                                victoryMessage: lesson?.diagWinLose?.victory,
                                defeatMessage: lesson?.diagWinLose?.defeat,
                                currentLesson: lesson,
                                currPanel: 1,
                              });
                            }}
                            width="100%"
                            backgroundColorOverride="#11111188"
                          />
                        );
                      }
                    )}
                  </div>
                )}
              </div>
              <div className="lexicon-nav-arrows">
                <Button
                  className="tertiary"
                  onClick={() => {
                    this.stepBackward();
                  }}
                  disabled={
                    this.state.moveNumber === 0 && this.state.currPanel === 1
                      ? true
                      : false
                  }
                  color="S"
                  strong={true}
                  variant="<"
                  width={190}
                  fontSize={36}
                />
              </div>
              <div className="global-volume-control">
                <GlobalVolumeControl />
              </div>
            </div>
            <div className="time-board-time">
              <div className={`board-view lexicon-board`}>
                <Chessground
                  forwardedRef={this.chessgroundRef}
                  fen={this.state.fenHistory[this.state.fenHistory.length - 1]}
                  resizable={true}
                  wFaction={this.state.whiteFaction}
                  bFaction={this.state.blackFaction}
                  width={'100%'}
                  height={'100%'}
                  animation={{
                    enabled: true,
                    duration: 200,
                  }}
                  highlight={{
                    lastMove: true,
                    check: true,
                  }}
                  // check={InCheck() ? true : false}
                  orientation={this.state.playerColor}
                  disableContextMenu={false}
                  turnColor={this.state.playerColor}
                  movable={{
                    free: false,
                    color: this.state.playerColor,
                    rookCastle: false,
                    dests: this.arcaneChess().getGroundMoves(),
                  }}
                  events={{
                    move: (orig: string, dest: string) => {
                      editMovePiece(orig, dest);
                      audioManager.playSFX('move');
                      this.setState({
                        fen: outputFenOfCurrentPosition(),
                        fenHistory: [outputFenOfCurrentPosition()],
                      });
                    },
                  }}
                  selectable={{
                    enabled: true,
                  }}
                  lastMove={this.state.lastMove}
                />
              </div>
            </div>
            <div className="lexicon-clock-buttons">
              <div className="global-volume-control">
                <GlobalVolumeControl />
              </div>
              <div className="lexicon-text">
                <div>
                  {this.state.currentLesson?.panels?.[
                    `panel-${this.state.currPanel}`
                  ].panelText || ''}
                </div>
              </div>
              <div className="lexicon-nav-arrows">
                <Button
                  className="tertiary"
                  onClick={() => {
                    this.stepForward();
                  }}
                  color="S"
                  strong={true}
                  variant=">"
                  width={190}
                  fontSize={36}
                />
              </div>
              <div className="info-avatar">
                <div className="avatar">
                  {/* <img
                    src="/assets/avatars/hero.webp"
                    style={{
                      height: '60px',
                      width: '60px',
                      objectFit: 'contain',
                    }}
                  /> */}
                </div>
                <div className="arcana-select"></div>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="lexicon-curtain"></div> */}
      </div >
    );
  }
}

function mapStateToProps({ auth }: { auth: object }) {
  return {
    auth,
  };
}

export const Lexicon = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedLexicon));
