import React from 'react';
import './Clock.scss';

//
// multiplayer to pass down current nodejs.timeouts from server level
//

interface ClockProps {
  type?: string;
  playerTurn: boolean;
  turn?: string;
  time: number | null;
  timePrime?: number | null;
  playerTimeout: () => void;
  // whiteTimeout: () => void;
  // blackTimeout: () => void;
}

interface ClockState {
  timeLeft: number | null;
  isActive: boolean;
  isPlayerOneTurn: boolean;
}

class ChessClock extends React.Component<ClockProps, ClockState> {
  interval: NodeJS.Timeout | null = null;

  constructor(props: ClockProps) {
    super(props);
    this.state = {
      timeLeft: props.time,
      isActive: true,
      isPlayerOneTurn: true,
    };
    // this.passTime = this.passTime.bind(this);
  }

  startTimer = () => {
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.setState((prevState) => {
          if (prevState.timeLeft === null) {
            return null;
          }
          const newTimeLeft = Math.max(prevState.timeLeft - 1, 0);
          return { timeLeft: newTimeLeft };
        });
      }, 1000);
    }
  };

  stopTimer = () => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    return this.state.timeLeft;
  };

  toggleTimer = () => {
    this.setState((prevState) => ({ isActive: !prevState.isActive }));
  };

  templeTimeHandler = () => {
    this.setState((prevState) => {
      if (prevState.timeLeft === null) {
        return null;
      }
      let adjustment = 0;
      if (this.props.timePrime != null) {
        adjustment = this.props.timePrime;
      } else if (adjustment === 0) {
        return null;
      }
      const newTimeLeft = Math.max(prevState.timeLeft - adjustment, 0);
      return { timeLeft: newTimeLeft };
    });
  };

  componentDidUpdate(prevProps: ClockProps, prevState: ClockState) {
    if (
      this.props.playerTurn !== prevProps.playerTurn &&
      !this.props.playerTurn &&
      this.props.type === 'inc'
    ) {
      this.setState((prevState) => {
        if (prevState.timeLeft === null) {
          return null;
        }
        let adjustment = 0;
        if (this.props.timePrime != null) {
          adjustment = this.props.timePrime;
        } else if (adjustment === 0) {
          return null;
        }
        const newTimeLeft = Math.max(prevState.timeLeft + adjustment, 0);
        return { timeLeft: newTimeLeft };
      });
      this.stopTimer();
    }

    if (this.props.playerTurn && !this.interval) {
      this.startTimer();
    }

    if (
      this.state.timeLeft === 0 &&
      this.state.timeLeft !== prevState.timeLeft
    ) {
      this.props.playerTimeout();
      this.stopTimer();
    }
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  componentDidMount() {
    this.startTimer();
  }

  render() {
    // isActive
    const { timeLeft } = this.state;
    const { time } = this.props;

    // let timerWidth = 0;
    // let timerColor = 'green';

    if (timeLeft !== null && time !== null) {
      // timerWidth = (timeLeft / time) * 100;
      // timerColor = timerWidth < 10 ? 'red' : 'green';
    }

    return (
      <div>
        <div className="time-text">{this.state.timeLeft}</div>
      </div>
    );
  }
}

export default ChessClock;
