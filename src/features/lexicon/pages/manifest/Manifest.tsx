import React from 'react';
import Button from 'src/shared/components/Button/Button';
import { Link } from 'react-router-dom';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import './Manifest.scss';

import { audioManager } from 'src/shared/utils/audio/AudioManager';

import ArcanaList from 'src/features/lexicon/pages/manifest/ArcanaList';
import PieceList from 'src/features/lexicon/pages/manifest/PieceList';

type State = {
  currentTab: string;
};

type RouterishProps = {
  // Your withRouter HOC may (or may not) inject these:
  location?: { pathname: string; search: string };
  navigate?: (to: string, opts?: { replace?: boolean }) => void;
};

const ALLOWED_TABS = new Set([
  'about',
  'pieces',
  'arcana',
  'tos',
  'privacy',
  'mission',
]);
const DEFAULT_TAB = 'about';

function getSearchFromPropsOrWindow(props?: RouterishProps) {
  return (
    props?.location?.search ??
    (typeof window !== 'undefined' ? window.location.search : '')
  );
}

function getPathnameFromPropsOrWindow(props?: RouterishProps) {
  return (
    props?.location?.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '/manifest')
  );
}

function readTabFromSearch(search: string): string {
  const params = new URLSearchParams(search ?? '');
  const raw = params.get('tab') || DEFAULT_TAB;
  return ALLOWED_TABS.has(raw) ? raw : DEFAULT_TAB;
}

