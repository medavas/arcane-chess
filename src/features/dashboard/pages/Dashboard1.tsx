import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { logoutUser } from 'src/features/auth/store/authActions';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import Button from 'src/shared/components/Button/Button';

import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

import { audioManager } from 'src/shared/utils/audio/AudioManager';
import DashboardModal from '../components/DashboardModal/DashboardModal';

// Define the structure for props if any are expected
interface DashboardProps {
  logoutUser: () => void;
  auth: { user: { username: string } };
  navigate: (path: string) => void;
}

// Define the structure for the state
interface DashboardState {
  hoverNav: string;
  menuItemDescriptions: {
    campaign1: string;
    stacktadium3: string;
    leaderboard2: string;
    quickplay: string;
    gauntlet: string;
    lexicon: string;
    manifest2: string;
    logout: string;
  };
  fadeIn: boolean;
  fadeOut: boolean;
}

export class UnwrappedDashboard extends React.Component<
  DashboardProps,
  DashboardState
> {
  constructor(props: DashboardProps) {
    super(props);
    this.state = {
      hoverNav: 'campaign1',
      menuItemDescriptions: {
        campaign1:
          'Collect the arcana, conquer the beasts, and etch your name on the leaderboard.',
        stacktadium3: 'An ancient grid, a fresh enigma.',
        leaderboard2: 'Observe global rankings.',
        quickplay:
          'Master the arcana and challenge the engine with custom battles.',
        gauntlet: 'What waits above is not what began below. Coming soon.',
        lexicon: 'Review every technic mastered throughout the campaign.',
        manifest2: 'Mission, about, piece and arcana notes, etc.',
        logout: 'Pause and breathe—your journey can wait.',
      },
      fadeIn: false,
      fadeOut: false,
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ fadeIn: true });
    }, 50);
  }

  render() {
    return (
      <div
        className={`dashboard ${this.state.fadeIn ? 'fade-in' : ''} ${this.state.fadeOut ? 'fade-out' : ''
          }`}
      >
        <div className={`fade-overlay ${this.state.fadeOut ? 'active' : ''}`} />
        <div className="dashboard-content">
          <div className="nav-bar">
            <Link
              className="home-button"
              to="/campaign"
              onMouseEnter={() => this.setState({ hoverNav: 'campaign1' })}
            >
              <Button
                text="CAMPAIGN"
                className="tertiary"
                color="B"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>
            {/* <Link
              className="home-button"
              to="/gauntlet"
              onMouseEnter={() => this.setState({ hoverNav: 'gauntlet' })}
            > */}
            <div onMouseEnter={() => this.setState({ hoverNav: 'gauntlet' })}>
              {' '}
              <Button
                text="GAUNTLET"
                className="tertiary"
                color="Y"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </div>
            {/* </Link> */}
            <Link
              className="home-button"
              to="/stacktadium"
              onClick={() => {
                audioManager.playSFX('cheer');
              }}
              onMouseEnter={() => this.setState({ hoverNav: 'stacktadium3' })}
            >
              <Button
                text="STACKTADIUM"
                className="tertiary"
                color="R"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>
            {/* <Button
              text="VERSUS"
              className="tertiary"
              color="B"
              height={50}
              width={'100%'}
              disabled={false}
              backgroundColorOverride="#11111188"
            /> */}
            <Link
              className="home-button"
              to="/leaderboard"
              onMouseEnter={() => this.setState({ hoverNav: 'leaderboard2' })}
            >
              <Button
                text="LEADERBOARD"
                className="tertiary"
                color="V"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>
            <Link
              className="home-button"
              to="/quickplay"
              onMouseEnter={() => this.setState({ hoverNav: 'quickplay' })}
            >
              <Button
                text="QUICKPLAY"
                className="tertiary"
                color="B"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="linear-gradient(135deg, #00c6ff, #0072ff)"
              />
            </Link>
            <Link
              className="home-button"
              to="/lexicon"
              onMouseEnter={() => this.setState({ hoverNav: 'lexicon' })}
            >
              <Button
                text="LEXICON"
                className="tertiary"
                color="G"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>
            <Link
              className="home-button"
              to="/manifest"
              onMouseEnter={() => this.setState({ hoverNav: 'manifest2' })}
            >
              <Button
                text="MANIFEST"
                className="tertiary"
                color="O"
                height={50}
                width={'100%'}
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>
            <div onMouseEnter={() => this.setState({ hoverNav: 'logout' })}>
              <Button
                text="LOGOUT"
                className="tertiary"
                color="R"
                height={50}
                width={'100%'}
                disabled={false}
                onClick={() => {
                  audioManager.playSFX('impact');
                  this.setState({ fadeOut: true });
                  setTimeout(() => {
                    this.props.logoutUser();
                    this.props.navigate('/login');
                  }, 300);
                }}
                backgroundColorOverride="#11111188"
              />
            </div>
            <GlobalVolumeControl />
          </div>
          <div className="image-description">
            {/* <div className="welcome">
              Welcome, {this.props.auth.user.username}
            </div> */}
            <img
              className="hover-image"
              src={`/assets/dashboard/${this.state.hoverNav}.webp`}
              alt={this.state.hoverNav}
            />
            <div className="menu-item-description">
              {
                this.state.menuItemDescriptions[
                this.state
                  .hoverNav as keyof DashboardState['menuItemDescriptions']
                ]
              }
            </div>
          </div>
        </div>
        <img
          className="hover-image-full"
          src={`/assets/dashboard/${this.state.hoverNav}.webp`}
          alt={this.state.hoverNav}
        />
      </div>
    );
  }
}

function mapStateToProps({ auth }: { auth: object }) {
  return {
    auth,
  };
}

export const Dashboard = connect(mapStateToProps, {
  logoutUser,
})(withRouter(UnwrappedDashboard));
