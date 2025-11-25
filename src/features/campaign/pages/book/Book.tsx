import React, { createRef } from 'react';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import './Book.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';

import { Chessground, IChessgroundApi } from 'src/features/game/board/chessgroundMod';

import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

import TactoriusModal from 'src/shared/components/Modal/Modal';
import Button from 'src/shared/components/Button/Button';
import ArcanaSelect, { unlockableArcana } from 'src/features/campaign/pages/book/ArcanaSelect';

import arcanaJson from 'src/shared/data/arcana.json';

import { swapArmies } from 'src/shared/utils/utils';
import { setLocalStorage, getLocalStorage } from 'src/shared/utils/handleLocalStorage';

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

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

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

interface BookProps {
  auth: { user: { id: string; username: string } };
}
interface BookState {
  [key: string]: any;
  endChapterOpen: boolean;
  selectedTab: string;
  hoverArcane: string;
}

interface Node {
  id: string; // 'lesson-1';
  title: string;
  storyTitle: string;
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
  opponent: string;
  hero: string;
  theme: string;
  bookTheme: string;
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

export class UnwrappedBook extends React.Component<BookProps, BookState> {
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
  constructor(props: BookProps) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);
    this.state = {
      allNodesUnlocked: false,
      armoryOpen: false,
      // get all nodes from json import and .map in render
      // to conditionally render right side of view depending on current node id]
      pointsEx: 3552,
      inboxEx: ['lesson-1', 'temple-1', 'mission-1', 'mission-2'],
      dialogueEx: [
        ['sidian', 'message'],
        ['narrator', 'message'],
        ['hero', 'message'],
      ],
      chapter: [
        `jsonChapter${getLocalStorage(this.props.auth.user.username)?.chapter}`,
      ],
      book: this.booksMap[
        `book${getLocalStorage(this.props.auth.user.username)?.chapter}`
      ],
      selectedSwatch: '',
      config: getLocalStorage(this.props.auth.user.username)?.config,
      multiplier: getLocalStorage(this.props.auth.user.username)?.config
        .multiplier,
      nodeScores: getLocalStorage(this.props.auth.user.username)?.nodeScores,
      spellBook: getLocalStorage(this.props.auth.user.username)?.spellBook,
      endChapterOpen: getLocalStorage(this.props.auth.user.username)
        ?.chapterEnd,
      playerColor: getLocalStorage(this.props.auth.user.username)?.config.color,
      reducedScore: _.reduce(
        getLocalStorage(this.props.auth.user.username).nodeScores,
        (accumulator, value) => {
          return accumulator + value;
        },
        0
      ),
      animatedValue: 0,
      targetValue: 0,
      credits: 4000,
      creditsAnimation: 0,
      theme: this.booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`]?.theme,
      bookTheme:
        this.booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`]?.bookTheme,
      selectedTab: 'chess',
      hoverArcane: '',
      selectedArcana: getLocalStorage(this.props.auth.user.username)?.arcana,
    };
    this.toggleAllNodesUnlocked = this.toggleAllNodesUnlocked.bind(this);
  }

  toggleAllNodesUnlocked() {
    this.setState((prevState) => ({
      allNodesUnlocked: !prevState.allNodesUnlocked,
    }));
  }

  toggleHover = (arcane: string) => {
    this.setState({ hoverArcane: arcane });
  };

  getFen() {
    let fen = '';
    if (!this.state.selectedSwatch.split('-')[0]) {
      fen = '8/8/8/8/8/8/8/8 w - - 0 1';
    } else if (
      this.state.playerColor === 'black' &&
      this.state.selectedSwatch.split('-')[0] === 'mission'
    ) {
      fen = swapArmies(
        this.state.book[this.state.selectedSwatch]?.panels['panel-1'].fen
      );
    } else {
      fen = this.state.book[this.state.selectedSwatch]?.panels['panel-1'].fen;
    }
    return fen;
  }

  getTimeDisplay() {
    const { selectedSwatch, book } = this.state;
    const LS = getLocalStorage(this.props.auth.user.username);
    const color = LS.config.color;

    if (!selectedSwatch || selectedSwatch.split('-')[0] === 'lesson') {
      return null;
    }

    const swatchKey = book[selectedSwatch];
    if (!swatchKey || !swatchKey.time || !swatchKey.time[0]) {
      return null;
    }

    // Determine the index based on color
    const index = color === 'black' ? 1 : 0;
    const selectedTime = swatchKey.time[index];

    const timeOperator =
      selectedSwatch.split('-')[0] === 'mission'
        ? '+'
        : selectedSwatch.split('-')[0] === 'temple'
          ? '-'
          : '';

    return (
      <>
        {selectedTime[0]} {timeOperator} {selectedTime[1]}
      </>
    );
  }

  cubicEaseOut(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  updateMultiplier(value: number, setDirectly: boolean = false) {
    const newMultiplier = setDirectly ? value : this.state.multiplier + value;
    const LS = getLocalStorage(this.props.auth.user.username);
    setLocalStorage({
      auth: LS.auth,
      chapter: LS.chapter,
      config: {
        ...LS.config,
        multiplier: newMultiplier,
      },
      arcana: LS.arcana,
      nodeScores: LS.nodeScores,
      spellBook: LS.spellBook,
      nodeId: LS.nodeId,
      chapterEnd: LS.chapterEnd,
      difficulty: LS.difficulty,
    });
    this.setState({
      multiplier: newMultiplier,
    });
  }

  toggleTab = () => {
    this.setState((prevState) => ({
      selectedTab: prevState.selectedTab === 'story' ? 'chess' : 'story',
    }));
  };

  componentDidUpdate(_prevProps: BookProps, prevState: BookState) {
    if (this.state.allNodesUnlocked && !prevState.allNodesUnlocked) {
      if (process.env.NODE_ENV === 'development') {
        this.setState({ allNodesUnlocked: !prevState.allNodesUnlocked });
      }
    }
  }

  componentDidMount() {
    const targetValue = this.state.reducedScore;
    this.setState({ targetValue });

    (window as any).toggleAllNodesUnlocked = this.toggleAllNodesUnlocked;

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

  handleMultiplierChange = (value: number) => {
    this.setState({
      multiplier: this.state.multiplier + value,
    });
    this.updateMultiplier(value);
  };

  availableChapterArcana = () => {
    const chapter = getLocalStorage(this.props.auth.user.username).chapter;
    const unlockedArcana = unlockableArcana
      .slice(0, chapter)
      .reduce((acc, current) => {
        return { ...acc, ...current };
      }, {});
    return unlockedArcana;
  };

  handleArcanaClick = (key: string) => {
    const { auth } = this.props;

    const storedData = getLocalStorage(auth.user.username);
    const selectedArcana: Record<string, number> = storedData.arcana || {};
    const multiplierValues: Record<string, number> =
      this.availableChapterArcana();
    let newSelectedArcana = { ...selectedArcana };

    newSelectedArcana = _.omit(selectedArcana, key);

    setLocalStorage({
      ...storedData,
      arcana: newSelectedArcana,
      config: {
        ...storedData.confg,
        multiplier:
          storedData.config.multiplier +
          multiplierValues[key] * selectedArcana[key],
      },
      difficulty: storedData.difficulty,
    });

    this.setState({
      selectedArcana: newSelectedArcana,
      multiplier:
        storedData.config.multiplier +
        multiplierValues[key] * selectedArcana[key],
    });
  };

  render() {
    const { auth } = this.props;
    const LS = getLocalStorage(auth.user.username);
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
    const isMission = this.state.selectedSwatch.split('-')[0] === 'mission';
    return (
      <>
        {LS.chapter === 0 ? (
          <div
            className="completed-node"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw',
              height: '100vh',
              // background:
              //   this.state.theme === 'black'
              //     ? ''
              //     : `url(/assets/pages/${this.state.theme}.webp)`,
              background:
                this.state.theme === 'black'
                  ? '#000000cc'
                  : `radial-gradient(
          circle,
         rgba(221, 221, 221, 0.6) 0%,
          rgba(0, 0, 0, 1) 80%    
        )`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <Link to="/campaign">
              <Button
                text="BACK TO CAMPAIGN"
                className="primary"
                color="S"
                height={200}
                width={400}
              />
            </Link>
          </div>
        ) : (
          <div
            className="outer-book"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw',
              height: '100vh',
              // background:
              //   this.state.theme === 'black'
              //     ? ''
              //     : `url(/assets/pages/${this.state.theme}.webp)`,
              background:
                this.state.theme === 'black'
                  ? '#000000cc'
                  : `radial-gradient(
          circle,
         rgba(221, 221, 221, 0.6) 0%,
          rgba(0, 0, 0, 1) 80%    
        )`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <TactoriusModal
              isOpen={this.state.armoryOpen}
              type="armory"
            // imgPath="public/assets/treeBoat.jpg"
            />
            <TactoriusModal
              isOpen={this.state.endChapterOpen}
              type="chapterEnd"
            // imgPath="public/assets/treeBoat.jpg"
            />
            <div className="book">
              <div className="hud">
                <div className="left">
                  <div style={{ display: 'flex' }}>
                    <Link to="/campaign">
                      <Button
                        text="BACK"
                        className="tertiary"
                        color="S"
                        width={200}
                        height={35}
                        disabled={false}
                        backgroundColorOverride="#33333388"
                      />
                    </Link>
                    <Button
                      text="UNLOCK CHAPTERS"
                      className="tertiary"
                      color="S"
                      width={200}
                      height={35}
                      disabled={false}
                      backgroundColorOverride="#33333388"
                      onClick={() => this.toggleAllNodesUnlocked()}
                    />
                  </div>
                  <div className="arcana-helper">
                    {_.map(LS.arcana, (_value, key: string) => {
                      return (
                        <div
                          key={key}
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                            }}
                          >
                            {arcana[key].type === 'inherent'
                              ? 'INH'
                              : LS.arcana[key]}
                          </div>
                          <img
                            key={key}
                            className={`arcane ${this.state.hoverArcane === key ? 'focus' : ''
                              }`}
                            src={`/assets/arcanaImages${arcana[key].imagePath}.svg`}
                            style={{
                              height: '50px',
                              width: '50px',
                              cursor:
                                'url(/assets/images/cursors/pointer.svg) 12 4, pointer',
                            }}
                            onClick={() => {
                              this.handleArcanaClick(key);
                            }}
                            onMouseEnter={() => this.toggleHover(`${key}`)}
                            onMouseLeave={() => this.toggleHover('')}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="center">
                  {/* Click on a chapter to view its details. If the chapter is a
                  mission, you can click or hover on arcana badges for
                  additional information or to add them to your spellBook. Use
                  the Story button to switch between chess and story details,
                  and click the Start button to begin the chapter. */}
                  <GlobalVolumeControl />
                </div>
                <div className="right">
                  <div className="buttons">
                    {/* <div className="toggle-tab">
                      <Button
                        text={
                          this.state.selectedTab === 'chess' ? 'STORY' : 'CHESS'
                        }
                        className="tertiary"
                        color="S"
                        width={200}
                        backgroundColorOverride={'#33333388'}
                        onClick={this.toggleTab}
                      />
                    </div> */}
                    <Link to={`/${this.state.selectedSwatch.split('-')[0]}`}>
                      <Button
                        text="START"
                        className="primary"
                        color="S"
                        width={200}
                        disabled={this.state.selectedSwatch === ''}
                        styles={{ color: 'white', borderRadius: 0 }}
                      />
                    </Link>
                  </div>
                  <div className="score">
                    <span className="multiplier">x{this.state.multiplier}</span>
                    <div className="points">
                      <span className="digit-box">{digits}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content">
                <div className="nodes">
                  {_.filter(this.state.book, (node) => {
                    const currLS = getLocalStorage(
                      this.props.auth.user.username
                    );
                    if (this.state.allNodesUnlocked) {
                      return true;
                    }
                    if (
                      (_.includes(node.id, 'mission') ||
                        _.includes(node.id, 'temple')) &&
                      currLS.nodeScores[node.id]
                    ) {
                      return false;
                    }
                    if (
                      !_.includes(node.id, 'lesson') &&
                      currLS.nodeScores &&
                      currLS.nodeScores[node.id]
                    ) {
                      return false;
                    }
                    if (
                      node.prereq &&
                      !_.includes(Object.keys(currLS.nodeScores), node.prereq)
                    ) {
                      return false;
                    }
                    return true;
                  }).map((node, i) => {
                    return (
                      <Button
                        text={node.title}
                        color="S"
                        width={'100%'}
                        height={60}
                        disabled={false}
                        key={i}
                        className={`select-node tertiary`}
                        backgroundColorOverride={
                          _.includes(Object.keys(LS.nodeScores), node.id)
                            ? '#11111100'
                            : '#55555588'
                        }
                        onClick={() => {
                          const currLS = getLocalStorage(
                            this.props.auth.user.username
                          );
                          this.setState(
                            {
                              selectedSwatch: node.id,
                              bookTheme: node.bookTheme,
                              theme: node.theme,
                              config: currLS.config,
                            },
                            () => {
                              const missionArcanaDelta =
                                this.booksMap[`book${LS.chapter}`]?.[
                                  this.state.selectedSwatch
                                ]?.panels['panel-1'].whiteArcane;
                              const arcanaToStore = Object.keys(
                                missionArcanaDelta || {}
                              ).length
                                ? {}
                                : currLS.arcana;
                              const diffMults: Record<string, number> = {
                                novice: 80,
                                intermediate: 95,
                                advanced: 110,
                                expert: 125,
                              };
                              const updatedConfig = { ...LS.config };
                              let updatedArcana = arcanaToStore;
                              if (_.includes(node.id, 'temple')) {
                                updatedArcana = {};
                                this.updateMultiplier(
                                  diffMults[LS.difficulty],
                                  true
                                );
                                this.setState({});
                              }
                              if (
                                Object.keys(missionArcanaDelta || {}).length
                              ) {
                                this.updateMultiplier(
                                  diffMults[LS.difficulty],
                                  true
                                );
                              }
                              setLocalStorage({
                                auth: currLS.auth,
                                chapter: currLS.chapter,
                                config: updatedConfig,
                                arcana: updatedArcana,
                                nodeScores: currLS.nodeScores,
                                spellBook: currLS.spellBook,
                                nodeId: node.id,
                                chapterEnd: currLS.chapterEnd,
                                difficulty: currLS.difficulty,
                              });
                            }
                          );
                        }}
                      />
                    );
                  })}
                </div>
                {this.state.selectedTab === 'story' ? (
                  <div
                    key={this.state.bookTheme}
                    className="description-spellBook story-column"
                    style={
                      {
                        //   display: 'flex',
                        // width: '880px',
                        //   height: '480px',
                        //   background:
                        //     this.state.bookTheme === 'black'
                        //       ? ''
                        //       : `url(/assets/pages/${this.state.bookTheme}.webp)`,
                        //   backgroundSize: 'cover',
                        //   backgroundPosition: 'center',
                        //   backgroundRepeat: 'no-repeat',
                      }
                    }
                  >
                    <div
                      className="story-text"
                      style={{
                        // width: '880px',
                        height: '480px',
                        background: '#11111188',
                        padding: '20px',
                      }}
                    >
                      {this.state.selectedSwatch !== '' ? (
                        <div className="node">
                          <b className="node-title">
                            {
                              this.state.book[this.state.selectedSwatch]
                                .storyTitle
                            }
                          </b>
                          <div className="node-description">
                            {this.state.book[
                              this.state.selectedSwatch
                            ].storyText
                              .split('\n\n')
                              .map((p: string, i: number) => (
                                <p className="description-paragraph" key={i}>
                                  {p}
                                </p>
                              ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : this.state.selectedTab === 'chess' ? (
                  <div
                    className="chess-tab"
                    key={this.state.bookTheme}
                    style={
                      {
                        // width: '880px',
                        // background:
                        //   this.state.bookTheme === 'black'
                        //     ? ''
                        //     : `url(/assets/pages/${this.state.bookTheme}.webp)`,
                        // backgroundSize: 'cover',
                        // backgroundPosition: 'center',
                        // backgroundRepeat: 'no-repeat',
                      }
                    }
                  >
                    <div
                      className={`cg-wrap board-view tactorius-board ${this.state.theme}-board`}
                    >
                      <Chessground
                        // fen={this.state.fenHistory[this.state.fenHistory.length - 1]}
                        // check={this.tactorius.inCheck().isAttacked}
                        // viewOnly={this.isCheckmate()}
                        forwardedRef={this.chessgroundRef}
                        fen={this.getFen()}
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
                        width={'100%'}
                        height={'100%'}
                        // inline styling for aspect ratio? OR interpolating in this case based on the page type, use a global state string?
                        // don't, just go by the page type
                        // width={360}
                        // height={360}
                        animation={{
                          enabled: true,
                          duration: 1,
                        }}
                        // highlight={{
                        //   lastMove: true,
                        //   check: true,
                        // }}
                        orientation={
                          this.state.playerColor === 'black' &&
                            this.state.selectedSwatch.split('-')[0] === 'mission'
                            ? 'black'
                            : 'white'
                        }
                        // disableContextMenu={false}
                        // turnColor={GameBoard.side === 0 ? 'white' : 'black'}
                        // movable={{
                        //   free: false,
                        // }}
                        viewOnly={true}
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
                    </div>
                  </div>
                ) : null}
                <div
                  className="description-spellBook"
                // style={{ zIndex: 100 }}
                >
                  <div className="description">
                    {this.state.selectedSwatch !== '' ? (
                      <div className="node">
                        {this.state.hoverArcane !== '' ? (
                          <>
                            <b className="node-title">
                              {arcana[this.state.hoverArcane].name}
                            </b>
                            <div className="node-description">
                              <p className="description-paragraph">
                                {arcana[this.state.hoverArcane].description}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <b className="node-title">
                              {this.state.book[this.state.selectedSwatch].title}
                            </b>
                            <div className="node-description">
                              {this.state.book[
                                this.state.selectedSwatch
                              ].nodeText
                                .split('\n\n')
                                .map((p: string, i: number) => (
                                  <p className="description-paragraph" key={i}>
                                    {p}
                                    {this.state.book[this.state.selectedSwatch]
                                      .boss && (
                                        <span style={{ color: 'red' }}>
                                          This is a boss level. Completing this
                                          mission will reset your progress in this
                                          chapter.
                                        </span>
                                      )}
                                  </p>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="spellBook">
                    <div
                      className="time-arcana"
                      style={{ background: '#77777788' }}
                    >
                      <h2 className="time">{this.getTimeDisplay()}</h2>
                      <div
                        style={{
                          height: '240px',
                          width: '200px',
                        }}
                      >
                        {this.state.selectedSwatch === '' ? null : this.state
                          .playerColor === 'white' ? (
                          <ArcanaSelect
                            auth={this.props.auth}
                            isPlayerArcana
                            isMission={isMission}
                            updateBookMultiplier={(value) =>
                              this.updateMultiplier(value)
                            }
                            missionArcana={{
                              ...this.booksMap[`book${LS.chapter}`]?.[
                                this.state.selectedSwatch
                              ]?.panels['panel-1'].whiteArcane,
                            }}
                            onToggleHover={(arcane: string) => {
                              this.toggleHover(arcane);
                            }}
                          />
                        ) : (
                          <ArcanaSelect
                            auth={this.props.auth}
                            isPlayerArcana={false}
                            engineArcana={{
                              ...this.booksMap[`book${LS.chapter}`]?.[
                                this.state.selectedSwatch
                              ]?.panels['panel-1'].blackArcane,
                            }}
                            isMission={isMission}
                            updateBookMultiplier={(value) =>
                              this.updateMultiplier(value)
                            }
                            onToggleHover={(arcane: string) => {
                              this.toggleHover(arcane);
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className="time-arcana"
                      style={{ background: '#33333388' }}
                    >
                      <h2 className="time">{this.getTimeDisplay()}</h2>
                      <div
                        style={{
                          height: '240px',
                          width: '200px',
                        }}
                      >
                        {this.state.selectedSwatch === '' ? null : this.state
                          .playerColor === 'black' ? (
                          <ArcanaSelect
                            auth={this.props.auth}
                            isPlayerArcana
                            isMission={isMission}
                            updateBookMultiplier={(value) =>
                              this.updateMultiplier(value)
                            }
                            missionArcana={{
                              ...this.booksMap[`book${LS.chapter}`]?.[
                                this.state.selectedSwatch
                              ]?.panels['panel-1'].whiteArcane,
                            }}
                            onToggleHover={(arcane: string) => {
                              this.toggleHover(arcane);
                            }}
                          />
                        ) : (
                          <ArcanaSelect
                            auth={this.props.auth}
                            isPlayerArcana={false}
                            engineArcana={{
                              ...this.booksMap[`book${LS.chapter}`]?.[
                                this.state.selectedSwatch
                              ]?.panels['panel-1'].blackArcane,
                            }}
                            isMission={isMission}
                            updateBookMultiplier={(value) =>
                              this.updateMultiplier(value)
                            }
                            onToggleHover={(arcane: string) => {
                              this.toggleHover(arcane);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

function mapStateToProps({ auth }: { auth: any }) {
  return {
    auth,
  };
}

export const Book = connect(mapStateToProps, {})(UnwrappedBook);