function navigateOrPush(props: RouterishProps, url: string, replace = false) {
  if (props.navigate) {
    props.navigate(url, { replace });
  } else if (typeof window !== 'undefined') {
    if (replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
    // Manually dispatch a popstate-like update if needed; we rely on real popstate for back/forward.
  }
}

class UnwrappedManifest extends React.Component<RouterishProps, State> {
  constructor(props: RouterishProps) {
    super(props);
    const search = getSearchFromPropsOrWindow(props);
    this.state = { currentTab: readTabFromSearch(search) };
  }

  componentDidMount(): void {
    audioManager.stopMusic('menu');

    // Keep tab in sync with browser back/forward even if router props are missing
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState);
    }

    // Optional: ensure URL always has ?tab=... even on first load without one
    const search = getSearchFromPropsOrWindow(this.props);
    const pathname = getPathnameFromPropsOrWindow(this.props);
    const params = new URLSearchParams(search);
    if (!params.get('tab')) {
      params.set('tab', this.state.currentTab || DEFAULT_TAB);
      navigateOrPush(this.props, `${pathname}?${params.toString()}`, true);
    }
  }

  componentWillUnmount(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState);
    }
  }

  componentDidUpdate(prevProps: RouterishProps) {
    // If router does provide location and it changed, sync tab
    const prevSearch = getSearchFromPropsOrWindow(prevProps);
    const nextSearch = getSearchFromPropsOrWindow(this.props);
    if (prevSearch !== nextSearch) {
      const nextTab = readTabFromSearch(nextSearch);
      if (nextTab !== this.state.currentTab) {
        this.setState({ currentTab: nextTab });
      }
    }
  }

  handlePopState = () => {
    const search = getSearchFromPropsOrWindow(this.props);
    const tab = readTabFromSearch(search);
    if (tab !== this.state.currentTab) {
      this.setState({ currentTab: tab });
    }
  };

  changeTab = (tab: string) => {
    const safeTab = ALLOWED_TABS.has(tab) ? tab : DEFAULT_TAB;
    const pathname = getPathnameFromPropsOrWindow(this.props);
    const currentSearch = getSearchFromPropsOrWindow(this.props);
    const params = new URLSearchParams(currentSearch);
    params.set('tab', safeTab);
    navigateOrPush(this.props, `${pathname}?${params.toString()}`, false);
    this.setState({ currentTab: safeTab });
  };

  render() {
    return (
      <div className="manifest">
        <div className="container">
          <div className="nav">
            <Link to="/">
              <Button
                text="BACK"
                className="tertiary"
                color="S"
                width={160}
                height={50}
                disabled={false}
              />
            </Link>
            <Button
              text="ABOUT"
              className="tertiary"
              onClick={() => this.changeTab('about')}
              color="S"
              width={160}
              height={50}
              disabled={false}
            />
            <Button
              text="PIECES"
              className="tertiary"
              onClick={() => this.changeTab('pieces')}
              color="S"
              width={160}
              height={50}
              disabled={false}
            />
            <Button
              text="ARCANA"
              className="tertiary"
              onClick={() => this.changeTab('arcana')}
              color="S"
              width={160}
              height={50}
              disabled={false}
            />
            <Button
              text="TOS"
              className="tertiary"
              onClick={() => this.changeTab('tos')}
              color="S"
              width={160}
              height={50}
              disabled={false}
            />
            <Button
              text="PRIVACY"
              className="tertiary"
              onClick={() => this.changeTab('privacy')}
              color="S"
              width={160}
              height={50}
              disabled={false}
            />
          </div>

          <div className="content">
            {this.state.currentTab === 'mission' ? (
              <div id="mission" className="mission">
                {/* Mission content */}
              </div>
            ) : this.state.currentTab === 'about' ? (
              <div id="about" className="about">
                <h2>About the Project:</h2>
                <p>
                  The concept for this project was first envisioned in 2017 with
                  a mission to create a powerful chess platform that fosters
                  both technical excellence and creative exploration. As an
                  open-source initiative, it is licensed under the GPL 3. (learn
                  more about{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://greendrake.info/publications/js-gpl"
                  >
                    JavaScript and the GPL
                  </a>
                  ), ensuring that the project remains free for all to use,
                  modify, and contribute to.
                </p>
                <p>
                  Key dependencies include{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/gbtami/chessgroundx"
                  >
                    Chessgroundx
                  </a>
                  , which powers the interactive board, and{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://database.lichess.org/"
                  >
                    the amazing puzzle database
                  </a>{' '}
                  from{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://lichess.org"
                  >
                    Lichess
                  </a>
                  , providing an extensive collection of tagged, themed, and
                  rated puzzles to challenge and engage users. The engine
                  theory, brought to life through{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.chessprogramming.org/BlueFeverSoft"
                  >
                    BlueFever Programming
                  </a>
                  , is integral to the platform{"'"}s performance. Lastly,
                  special thanks to the{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.chessvariants.com/graphics.dir/svg/alfaerie/"
                  >
                    Chess Variants website resource
                  </a>{' '}
                  for providing a consistent set of fairy chess piece images,
                  and{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://game-icons.net/"
                  >
                    Game Icons
                  </a>{' '}
                  for additional graphical elements used in the project.
                </p>
                <p>
                  While the platform is free to use, we welcome donations to
                  support ongoing server costs and development efforts. These
                  contributions enable us to maintain and improve the platform,
                  ensuring it continues to serve the global chess community
                  effectively.
                </p>
                <h2 style={{ marginTop: '30px' }}>Mission Statements:</h2>
                <ol style={{ listStyleType: 'decimal' }}>
                  <li>
                    Shift Chess from opening theory to metagame through creative
                    exploration.
                  </li>
                  <li>
                    Teach the philosophy behind play, balance, and
                    decision-making.
                  </li>
                  <li>
                    Experiment with balance through an evolving system of spells
                    and mechanics.
                  </li>
                  <li>
                    Build an open-source community of thinkers, creators, and
                    players.
                  </li>
                  <li>
                    Redefine chess as a living experiment in imagination and
                    logic.
                  </li>
                </ol>
                <div id="links" className="links">
                  <div className="link">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://discord.gg/QuuNv3Gqts"
                    >
                      <Button
                        text="DISCORD"
                        className="secondary"
                        color="S"
                        width={200}
                        height={50}
                        disabled={false}
                      />
                    </a>
                  </div>
                  <div className="link">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://x.com/tactorius"
                    >
                      <Button
                        text="X"
                        className="secondary"
                        color="S"
                        width={200}
                        height={50}
                        disabled={false}
                      />
                    </a>
                  </div>
                  <div className="link">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://paypal.me/tactorius?country.x=US&locale.x=en_US"
                    >
                      <Button
                        text="PAYPAL"
                        className="secondary"
                        color="S"
                        width={200}
                        height={50}
                        disabled={false}
                      />
                    </a>
                  </div>
                  <div className="link">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://github.com/medavas/arcane-chess"
                    >
                      <Button
                        text="PROJECT REPO"
                        className="secondary"
                        color="S"
                        width={200}
                        height={50}
                        disabled={false}
                      />
                    </a>
                  </div>
                  <div className="link">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://github.com/medavas/night-chess-ui-2"
                    >
                      <Button
                        text="CHESSGROUNDx FORK"
                        className="secondary"
                        color="S"
                        width={200}
                        height={50}
                        disabled={false}
                      />
                    </a>
                  </div>
                </div>
              </div>
            ) : this.state.currentTab === 'pieces' ? (
              <div>
                <div className="pieces">
                  <PieceList />
                </div>
              </div>
            ) : this.state.currentTab === 'arcana' ? (
              <div>
                <div className="arcana">
                  <ArcanaList />
                </div>
              </div>
            ) : this.state.currentTab === 'tos' ? (
              <div id="tos" className="tos">
                <h2>Terms of Service</h2>
                <ul>
                  <li>
                    <strong>Do not cheat</strong> or receive assistance in any
                    player vs. player games (from a chess computer, book,
                    database, or another person).
                  </li>
                  <li>
                    <strong>Be nice</strong> and courteous to all other players,
                    always.
                  </li>
                  <li>
                    <strong>Don{"'"}t do bad things</strong> or break any laws.
                  </li>
                </ul>
              </div>
            ) : this.state.currentTab === 'privacy' ? (
              <div id="privacy" className="privacy">
                <h2>Privacy Policy</h2>
                <p>
                  <strong>Last updated:</strong> September 2, 2024
                </p>
                <h5>1. Introduction</h5>
                <p>
                  Welcome to Tactorius. We are committed to protecting your
                  personal information and your right to privacy. This Privacy
                  Policy explains how we collect, use, and safeguard your
                  information when you use our application.
                </p>
                <h5>2. Information We Collect</h5>
                <p>
                  We collect the following personal information when you use our
                  app:
                </p>
                <ul>
                  <li>Username</li>
                  <li>Email Address</li>
                  <li>Password</li>
                </ul>
                <h5>3. How We Use Your Information</h5>
                <p>
                  We use the information we collect for the following purposes:
                </p>
                <ul>
                  <li>
                    Account Creation and Authentication: To create and manage
                    your account on our app
                  </li>
                  <li>
                    Communication: To send you updates, notifications, and other
                    relevant information related to your account or our services
                  </li>
                </ul>
                <h5>4. How We Protect Your Information</h5>
                <p>
                  We implement industry-standard security measures to protect
                  your personal information. However, please be aware that no
                  security system is impenetrable. We cannot guarantee the
                  absolute security of your information.
                </p>
                <h5>5. Sharing Your Information</h5>
                <p>
                  We do not share, sell, or rent your personal information to
                  third parties. Your data is solely used to provide and improve
                  our services.
                </p>
                <h5>6. Your Rights</h5>
                <p>
                  Depending on your location, you may have certain rights
                  regarding your personal information, such as the right to
                  access, correct, or delete your data. If you wish to exercise
                  any of these rights, please contact us at{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="mailto:tactoriusofficial@gmail.com"
                  >
                    tactoriusofficial@gmail.com
                  </a>
                  .
                </p>
                <h5>7. Changes to This Privacy Policy</h5>
                <p>
                  We may update this Privacy Policy from time to time. Any
                  changes will be posted on this page, and the Last updated date
                  at the top will be revised. We encourage you to review this
                  Privacy Policy periodically to stay informed about how we are
                  protecting your information.
                </p>
                <h5>8. Contact Us</h5>
                <p>
                  If you have any questions about this Privacy Policy, please
                  contact us at{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="mailto:tactoriusofficial@gmail.com"
                  >
                    tactoriusofficial@gmail.com
                  </a>
                  .
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="manifest-curtain"></div>
        {/* <img
          className="manifest-image-full"
          src={`/assets/dashboard/manifest2.webp`}
          alt={`manifest`}
        /> */}
      </div>
    );
  }
}

export const Manifest = withRouter(UnwrappedManifest);
