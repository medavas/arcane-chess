import React, { createRef } from 'react';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import './Book.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';

import {
  Chessground,
  IChessgroundApi,
} from 'src/features/game/board/chessgroundMod';

import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

import TactoriusModal from 'src/shared/components/Modal/Modal';
import Button from 'src/shared/components/Button/Button';
import ArcanaSelect, {
  unlockableArcana,
} from 'src/features/campaign/pages/book/ArcanaSelect';
import CampaignArcanaSelect from 'src/features/campaign/components/ArcanaSelect/ArcanaSelect';

import arcanaJson from 'src/shared/data/arcana.json';

import { swapArmies } from 'src/shared/utils/utils';
import {
  setLocalStorage,
  getLocalStorage,
} from 'src/shared/utils/handleLocalStorage';

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
  chapterDropdownOpen: boolean;
  showArcanaSelect: boolean;
}

interface Node {
  id: string; // 'lesson-1';
  title: string;
  storyTitle: string;
  storyText?: string;
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
  boss?: boolean;
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
    const currentBook =
      this.booksMap[
      `book${getLocalStorage(this.props.auth.user.username)?.chapter}`
      ];
    const lastAvailableNode = this.getLatestAvailableNode(LS, currentBook);
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
      book: currentBook,
      selectedSwatch: lastAvailableNode?.id || '',
      config: getLocalStorage(this.props.auth.user.username)?.config,
      multiplier: getLocalStorage(this.props.auth.user.username)?.config
        .multiplier,
      nodeScores: getLocalStorage(this.props.auth.user.username)?.nodeScores,
      inventory: getLocalStorage(this.props.auth.user.username)?.inventory,
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
      chapterDropdownOpen: false,
      showArcanaSelect: false,
    };
    this.toggleAllNodesUnlocked = this.toggleAllNodesUnlocked.bind(this);
    this.toggleChapterDropdown = this.toggleChapterDropdown.bind(this);
  }

  getLatestAvailableNode(
    LS: any,
    currentBook: { [key: string]: Node }
  ): Node | undefined {
    // Get all available nodes and select the last one
    const availableNodes = _.filter(currentBook, (node) => {
      if (LS.allNodesUnlocked || this.state?.allNodesUnlocked) return true;
      if (
        (_.includes(node.id, 'mission') || _.includes(node.id, 'temple')) &&
        LS.nodeScores[node.id]
      )
        return false;
      if (
        !_.includes(node.id, 'lesson') &&
        LS.nodeScores &&
        LS.nodeScores[node.id]
      )
        return false;
      if (node.prereq && !_.includes(Object.keys(LS.nodeScores), node.prereq))
        return false;
      return true;
    });
    return availableNodes[availableNodes.length - 1];
  }

  toggleChapterDropdown() {
    this.setState((prevState) => ({
      chapterDropdownOpen: !prevState.chapterDropdownOpen,
    }));
  }

  toggleAllNodesUnlocked() {
    this.setState((prevState) => ({
      allNodesUnlocked: !prevState.allNodesUnlocked,
    }));
  }

  toggleHover = (arcane: string) => {
    this.setState({ hoverArcane: arcane });
  };

  getPlayerSpellBook = () => {
    // Use state if available, otherwise read from localStorage
    const spellBookObj =
      this.state.inventory ||
      getLocalStorage(this.props.auth.user.username)?.inventory ||
      {};
    const spellBookArray: ArcanaDetail[] = [];

    // Convert spellBook object to array format expected by ArcanaSelect
    Object.keys(spellBookObj).forEach((arcaneId) => {
      const count = spellBookObj[arcaneId];
      for (let i = 0; i < count; i++) {
        if (arcana[arcaneId]) {
          spellBookArray.push(arcana[arcaneId]);
        }
      }
    });

    // Fill remaining slots with empty (limit to 6 spells)
    while (spellBookArray.length < 6) {
      spellBookArray.push({
        id: 'empty',
        name: '',
        description: '',
        type: '',
        imagePath: '/empty',
      });
    }

    return spellBookArray.slice(0, 6);
  };

  updatePlayerSpellBook = (spellBook: ArcanaDetail[]) => {
    const LS = getLocalStorage(this.props.auth.user.username);
    const spellBookObj: { [key: string]: number } = {};

    // Convert array back to object format
    spellBook.forEach((arcane) => {
      if (arcane.id === 'empty') return;
      if (spellBookObj[arcane.id]) {
        spellBookObj[arcane.id] += 1;
      } else {
        spellBookObj[arcane.id] = 1;
      }
    });

    setLocalStorage({
      ...LS,
      inventory: spellBookObj,
    });

    this.setState({ inventory: spellBookObj });
  };

  getUnlockedArcana = () => {
    const LS = getLocalStorage(this.props.auth.user.username);
    const chapter = LS.chapter || 0;

    // Return cumulative arcana from all chapters up to and including current chapter
    const cumulativeArcana: { [key: string]: number } = {};

    for (let i = 0; i <= chapter - 1 && i < unlockableArcana.length; i++) {
      const chapterArcana = unlockableArcana[i];
      Object.entries(chapterArcana).forEach(([key, value]) => {
        cumulativeArcana[key] = (cumulativeArcana[key] || 0) + value;
      });
    }

    return cumulativeArcana;
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
      inventory: LS.inventory,
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

    // Check if nodeScores changed (e.g., user returned from completing a chapter)
    const LS = getLocalStorage(this.props.auth.user.username);
    if (!_.isEqual(LS.nodeScores, prevState.nodeScores)) {
      const currentBook = this.booksMap[`book${LS.chapter}`];
      const latestNode = this.getLatestAvailableNode(LS, currentBook);

      if (latestNode && latestNode.id !== this.state.selectedSwatch) {
        // Update localStorage.nodeId so START button loads the correct node
        setLocalStorage({
          ...LS,
          nodeId: latestNode.id,
        });

        this.setState({
          selectedSwatch: latestNode.id,
          nodeScores: LS.nodeScores,
          theme: latestNode.theme,
          bookTheme: latestNode.bookTheme,
        });
      }
    }
  }

  componentDidMount() {
    const targetValue = this.state.reducedScore;
    this.setState({ targetValue });

    (window as any).toggleAllNodesUnlocked = this.toggleAllNodesUnlocked;

    // Sync latest available node from localStorage on mount
    const LS = getLocalStorage(this.props.auth.user.username);
    const currentBook = this.booksMap[`book${LS.chapter}`];
    const latestNode = this.getLatestAvailableNode(LS, currentBook);

    if (latestNode && latestNode.id !== this.state.selectedSwatch) {
      // Update localStorage.nodeId so START button loads the correct node
      setLocalStorage({
        ...LS,
        nodeId: latestNode.id,
      });

      this.setState({
        selectedSwatch: latestNode.id,
        nodeScores: LS.nodeScores,
        theme: latestNode.theme,
        bookTheme: latestNode.bookTheme,
      });
    }

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

    if (LS.chapter === 0) {
      return (
        <div
          className="completed-node"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100vw',
            height: '100vh',
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
              color="B"
              height={200}
              width={400}
            />
          </Link>
        </div>
      );
    }

    return (
      <>
        <TactoriusModal isOpen={this.state.armoryOpen} type="armory" />
        <TactoriusModal isOpen={this.state.endChapterOpen} type="chapterEnd" />
        <div className="book">
          {/* Mobile Header with Logo, Arcana Preview, and Score */}
          <div className="mobile-header">
            <div className="left-section">
              <Link to="/campaign" style={{ textDecoration: 'none' }}>
                <div className="hex-home-icon">
                  <img src="/assets/logoall+.png" alt="Home" />
                </div>
              </Link>
              <div className="audio-controls">
                <GlobalVolumeControl />
              </div>
            </div>
            <div className="mobile-score">
              <span className="multiplier">x{this.state.multiplier}</span>
              <span
                className="points"
                style={{
                  minWidth: '200px',
                  textAlign: 'right',
                  display: 'inline-block',
                }}
              >
                {digits}
              </span>
            </div>
          </div>

          {/* Chapter Dropdown Selector */}
          <div className="chapter-dropdown">
            <div
              className="chapter-selected"
              onClick={this.toggleChapterDropdown}
            >
              <span className="chapter-title">
                {this.state.selectedSwatch
                  ? this.state.book[this.state.selectedSwatch]?.title
                  : 'Select a Chapter'}
              </span>
              <span
                className={`chapter-icon ${this.state.chapterDropdownOpen ? 'open' : ''
                  }`}
              >
                ▼
              </span>
            </div>
            <div
              className={`chapter-list ${this.state.chapterDropdownOpen ? 'open' : ''
                }`}
            >
              {_.filter(this.state.book, (node) => {
                const currLS = getLocalStorage(this.props.auth.user.username);
                if (this.state.allNodesUnlocked) return true;
                if (
                  (_.includes(node.id, 'mission') ||
                    _.includes(node.id, 'temple')) &&
                  currLS.nodeScores[node.id]
                )
                  return false;
                if (
                  !_.includes(node.id, 'lesson') &&
                  currLS.nodeScores &&
                  currLS.nodeScores[node.id]
                )
                  return false;
                if (
                  node.prereq &&
                  !_.includes(Object.keys(currLS.nodeScores), node.prereq)
                )
                  return false;
                return true;
              }).map((node, i) => (
                <div
                  key={i}
                  className={`chapter-item ${_.includes(Object.keys(LS.nodeScores), node.id)
                    ? 'completed'
                    : ''
                    } ${this.state.selectedSwatch === node.id ? 'selected' : ''}`}
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
                        chapterDropdownOpen: false,
                      },
                      () => {
                        const missionArcanaDelta =
                          this.booksMap[`book${LS.chapter}`]?.[
                            this.state.selectedSwatch
                          ]?.panels['panel-1'].whiteArcane;
                        const diffMults: Record<string, number> = {
                          novice: 80,
                          intermediate: 95,
                          advanced: 110,
                          expert: 125,
                        };
                        const updatedConfig = { ...LS.config };
                        // Always clear arcana for missions and temples to use only current chapter's unlockable arcana
                        const updatedArcana = {};
                        if (_.includes(node.id, 'temple')) {
                          this.updateMultiplier(diffMults[LS.difficulty], true);
                        }
                        if (Object.keys(missionArcanaDelta || {}).length) {
                          this.updateMultiplier(diffMults[LS.difficulty], true);
                        }
                        setLocalStorage({
                          auth: currLS.auth,
                          chapter: currLS.chapter,
                          config: updatedConfig,
                          arcana: updatedArcana,
                          nodeScores: currLS.nodeScores,
                          inventory: currLS.inventory,
                          nodeId: node.id,
                          chapterEnd: currLS.chapterEnd,
                          difficulty: currLS.difficulty,
                        });
                      }
                    );
                  }}
                >
                  {node.title}
                </div>
              ))}
            </div>
          </div>

          <div className="hud">
            <div className="left">
              <div style={{ display: 'flex' }}>
                <Link to="/campaign">
                  <Button
                    text="BACK"
                    className="tertiary"
                    color="B"
                    width={200}
                    height={35}
                    disabled={false}
                  />
                </Link>
                <Button
                  text="UNLOCK CHAPTERS"
                  className="tertiary"
                  color="B"
                  width={200}
                  height={35}
                  disabled={false}
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
                    color="B"
                    width={200}
                    disabled={this.state.selectedSwatch === ''}
                    styles={{ color: 'white', borderRadius: 0 }}
                    onClick={() => {
                      // Ensure localStorage.nodeId is updated before navigation
                      const LS = getLocalStorage(this.props.auth.user.username);
                      setLocalStorage({
                        ...LS,
                        nodeId: this.state.selectedSwatch,
                      });
                    }}
                  />
                </Link>
              </div>
              <div className="score">
                <span className="multiplier">x{this.state.multiplier}</span>
                <div
                  className="points"
                  style={{ minWidth: '200px', textAlign: 'right' }}
                >
                  <span className="digit-box">{digits}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="content">
            {/* Chess Board */}
            <div className="chess-tab" key={this.state.bookTheme}>
              <div
                className={`cg-wrap tactorius-board tactorius-default-board`}
              >
                <Chessground
                  forwardedRef={this.chessgroundRef}
                  fen={this.getFen()}
                  coordinates={false}
                  resizable={true}
                  wFaction={'normal'}
                  bFaction={'normal'}
                  width={'100%'}
                  height={'100%'}
                  animation={{
                    enabled: true,
                    duration: 1,
                  }}
                  orientation={
                    this.state.playerColor === 'black' &&
                      this.state.selectedSwatch.split('-')[0] === 'mission'
                      ? 'black'
                      : 'white'
                  }
                  viewOnly={true}
                  events={{}}
                />
              </div>
            </div>

            {/* Right Panel - Info Stack */}
            <div className="right-panel">
              {/* Chapter Dropdown inside right panel (tablet/desktop only) */}
              <div className="chapter-dropdown">
                <div
                  className="chapter-selected"
                  onClick={this.toggleChapterDropdown}
                >
                  <span className="chapter-title">
                    {this.state.selectedSwatch
                      ? this.state.book[this.state.selectedSwatch]?.title
                      : 'Select a Chapter'}
                  </span>
                  <span
                    className={`chapter-icon ${this.state.chapterDropdownOpen ? 'open' : ''
                      }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  className={`chapter-list ${this.state.chapterDropdownOpen ? 'open' : ''
                    }`}
                >
                  {_.filter(this.state.book, (node) => {
                    const currLS = getLocalStorage(
                      this.props.auth.user.username
                    );
                    if (this.state.allNodesUnlocked) return true;
                    if (
                      (_.includes(node.id, 'mission') ||
                        _.includes(node.id, 'temple')) &&
                      currLS.nodeScores[node.id]
                    )
                      return false;
                    if (
                      !_.includes(node.id, 'lesson') &&
                      currLS.nodeScores &&
                      currLS.nodeScores[node.id]
                    )
                      return false;
                    if (
                      node.prereq &&
                      !_.includes(Object.keys(currLS.nodeScores), node.prereq)
                    )
                      return false;
                    return true;
                  }).map((node, i) => (
                    <div
                      key={i}
                      className={`chapter-item ${_.includes(Object.keys(LS.nodeScores), node.id)
                        ? 'completed'
                        : ''
                        } ${this.state.selectedSwatch === node.id ? 'selected' : ''
                        }`}
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
                            chapterDropdownOpen: false,
                          },
                          () => {
                            const missionArcanaDelta =
                              this.booksMap[`book${LS.chapter}`]?.[
                                this.state.selectedSwatch
                              ]?.panels['panel-1'].whiteArcane;
                            const diffMults: Record<string, number> = {
                              novice: 80,
                              intermediate: 95,
                              advanced: 110,
                              expert: 125,
                            };
                            const updatedConfig = { ...LS.config };
                            // Always clear arcana for missions and temples to use only current chapter's unlockable arcana
                            const updatedArcana = {};
                            if (_.includes(node.id, 'temple')) {
                              this.updateMultiplier(
                                diffMults[LS.difficulty],
                                true
                              );
                            }
                            if (Object.keys(missionArcanaDelta || {}).length) {
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
                              inventory: currLS.inventory,
                              nodeId: node.id,
                              chapterEnd: currLS.chapterEnd,
                              difficulty: currLS.difficulty,
                            });
                          }
                        );
                      }}
                    >
                      {node.title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Display */}
              <div className="opponent-arcana-section">
                <div className="time-display">{this.getTimeDisplay()}</div>
              </div>

              {/* 1. Opponent Arcana */}
              <div className="opponent-arcana-section">
                <div className="arcana-selector-label">Opponent Arcana</div>
                {this.state.selectedSwatch &&
                  isMission &&
                  this.state.playerColor === 'white' && (
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
                      onToggleHover={(arcane: string) =>
                        this.toggleHover(arcane)
                      }
                    />
                  )}
                {this.state.selectedSwatch &&
                  isMission &&
                  this.state.playerColor === 'black' && (
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
                      onToggleHover={(arcane: string) =>
                        this.toggleHover(arcane)
                      }
                    />
                  )}
              </div>

              {/* 2. Player Arcana */}
              <div className="mobile-arcana-section">
                <div className="arcana-selector-label">Your Arcana</div>
                {this.state.selectedSwatch && (
                  <CampaignArcanaSelect
                    spellBook={this.getPlayerSpellBook()}
                    color={this.state.playerColor}
                    isOpen={this.state.showArcanaSelect}
                    handleToggle={() => {
                      this.setState({
                        showArcanaSelect: !this.state.showArcanaSelect,
                      });
                    }}
                    updateSpellBook={(spellBook) => {
                      this.updatePlayerSpellBook(spellBook);
                    }}
                    updateHover={(arcaneObject) => {
                      this.setState({
                        hoverArcane: arcaneObject.id || '',
                      });
                    }}
                    unlockedArcana={this.getUnlockedArcana()}
                  />
                )}
              </div>

              {/* 3. Chapter Description */}
              <div className="chapter-description">
                {this.state.selectedSwatch && this.state.hoverArcane !== '' ? (
                  <>
                    <div className="node-title">
                      {arcana[this.state.hoverArcane].name}
                    </div>
                    <div className="node-description">
                      <p>{arcana[this.state.hoverArcane].description}</p>
                    </div>
                  </>
                ) : this.state.selectedSwatch ? (
                  <>
                    <div className="node-title">
                      {this.state.book[this.state.selectedSwatch].title}
                      {this.state.book[this.state.selectedSwatch].boss && (
                        <span className="boss-indicator"> 👑 BOSS BATTLE</span>
                      )}
                    </div>
                    <div className="node-description">
                      {this.state.book[this.state.selectedSwatch].nodeText
                        .split('\n\n')
                        .map((p: string, i: number) => (
                          <p key={i}>{p}</p>
                        ))}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Start Button inside right panel (tablet/desktop only) */}
              <div className="start-button-section">
                <Link to={`/${this.state.selectedSwatch.split('-')[0]}`}>
                  <Button
                    text="START CHAPTER"
                    className="primary start-btn"
                    color="B"
                    width={200}
                    disabled={this.state.selectedSwatch === ''}
                    onClick={() => {
                      // Ensure localStorage.nodeId is updated before navigation
                      const LS = getLocalStorage(this.props.auth.user.username);
                      setLocalStorage({
                        ...LS,
                        nodeId: this.state.selectedSwatch,
                      });
                    }}
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Start Button (Sticky at bottom) */}
          <div className="mobile-start-button">
            <Link to={`/${this.state.selectedSwatch.split('-')[0]}`}>
              <Button
                text="START CHAPTER"
                className="primary"
                color="B"
                width={200}
                disabled={this.state.selectedSwatch === ''}
                onClick={() => {
                  // Ensure localStorage.nodeId is updated before navigation
                  const LS = getLocalStorage(this.props.auth.user.username);
                  setLocalStorage({
                    ...LS,
                    nodeId: this.state.selectedSwatch,
                  });
                }}
              />
            </Link>
          </div>
        </div>
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
