import React from 'react';
// import { Link, withRouter } from "react-router-dom";
// import { connect } from "react-redux";

// import engine
import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';

import Input from '../../components/Input/Input';
import Button from 'src/shared/components/Button/Button';

import { PerftTest } from 'src/features/game/engine/perft.mjs';
import { ParseFen } from 'src/features/game/engine/board.mjs';

// interface FrontPageProps {
//   // whiteFaction: Faction;
//   // blackFaction: Faction;
//   // arcaneChess: () => void;
// }

type UIVState = {
  fen: string;
};

class UnwrappedSinglePlayer extends React.Component<object, UIVState> {
  arcaneChess;
  constructor(props: object) {
    super(props);
    this.state = {
      fen: '',
    };
    this.arcaneChess = () => arcaneChess();
    // this.arcaneChess();
  }

  initializeArcaneChessAndTest = () => {
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    // const start = '6pk/3K2p1/6p1/6p1/8/8/8/7P w - - 0 1';
    // const start = '8/8/8/4X3/8/8/8/8 w - - 0 1';
    // koh
    // const start = 'k7/8/8/8/8/8/8/7K w - - 0 1';
    // royalty mate
    // const start = '6Xk/6p1/6p1/8/8/8/7P/7K w - - 0 1';
    // promote to unicorn
    // const start = '4pk2/4ppp1/6XP/8/8/8/8/7K w - - 0 1';
    // const start = '5pk1/5XX1/6XP/6X1/8/8/8/7K w - - 0 1';
    // rnbqk2r/p1pp1ppp/1p2pn2/8/1bPP4/2N1P3/PP3PPP/R1BQKBNR w KQkq - 0 1
    this.arcaneChess().startGame(start);
    // this.perftTest(fen);
  };

  perftTest = (fen: string) => {
    ParseFen(fen);
    PerftTest(3);
  };

  setFen = (fen: string) => {
    this.setState({ fen });
  };

  render() {
    return (
      <div>
        <Input
          // id="test"
          className="input"
          color="S"
          height={40}
          width={400}
          placeholder="FEN"
          value={this.state.fen}
          // setText={this.setFen}
          onChange={(value) => this.setFen(value)}
          password={false}
        />
        <Button
          text="SET FEN"
          onClick={() => this.initializeArcaneChessAndTest()}
          className="primary"
          color="S"
          // disabled={this.state.fen === ''}
          disabled={false}
          // strong={true}
        />
      </div>
    );
  }
}

// function mapStateToProps({}) {
//   return {};
// }

export const SinglePlayer = UnwrappedSinglePlayer;
// connect(mapStateToProps)(
//   withRouter(UnwrappedFrontPage)
// );

// .hero-text {
//   font-size: 48px;
//   font-weight: 800;
// }
