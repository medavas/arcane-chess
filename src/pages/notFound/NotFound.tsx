import React from 'react';
import { useNavigate } from 'react-router-dom';
import { withRouter } from 'src/components/withRouter/withRouter';
import { connect } from 'react-redux';

import './NotFound.scss';
import Hero from 'src/components/hero2/Hero';

import { loginGuest } from '../../actions/authActions';

interface UserData {
  username: string;
  password: string;
  guest: boolean;
}

type NotFoundProps = {
  loginGuest: (userData: any) => void;
  registerGuest: () => void;
  navigate: (path: string) => void;
};

type RandomSloganState = {
  currentSlogan: string;
  currentIndex: number;
  fadeIn: boolean;
  fadeOut: boolean;
};

class UnwrappedNotFound extends React.Component<
  NotFoundProps,
  RandomSloganState
> {
  private slogans: string[];
  private intervalId: NodeJS.Timeout | undefined = undefined;
  constructor(props: NotFoundProps) {
    super(props);
    this.slogans = [
      'Principle. Preparation. Process.',
      'As in war, so in life.',
      'Is this theory?',
      'Read. Recognize. React.',
      "Let's see a more advanced setup.",
      'Metagame just got a new name.',
      "User used plan. It's super effective.",
      'Patience. Planning. Persistence.',
      'Difficult to learn, impossible to master.',
      'Your mind is the armory.',
      'Less doom scroll, more square control.',
      'Initiative. Formulation. Execution.',
      'Built for GMs, fun for aliens, instructive for all.',
      'The war continues... so does your learning.',
    ];
    this.state = {
      currentSlogan: '',
      currentIndex: 0,
      fadeIn: false,
      fadeOut: false,
    };
  }

  fetchNextSlogan = () => {
    const nextIndex = (this.state.currentIndex + 1) % this.slogans.length;
    this.setState({
      currentSlogan: this.slogans[nextIndex],
      currentIndex: nextIndex,
    });
  };

  handleEnterClick = () => {
    this.setState({ fadeOut: true });
    setTimeout(() => {
      this.props.navigate('/login');
    }, 300);
  };

  componentDidMount() {
    const randomIndex = Math.floor(Math.random() * this.slogans.length);
    this.setState({
      currentSlogan: this.slogans[randomIndex],
      currentIndex: randomIndex,
    });

    this.intervalId = setInterval(this.fetchNextSlogan, 4000);

    setTimeout(() => {
      this.setState({ fadeIn: true });
    }, 50);
  }

  render() {
    return (
      <div
        className={`not-found-container ${this.state.fadeIn ? 'fade-in' : ''} ${
          this.state.fadeOut ? 'fade-out' : ''
        }`}
      >
        <div className="not-found fade offset-hero">
          <div className="row-a">
            <div className="intro-box">
              <div className="intro">
                <h3>404 anomaly detected</h3>
                {/* <p>
                  Cassandra awoke to a silence punctuated only by the distant
                  hum of cosmic energy, her consciousness now residing within
                  the sleek, reflective chassis of a drifting robot. She felt no
                  heartbeat, yet an inexplicable warmth stirred within the
                  intricate circuits that now housed her essence. As she floated
                  amid the tapestry of starlight and swirling nebulae, each
                  passing asteroid and quivering comet whispered secrets of
                  forgotten galaxies and new beginnings. In that surreal,
                  boundless void, Cassandra embraced the mysterious interplay of
                  human memory and machine precision, a silent witness to the
                  eternal dance of the universe.
                </p> */}
              </div>
            </div>
            <div className="hero-fullscreen">
              <Hero variant={'ghostSquares'} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  loginGuest: (guestUserData: UserData) => dispatch(loginGuest(guestUserData)),
});

const NotFoundNoNavigation = connect(
  null,
  mapDispatchToProps
)(withRouter(UnwrappedNotFound));

export const NotFound = ({ ...mapDispatchToProps }) => {
  const navigate = useNavigate();
  return <NotFoundNoNavigation {...mapDispatchToProps} navigate={navigate} />;
};
