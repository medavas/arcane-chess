import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { logoutUser } from '../../actions/authActions';
import { withRouter } from 'src/components/withRouter/withRouter';
import './Dashboard.scss';

import { audioManager } from 'src/utils/audio/AudioManager';
import GlobalVolumeControl from 'src/utils/audio/GlobalVolumeControl';

type DashboardProps = {
  auth: { user: { username: string } };
  navigate: (path: string) => void;
  logoutUser: () => void;
};
type DashboardState = {
  openSubKey: string | null;
  hoverKey: string;
  settingsOpen: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
};

/** Each key gets:
 *  - description: what to show in the desc rail
 *  - imageKey: which image to use for the hover art (parents for subs)
 */
const NAV_META: Record<string, { description: string; imageKey: string }> = {
  // Primary
  campaign1: {
    description: 'Collect arcana. Defeat bosses. Climb ranks.',
    imageKey: 'campaign1',
  },
  lexicon: {
    description: 'Reference rules, tactics, and lore.',
    imageKey: 'lexicon',
  },
  leaderboard2: {
    description: 'Global rankings and ladders.',
    imageKey: 'leaderboard2',
  },
  // Arena (parent + subs share the ARENA image)
  arena: {
    description: 'Battle modes vs the engine.',
    imageKey: 'quickplay',
  },
  quickplay: {
    description:
      'Master the arcana and challenge the engine with custom battles.',
    imageKey: 'quickplay',
  },
  gauntlet: {
    description: 'Draft an army. Survive waves. Coming soon.',
    imageKey: 'arena',
  },
  skirmish: {
    description: 'Faction matchups with custom spells.',
    imageKey: 'arena',
  },
  melee: {
    description: 'Quickplay from a shared arcana pool. Coming soon.',
    imageKey: 'arena',
  },
  // Forum (parent uses forum image; no visible subs yet)
  forum: {
    description: 'Community news and discussions. Coming soon.',
    imageKey: 'forum',
  },
  // Manifest (parent + subs share the MANIFEST image)
  manifest2: {
    description: 'Pieces, spells, and site info.',
    imageKey: 'manifest2',
  },
  about: {
    description: 'About, mission, terms.',
    imageKey: 'manifest2',
  },
  pieces: {
    description: 'View all classic and new units.',
    imageKey: 'manifest2',
  },
  arcana: {
    description: 'Spell Chess details.',
    imageKey: 'manifest2',
  },
  // Right rail
  settings: {
    description: 'Profile, preferences, UI.',
    imageKey: 'settings',
  },
  logout: {
    description: 'Save progress and sign out.',
    imageKey: 'logout',
  },
};

export class UnwrappedDashboard extends React.Component<
  DashboardProps,
  DashboardState
