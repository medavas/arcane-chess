import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { connect } from 'react-redux';

import './FrontPage.scss';
import Hero from 'src/shared/components/hero2/Hero';

import Button from 'src/shared/components/Button/Button';

import { loginGuest } from 'src/features/auth/store/authActions';

interface UserData {
  username: string;
  password: string;
  guest: boolean;
}

type FrontPageProps = {
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

class UnwrappedFrontPage extends React.Component<
  FrontPageProps,
  RandomSloganState
> {
  private slogans: string[];
  private intervalId: NodeJS.Timeout | undefined = undefined;
  constructor(props: FrontPageProps) {
    super(props);
    this.slogans = [
      'Principle. Preparation. Process.',
      'As in war, so in life.',
      'Built for GMs, fun for aliens, instructive for all.',
      'Is this theory? Nope.',
      'Read. Recognize. React.',
      "Let's see a more advanced setup.",
      'Metagame just got a new name.',
      "User used plan. It's super effective.",
      'Patience. Planning. Persistence.',
      'Difficult to learn, impossible to master.',
      'Your mind is the armory.',
      'Less doom scroll, more square control.',
      'Initiative. Formulation. Execution.',
      'Multiversal chess? Believe it.',
      'Balanced but volatile.',
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
        className={`front-page-container ${
          this.state.fadeIn ? 'fade-in' : ''
        } ${this.state.fadeOut ? 'fade-out' : ''}`}
      >
        <div className={`fade-overlay ${this.state.fadeOut ? 'active' : ''}`} />
        <div className="header">
          <div className="inner-header">
            <img className="logo" src={'/assets/logoall+.png'} alt="" />
            <div className="inner-header-a">
              <h1 className="tactorius" style={{ fontWeight: '800' }}>
                <div className="tact">
                  <i>TACTORIUS</i>
                </div>
                {/* <div className="orius">
                  <i>ORIUS</i>
                </div> */}
              </h1>
              <p>
                <i>{this.state.currentSlogan}</i>
              </p>
            </div>
          </div>
        </div>
        <div className="front-page fade offset-hero">
          <div className="row-a">
            <div className="enter-buttons">
              <Button
                text="ENTER THE SITE"
                color="V"
                height={80}
                width={400}
                disabled={false}
                styles={{
                  color: 'white',
                  fontStyle: 'italic',
                }}
                fontSize={24}
                strong={true}
                backgroundColorOverride="linear-gradient(135deg, rgba(255, 81, 47, 0.4), rgba(142, 45, 226, 0.4))"
                onClick={() => this.handleEnterClick()}
              />
            </div>
            <div className="intro-box">
              <div className="intro">
                <h3>
                  Welcome to <em>Tactorius</em>, where the timeless game of
                  Chess becomes a metagame-based epic of strategy, philosophy,
                  and imagination.
                </h3>
                <h3>Enter Arcane Chess:</h3>
                <p>
                  Step into a world where traditional Chess boundaries are
                  redefined. Utilize powerful arcana — spells that bend the
                  rules — encounter new and formidable pieces. Uncover limitless
                  possibilities for fresh tactics as opening theory is exchanged
                  for metagame.
                </p>
                <div className="learn-more">
                  <Link to="/manifest?tab=pieces">
                    <Button
                      text="LEARN MORE: PIECES"
                      color="B"
                      height={60}
                      width={300}
                      disabled={false}
                      styles={{ color: 'white', fontStyle: 'italic' }}
                      fontSize={16}
                      strong={true}
                      backgroundColorOverride="linear-gradient(135deg, rgba(0, 198, 255, 0.3), rgba(0, 31, 77, 0.3))"
                    />
                  </Link>
                </div>
                <div className="learn-more">
                  <Link to="/manifest?tab=arcana">
                    <Button
                      text="LEARN MORE: ARCANA"
                      color="G"
                      height={60}
                      width={300}
                      disabled={false}
                      styles={{ color: 'white', fontStyle: 'italic' }}
                      fontSize={16}
                      strong={true}
                      backgroundColorOverride="linear-gradient(135deg, rgba(0, 176, 155, 0.3), rgba(0, 100, 0, 0.3))"
                    />
                  </Link>
                </div>
                <h3>Discover unique modes and challenges:</h3>
                <p>
                  Engage in faction-based skirmishes or challenge the computer —
                  an adaptive engine capable of casting spells of its own. Each
                  battle tests not only calculation but creativity as you
                  explore new layers of strategy born from the metagame.
                </p>
                <p>
                  Venture into the campaign: a story-driven journey blending
                  mythology, evolving concepts, and life lessons. Encounter
                  powerful foes, solve puzzles, and rise through the leaderboard
                  as you master the art of arcanecraft and tactics.
                </p>
                <h5>
                  <strong>Your mind is the armory.</strong>
                </h5>
              </div>
            </div>
            <div className="enter-buttons">
              <Button
                text="ENTER THE SITE"
                color="V"
                height={80}
                width={400}
                disabled={false}
                styles={{
                  color: 'white',
                  fontStyle: 'italic',
                }}
                fontSize={24}
                strong={true}
                backgroundColorOverride="linear-gradient(135deg, rgba(255, 81, 47, 0.4), rgba(142, 45, 226, 0.4))"
                onClick={() => this.handleEnterClick()}
              />
            </div>
            <div className="intro-box" style={{ marginBottom: '200px' }}>
              <div className="intro">
                <h3>
                  Education in Chess has to be an education in independent
                  thinking and judgment. Chess must not be memorized.
                </h3>
                {/* <hr /> */}
                <h5>&emsp; - Emanuel Lasker, Second World Chess Champion</h5>
              </div>
            </div>
          </div>
          <Hero />
        </div>
        <div className="front-page-footer"></div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  loginGuest: (guestUserData: UserData) => dispatch(loginGuest(guestUserData)),
});

const FrontPageNoNavigation = connect(
  null,
  mapDispatchToProps
)(withRouter(UnwrappedFrontPage));

export const FrontPage = ({ ...mapDispatchToProps }) => {
  const navigate = useNavigate();
  return <FrontPageNoNavigation {...mapDispatchToProps} navigate={navigate} />;
};
