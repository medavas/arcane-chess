import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { logoutUser } from 'src/features/auth/store/authActions';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import './Dashboard.scss';

import { audioManager } from 'src/shared/utils/audio/AudioManager';
import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';
import Button from 'src/shared/components/Button/Button';

type DashboardProps = {
  auth: { user: { username: string } };
  navigate: (path: string) => void;
  logoutUser: () => void;
};
type DashboardState = {
  hoverKey: string;
  fadeIn: boolean;
  fadeOut: boolean;
};

/** Each key gets:
 *  - description: what to show in the desc rail
 *  - imageKey: which image to use for the hover art
 */
const NAV_META: Record<string, { description: string; imageKey: string }> = {
  campaign1: {
    description: 'Collect arcana. Defeat bosses. Climb ranks.',
    imageKey: 'campaign1',
  },
  leaderboard2: {
    description: 'Global rankings and ladders.',
    imageKey: 'leaderboard2',
  },
  lexicon: {
    description: 'Reference rules, tactics, and lore.',
    imageKey: 'lexicon',
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
  quickplay: {
    description:
      'Master the arcana and challenge the engine with custom battles.',
    imageKey: 'quickplay',
  },
  forum: {
    description: 'Community news and discussions. Coming soon.',
    imageKey: 'forum',
  },
  manifest2: {
    description: 'Pieces, spells, and site info.',
    imageKey: 'manifest2',
  },
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
      hoverKey: '',
      fadeIn: false,
      fadeOut: false,
    };
    this.rootRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ fadeIn: true });
    }, 50);
  }

  setHover = (key: string) => this.setState({ hoverKey: key });

  render() {
    const { hoverKey } = this.state;
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
              <GlobalVolumeControl />
              <Button
                text="LOGOUT"
                className="tertiary"
                color="R"
                height={50}
                width="100%"
                disabled={false}
                onClick={() => {
                  audioManager.playSFX('impact');
                  this.setState({ fadeOut: true });
                  setTimeout(() => {
                    this.props.logoutUser();
                    this.props.navigate('/login');
                  }, 300);
                }}
                onMouseEnter={() => this.setHover('logout')}
                backgroundColorOverride="#11111188"
              />
            </div>
            <div className="desc-rail" aria-live="polite">
              {desc}
            </div>
          </div>
          <div className="nav-grid">
            <Link
              className="nav-link"
              to="/campaign"
              onMouseEnter={() => this.setHover('campaign1')}
              onFocus={() => this.setHover('campaign1')}
            >
              <Button
                text="CAMPAIGN"
                className="tertiary"
                color="B"
                height={50}
                width="100%"
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>

            <Link
              className="nav-link"
              to="/leaderboard"
              onMouseEnter={() => this.setHover('leaderboard2')}
              onFocus={() => this.setHover('leaderboard2')}
            >
              <Button
                text="RANKINGS"
                className="tertiary"
                color="V"
                height={50}
                width="100%"
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>

            <Link
              className="nav-link"
              to="/lexicon"
              onMouseEnter={() => this.setHover('lexicon')}
              onFocus={() => this.setHover('lexicon')}
            >
              <Button
                text="LEXICON"
                className="tertiary"
                color="G"
                height={50}
                width="100%"
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>

            {/* <div
              className="nav-link"
              onMouseEnter={() => this.setHover('gauntlet')}
              onFocus={() => this.setHover('gauntlet')}
            >
              <Button
                text="GAUNTLET"
                className="tertiary"
                color="Y"
                height={50}
                width="100%"
                disabled={true}
                backgroundColorOverride="#11111188"
              />
            </div> */}

            <Link
              className="nav-link"
              to="/skirmish"
              onMouseEnter={() => this.setHover('skirmish')}
              onFocus={() => this.setHover('skirmish')}
            >
              <Button
                text="SKIRMISH"
                className="tertiary"
                color="R"
                height={50}
                width="100%"
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>

            {/* <div
              className="nav-link"
              onMouseEnter={() => this.setHover('melee')}
              onFocus={() => this.setHover('melee')}
            >
              <Button
                text="MELEE"
                className="tertiary"
                color="O"
                height={50}
                width="100%"
                disabled={true}
                backgroundColorOverride="#11111188"
              />
            </div> */}

            <Link
              className="nav-link"
              to="/quickplay"
              onMouseEnter={() => this.setHover('quickplay')}
              onFocus={() => this.setHover('quickplay')}
            >
              <Button
                text="QUICKPLAY"
                className="tertiary"
                color="B"
                height={50}
                width="100%"
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>

            {/* <div
              className="nav-link"
              onMouseEnter={() => this.setHover('forum')}
              onFocus={() => this.setHover('forum')}
            >
              <Button
                text="FORUM"
                className="tertiary"
                color="G"
                height={50}
                width="100%"
                disabled={true}
                backgroundColorOverride="#11111188"
              />
            </div> */}

            <Link
              className="nav-link"
              to="/manifest"
              onMouseEnter={() => this.setHover('manifest2')}
              onFocus={() => this.setHover('manifest2')}
            >
              <Button
                text="MANIFEST"
                className="tertiary"
                color="O"
                height={50}
                width="100%"
                disabled={false}
                backgroundColorOverride="#11111188"
              />
            </Link>
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
                Patch 3.0 Live: Skirmish Archetypes, Spell Balance Update
                <h6>Source: medavas</h6>
                <h6>Date: December 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>
                  <strong>Archetype Exposition in Skirmish:</strong> Each
                  faction archetype now displays its strategic identity -
                  explore Gladiators who dominate with powerful units, Mages who
                  master entanglement zones, Priests who summon vast
                  reinforcements, and more unique playstyles.
                </li>
                <li>
                  <strong>Arcana Unlock Acceleration:</strong> Arcana now
                  unlocks every 5 turns instead of 6, granting faster access to
                  your spellbook and creating more dynamic mid-game scenarios.
                </li>
                <li>
                  <strong>Offering Spells Removed:</strong> The offering-type
                  spell mechanic has been removed from the game to streamline
                  spell interactions.
                </li>
                <li>
                  <strong>&quot;Gain&quot; Spells Expanded:</strong> New
                  tactical gain mechanics reward strategic positions - achieve
                  pins, forks, outposts, or multiple checks to the opposing King
                  to gain dyad arcana.
                </li>
                <li>
                  <strong>Spell Arsenal Additions:</strong>
                  <ul>
                    <li>
                      Reincarnate - When consuming a friendly piece with Jaws of
                      Betrayal, it returns as a summon arcana.
                    </li>
                    <li>
                      Berserking Evolution - The next move evolves your piece
                      along with the move (P→N→R, ZUB→R→W, etc).
                    </li>
                    <li>
                      Trample - Eliminate an opponent&apos;s piece attacked by
                      your Equus units without moving.
                    </li>
                    <li>
                      Blitz - Your pawns push opposing pawns back one space,
                      creating unstoppable momentum.
                    </li>
                    <li>
                      Flank Inversion - Swap all pieces on the A and H files in
                      one dramatic repositioning.
                    </li>
                    <li>
                      Doppleganger - Random spell replacement at game start with
                      varying impact levels.
                    </li>
                    <li>
                      Magnet - Pull pieces toward a target square from 2-7
                      spaces away orthogonally.
                    </li>
                    <li>
                      Reduction - Limit enemy slider range from 7 to 3 squares
                      for 4 turns.
                    </li>
                    <li>
                      Reflect Attack - Bishops bounce off board edges for
                      unexpected angles.
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.9 Live: Ghost of Christmas Future Update
                <h6>Source: medavas</h6>
                <h6>Date: December 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>
                  The future is scary but we must look ahead. To remind you of
                  that, I have added two new, wandering, robed unit types that
                  stack on top of the Herring - The Hermit and The Hemlock.
                </li>
                <li>
                  The Hermit casts an aura of square conditions around it.
                </li>
                <li>
                  The Hemlock is an invisible unit, don&apos;t lose track of it!
                  It has a far reaching move pattern - like a super Knight. It
                  can hop to the other side of the board too!
                </li>
                <li>
                  Bulletproof - when this is active you can now check or
                  promote, no captures allowed.
                </li>
                <li>5 Dimensional Sword - Capture on shifts.</li>
                <li>
                  Disarmament - new square condition, a piece on an affected
                  square may not make any captures
                </li>
                <li>
                  Hexlash - when certain friendly units are captured, the square
                  gains entanglement conditon
                </li>
                <li>
                  Glare - any enemy piece a Rook attacks gains Disarmament
                </li>
                <li>Area of Effect - different auras for Hermit ability</li>
                <li>
                  Token Modifiers (Hermit and Hemlock) - Modifies Herring unit
                </li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                UI Overhaul and Skirmish Metagame Update
                <h6>Source: medavas</h6>
                <h6>Date: December 2025</h6>
                <h6>Category: Announcements</h6>
              </h4>
              <ul>
                <li>
                  New, consistent UI across the site with more responsive
                  designs.
                </li>
                <li>
                  The board UI has indicators for pieces that have alternate
                  move patterns so you aren&apos;t caught off guard when a
                  Knight moves like a King. Square destinations have different
                  coloring to let you know when you are about to use a limited
                  arcane.
                </li>
                <li>
                  Check out Skirmish, factions have a better variety of spells
                  for more dynamic, interesting play. Explore!
                </li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.8 Live: Turkey Bowl Update
                <h6>Source: medavas</h6>
                <h6>Date: November 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>
                  Football season is here, so I&apos;ve added a few
                  &quot;touchdown&quot; related arcana.
                </li>
                <li>
                  Divine Reckoning - when one of your Pawns reach the back rank,
                  it promotes automatically to a Valkyrie with Iron Reach.
                </li>
                <li>
                  Reckoning Variants (gain) - when one of your minor pieces
                  reach the back rank, you get a reward.
                </li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.7 Live: Halloween Update
                <h6>Source: medavas</h6>
                <h6>Date: October 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>
                  In honor of spooky season, three new arcana have been added
                  that explore themes of death and the afterlife. Memento mori,
                  amor fati. 💀
                </li>
                <li>
                  Letum (mori) - Various effects happen per spell when your
                  pieces are captured.
                </li>
                <li>
                  Nex (mora) - Various effects happen per spell when you capture
                  pieces.
                </li>
                <li>
                  Moveable Exile - Each side can summon their own block unit
                  that moves in a special move pattern. It can not capture or be
                  captured.
                </li>
              </ul>
            </div>
            <div className="news-item">
              <h4>
                Patch 2.6 Live: Alternate Moveset Update
                <h6>Source: medavas</h6>
                <h6>Date: October 2025</h6>
                <h6>Category: Mechanics</h6>
              </h4>
              <ul>
                <li>
                  Quality of life improvements – Board now highlights potential
                  moves that will use a shift arcana. Arcana charge bar -
                  countdown visual to next arcana unlock. Arcana badge visuals
                  updated.
                </li>
                <li>
                  Eclipse – Move through units and across the edge of the board.
                </li>
                <li>
                  Shogun – A powerful new update to the King: you can now check
                  the opposing King with your own.
                </li>
              </ul>
            </div>
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
                Patch 2.5 Live: Hexweaver Update, Arcana Charge, Pawn Update
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
                  Arcana Charge: unlockable time slots. Arcana in your spellBook
                  unlock incrementally after a certain number of turns
                  automatically. Less overwhelming and promotes resource
                  management.
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
                Patch 2.0 Live: Arcana (Spells)
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