> {
  rootRef: React.RefObject<HTMLDivElement>;
  constructor(props: DashboardProps) {
    super(props);
    this.state = {
      openSubKey: null,
      hoverKey: '',
      settingsOpen: false,
      fadeIn: false,
      fadeOut: false,
    };
    this.toggleSub = this.toggleSub.bind(this);
    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.rootRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ fadeIn: true });
    }, 50);

    document.addEventListener('mousedown', this.handleGlobalClick);
    document.addEventListener('keydown', this.handleEscape);
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleEscape);
  }

  handleGlobalClick(e: MouseEvent) {
    if (!this.rootRef.current) return;
    if (!this.rootRef.current.contains(e.target as Node)) {
      this.setState({ openSubKey: null });
    }
  }
  handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.setState({ openSubKey: null });
  };
  toggleSub(key: string) {
    this.setState((prev) => ({
      openSubKey: prev.openSubKey === key ? null : key,
    }));
  }

  setHover = (key: string) => this.setState({ hoverKey: key });

  render() {
    const { openSubKey, hoverKey } = this.state;
    // const imageKey = (hoverKey && NAV_META[hoverKey]?.imageKey) || 'campaign1'; // default fallback
    const desc = (hoverKey && NAV_META[hoverKey]?.description) || '';

    /*
“transmissions” / “codex”

“channels”:

1. “developer log”
2. “philosophy”
3. “lore”
4. “announcements”
5. “community”
6. “patches”
7. “general blog”
    */

    return (
      <div
        className={`dashboard ${this.state.fadeIn ? 'fade-in' : ''} ${
          this.state.fadeOut ? 'fade-out' : ''
        }`}
        ref={this.rootRef}
      >
        <div className={`fade-overlay ${this.state.fadeOut ? 'active' : ''}`} />
        <div className="dashboard-header">
          <div className="header-icons">
            <Link
              className="home-button"
              to="/"
              onMouseEnter={() => this.setHover('')}
            >
              <img className="logo" src="/assets/logoall+.png" alt="" />
            </Link>
            {/* <img className="avatar" src="/assets/avatars/normal.webp" alt="" /> */}
          </div>

          <div className="xp-panel">
            <div className="xp-left">
              <div className="xp-user">{this.props.auth.user.username}</div>
              {/* <div className="xp-stats">
                <div className="xp-points">XP 1,240</div>
                <div className="xp-level">LV 12</div>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: '45%' }} />
              </div> */}
            </div>
            {/* <img
              className="avatar-inline"
              src="/assets/avatars/normal.webp"
              alt=""
            /> */}
          </div>

          <div className="nav-right">
            <div className="right-actions">
              {/* <Link
                className="nav-item"
                to="/settings"
                onMouseEnter={() => this.setHover('settings')}
                onFocus={() => this.setHover('settings')}
              > */}
              <div
                className="nav-item"
                onClick={() => {
                  this.setState({
                    settingsOpen: this.state.settingsOpen ? false : true,
                  });
                }}
                onMouseEnter={() => this.setHover('settings')}
                onFocus={() => this.setHover('settings')}
              >
                SETTINGS
              </div>
              {this.state.settingsOpen && <GlobalVolumeControl />}
              <div
                className="nav-item"
                onMouseEnter={() => this.setHover('logout')}
                onFocus={() => this.setHover('logout')}
                onClick={() => {
                  audioManager.playSFX('impact');
                  this.setState({ fadeOut: true });
                  setTimeout(() => {
                    this.props.logoutUser();
                    this.props.navigate('/login');
                  }, 300);
                }}
              >
                LOGOUT
              </div>
            </div>
            <div className="desc-rail" aria-live="polite">
              {desc}
            </div>
          </div>
          <div
            className="nav-left"
            onClick={() => this.setState({ openSubKey: null })}
          >
            <Link
              className="nav-link"
              to="/campaign"
              onMouseEnter={() => this.setHover('campaign1')}
              onFocus={() => this.setHover('campaign1')}
            >
              <button
                className="nav-btn"
                aria-expanded={openSubKey === 'CAMPAIGN'}
              >
                CAMPAIGN
              </button>
            </Link>

            <Link
              className="nav-link"
              to="/leaderboard"
              onMouseEnter={() => this.setHover('leaderboard2')}
              onFocus={() => this.setHover('leaderboard2')}
            >
              <button
                className="nav-btn"
                aria-expanded={openSubKey === 'RANKINGS'}
              >
                RANKINGS
              </button>
            </Link>

            <Link
              className="nav-link"
              to="/lexicon"
              onMouseEnter={() => this.setHover('lexicon')}
              onFocus={() => this.setHover('lexicon')}
            >
              <button
                className="nav-btn"
                aria-expanded={openSubKey === 'LEXICON'}
              >
                LEXICON
              </button>
            </Link>
            <div
              className={`nav-item has-sub ${
                openSubKey === 'ARENA' ? 'open' : ''
              }`}
              onMouseEnter={() => this.setHover('arena')}
            >
              <button
                className="nav-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  this.toggleSub('ARENA');
                }}
                aria-expanded={openSubKey === 'ARENA'}
                aria-controls="submenu-arena"
              >
                ARENA
              </button>
              <div
                id="submenu-arena"
                className="sub-menu"
                role="region"
                aria-label="Arena submenu"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  to="/skirmish"
                  onMouseEnter={() => this.setHover('skirmish')}
                  onFocus={() => this.setHover('skirmish')}
                >
                  SKIRMISH
                </Link>
                <Link
                  to="/quickplay"
                  onMouseEnter={() => this.setHover('quickplay')}
                  onFocus={() => this.setHover('quickplay')}
                >
                  QUICKPLAY
                </Link>
                <Link
                  // to="/gauntlet"
                  to="#"
                  onClick={(e) => e.preventDefault()}
                  onMouseEnter={() => this.setHover('gauntlet')}
                  onFocus={() => this.setHover('gauntlet')}
                >
                  GAUNTLET
                </Link>
                <Link
                  // to="/melee"
                  to="#"
                  onClick={(e) => e.preventDefault()}
                  onMouseEnter={() => this.setHover('melee')}
                  onFocus={() => this.setHover('melee')}
                >
                  MELEE
                </Link>
              </div>
            </div>
            <div
              className={`nav-item has-sub ${
                openSubKey === 'FORUM' ? 'open' : ''
              }`}
              onMouseEnter={() => this.setHover('forum')}
              onFocus={() => this.setHover('forum')}
            >
              <button
                className="nav-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  this.toggleSub('FORUM');
                }}
                aria-expanded={openSubKey === 'FORUM'}
              >
                FORUM
              </button>
              <div
                id="submenu-forum"
                className="sub-menu"
                role="region"
                onClick={(e) => e.stopPropagation()}
              ></div>
            </div>
            <div
              className={`nav-item has-sub ${
                openSubKey === 'MANIFEST' ? 'open' : ''
              }`}
              onMouseEnter={() => this.setHover('manifest2')}
              onFocus={() => this.setHover('manifest2')}
            >
              <button
                className="nav-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  this.toggleSub('MANIFEST');
                }}
                aria-expanded={openSubKey === 'MANIFEST'}
              >
                MANIFEST
              </button>
              <div
                id="submenu-manifest"
                className="sub-menu"
                role="region"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  to="/manifest?tab=about"
                  onMouseEnter={() => this.setHover('about')}
                  onFocus={() => this.setHover('about')}
                >
                  ABOUT
                </Link>
                <Link
                  to="/manifest?tab=pieces"
                  onMouseEnter={() => this.setHover('pieces')}
                  onFocus={() => this.setHover('pieces')}
                >
                  PIECES
                </Link>
                <Link
                  to="/manifest?tab=arcana"
                  onMouseEnter={() => this.setHover('arcana')}
                  onFocus={() => this.setHover('arcana')}
                >
                  ARCANA
                </Link>
              </div>
            </div>
          </div>
          {/* {imageKey && (
            <img
              className="hover-image"
              src={`/assets/dashboard/${imageKey}.webp`}
              alt={hoverKey || 'hover-art'}
            />
          )} */}
        </div>
        <div className="dashboard-body">
          <div className="news">
            <h1 className="news-title">Transmissions</h1>
            <div className="news-item">
              <h4>
                Removal of AI-Generated Content
                <h6>Source: medavas</h6>
                <h6>Date: October 2025</h6>
                <h6>Category: Announcements</h6>
              </h4>
              <ul>
                <li>
                  After a long thought, I have decided to take AI-generated
                  images and story down, as it no longer aligned with my values.
                  A few thoughts came with this decision.
                </li>
                <li>
                  It was too busy for the site. I wanted to make sure the main
                  focus was Spell Chess, and the values we take away from the
                  general game of Chess itself.
                </li>
                <li>
                  While using a generator to make my vision come to life was fun
                  and satisfying, I did not want to encourage taking market
                  value away from self-made artists. Imagination belongs to
                  humans, let us not outsource it.
                </li>
                <li>
                  There still remains a complete story that I created by hand.
                  My intent was to tell it alongside the campaign mode, but I
                  wanted to tell it in the right way.
                </li>
                <li>Your mind is the armory, use your imagination.</li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.5 Live: Hexweaver Update, Mana, Pawn Update
                <h6>Source: medavas</h6>
                <h6>Date: September 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>
                  Fog of war square condition summons hides friendly pieces from
                  your opponent. Hexweaver Scepter: a powerful square condition
                  summon.
                </li>
                <li>
                  Mana: unlockable time slots. Arcana in your inventory unlock
                  incrementally after a certain number of turns automatically.
                  Less overwhelming and promotes resource management.
                </li>
                <li>
                  New default rule: No spell required - now on by default, any
                  2-step Pawn move can move through a piece on that Pawns{"'"}s
                  first turn.
                </li>
                <li>
                  New Spell: Aether Surge - Friendly Pawns can capture on the
                  first-turn, 2-square move.
                </li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Skirmish: Faction Chess Now Live
                <h6>Source: medavas</h6>
                <h6>Date: September 2025</h6>
                <h6>Category: Announcements</h6>
              </h4>
              <ul>
                <li>Discover a new metagame</li>
                <li>Arena &gt; Skirmish &gt; choose a faction &gt; START!</li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.4 Live: More Shifts and Offers
                <h6>Source: medavas</h6>
                <h6>Date: August 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>More alternate movesets for more pieces</li>
                <li>More comprehensive gifts on piece offerings</li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.3 Live: Offers and Mods
                <h6>Source: medavas</h6>
                <h6>Date: June 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>Offer: sacrifice a piece for a greater spells</li>
                <li>Gluttony: capture on dyad moves</li>
                <li>Sixfold Silk: capture entangled pieces</li>
                <li>Trojan Gambit: must capture on en passant</li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.2 Live: Dyads and Herrings
                <h6>Source: medavas</h6>
                <h6>Date: February 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>Dyads: move twice in one move</li>
                <li>Herring: must be captured if attacked</li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.1 Live: New Units
                <h6>Source: medavas</h6>
                <h6>Date: September 2024</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>Equus Piece Family: Zebra and Unicorn</li>
                <li>Ghost Piece Family: Spectre and Wraith</li>
                <li>Royalty Piece Family: Mystic, Templar, Valkyrie</li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.0 Live: Spells
                <h6>Source: medavas</h6>
                <h6>Date: August 2024</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>Summon Units</li>
                <li>Summon Exile: a blocked off square</li>
                <li>
                  Square Conditions: move like a queen on that square or
                  entangle a piece
                </li>
                <li>Swap Units: adjacent or deploy a different fighter</li>
                <li>Shifts: alternate movesets</li>
                <li>
                  General modifications: promote one rank early, move through
                  check, and more
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="dashboard-footer"></div>
      </div>
    );
  }
}

function mapStateToProps({ auth }: { auth: any }) {
  return { auth };
}
export const Dashboard = connect(mapStateToProps, { logoutUser })(
  withRouter(UnwrappedDashboard)
);
