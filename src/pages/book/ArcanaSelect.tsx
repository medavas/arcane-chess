import React from 'react';
import _ from 'lodash';

import Button from 'src/components/Button/Button';

import { setLocalStorage, getLocalStorage } from 'src/utils/handleLocalStorage';

import arcanaJson from 'src/data/arcana.json';

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

interface ArcanaMap {
  [key: string]: ArcanaDetail;
}

interface ArcanaDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  imagePath: string;
}

interface ArcanaSelectProps {
  isPlayerArcana: boolean;
  auth: { user: { id: string; username: string } };
  engineArcana?: { [key: string]: number | string };
  isMission?: boolean;
  updateBookMultiplier: (value: number) => void;
  missionArcana?: { [key: string]: number | string };
  onToggleHover: (hoverArcane: string) => void;
}
interface ArcanaSelectState {
  hoverArcane: string;
  selectedArcana: {
    [key: string]: number;
  };
  allowedArcana: number;
  multiplier: number;
}

export const unlockableArcana = [
  // 1
  {
    sumnP: 1,
    dyadB: 1,
    shftP: 1,
    modsFUT: 2,
  },
  // 2
  {
    sumnN: 3,
    sumnU: 3,
    dyadC: 3,
    modsTRO: 2,
    offrC: 3,
    modsAET: 2,
  },
  // 3
  {
    sumnB: 3,
    sumnZ: 3,
    shftN: 3,
    offrE: 3,
  },
  // 4
  {
    sumnX: 3,
    sumnRE: 4,
    modsIMP: 2,
    modsFUG: 3,
    offrB: 7,
  },
  // 5
  {
    sumnR: 5,
    dyadF: 7,
    shftR: 4,
    modsORA: 4,
  },
  // 6
  {
    sumnM: 9,
    sumnRM: 6,
    dyadE: 8,
    modsCON: 4,
    sumnRZ: 5,
  },
  // 7
  {
    sumnT: 10,
    sumnRT: 6,
    shftB: 4,
    sumnRY: 5,
    offrH: 8,
  },
  // 8
  {
    sumnQ: 11,
    sumnRQ: 7,
    sumnRA: 6,
    offrF: 8,
    offrD: 6,
  },
  // 9
  {
    offrA: 5,
    offrG: 6,
    sumnH: 6,
    modsSUS: 4,
    modsINH: 7,
  },
  // 10
  {
    dyadD: 8,
    dyadA: 8,
    modsREA: 7,
    offrI: 1,
  },
  // 11
  {
    sumnW: 8,
    sumnS: 8,
    modsTEM: 6,
    modsEXT: 7,
    modsSIL: 10,
  },
  // 12
  {
    sumnV: 14,
    sumnRV: 13,
    modsGLI: 9,
    modsGLU: 9,
  },
];

export const allowedArcanaPerChapter = [0, 2, 2, 2, 4, 4, 4, 6, 6, 6, 8, 8, 8];

export default class ArcanaSelect extends React.Component<
  ArcanaSelectProps,
  ArcanaSelectState
> {
  constructor(props: ArcanaSelectProps) {
    super(props);
    const currLS = getLocalStorage(this.props.auth.user.username);
    this.state = {
      hoverArcane: '',
      selectedArcana: currLS.arcana || {},
      allowedArcana: allowedArcanaPerChapter[currLS.chapter],
      multiplier: currLS.config.multiplier,
    };
  }

  componentDidUpdate(prevProps: ArcanaSelectProps) {
    if (
      prevProps.auth.user.username !== this.props.auth.user.username ||
      prevProps.missionArcana !== this.props.missionArcana
    ) {
      const currLS = getLocalStorage(this.props.auth.user.username);
      this.setState({
        selectedArcana: currLS.arcana || {},
        allowedArcana: allowedArcanaPerChapter[currLS.chapter],
        multiplier: currLS.config.multiplier,
      });
    }
  }

  availableChapterArcana = () => {
    const chapter = getLocalStorage(this.props.auth.user.username).chapter;
    const unlockedArcana = unlockableArcana
      .slice(0, chapter)
      .reduce((acc, current) => {
        return { ...acc, ...current };
      }, {});
    return unlockedArcana;
  };

  handleMultiplierChange = (value: number) => {
    this.setState({
      multiplier: this.state.multiplier + value,
    });
    this.props.updateBookMultiplier(value);
  };

  handleArcanaClick = (key: string, value: number) => {
    const { selectedArcana, allowedArcana } = this.state;
    const { auth } = this.props;

    const meta = this.getArcana(key);
    if (!meta) return; // ← prevent crash if key missing

    const newSelectedArcana = { ...selectedArcana };
    const totalArcanaValue = Object.values(newSelectedArcana).reduce(
      (sum, count) => sum + count,
      0
    );

    if (meta.type === 'inherent' && selectedArcana[key]) return; // ← use meta
    if (totalArcanaValue >= allowedArcana) return;

    newSelectedArcana[key] = (newSelectedArcana[key] || 0) + 1;

    this.handleMultiplierChange(-value);
    this.setState({ selectedArcana: newSelectedArcana });

    setLocalStorage({
      ...getLocalStorage(auth.user.username),
      arcana: newSelectedArcana,
    });
  };

  handleClearArcana = () => {
    const { selectedArcana } = this.state;
    const { auth, missionArcana } = this.props;
    const arcanaObj: Record<string, number> =
      (Object.keys(missionArcana || {}).length !== 0
        ? missionArcana
        : this.availableChapterArcana()) || {};
    let multiplierAddBack = 0;
    Object.keys(selectedArcana).forEach((key) => {
      if (arcanaObj[key] !== undefined) {
        multiplierAddBack += arcanaObj[key] * selectedArcana[key];
      }
    });
    this.setState({
      selectedArcana: {},
      multiplier: this.state.multiplier + multiplierAddBack,
    });
    this.props.updateBookMultiplier(multiplierAddBack);
    setLocalStorage({
      ...getLocalStorage(auth.user.username),
      arcana: {},
    });
  };

  calculateArcanaScore = (LS: any) => {
    if (!unlockableArcana || !Array.isArray(unlockableArcana)) {
      console.error('unlockableArcana is undefined or not an array.');
      return 0;
    }

    const getTotalScore = (arcanaSet: any) => {
      let total = 0;

      unlockableArcana.forEach((arcanaData, index) => {
        if (!arcanaData || typeof arcanaData !== 'object') {
          console.warn(
            `Skipping invalid arcana set at index ${index}`,
            arcanaData
          );
          return;
        }

        Object.entries(arcanaData).forEach(([arcana, value]) => {
          if (arcanaSet && arcanaSet[arcana]) {
            total += arcanaSet[arcana] * value;
          }
        });
      });

      return total;
    };

    const totalLSArcanaScore = getTotalScore(LS?.arcana);
    const totalEngineArcanaScore = getTotalScore(this.props.engineArcana);

    return LS?.config?.color === 'white'
      ? totalLSArcanaScore - totalEngineArcanaScore
      : totalEngineArcanaScore - totalLSArcanaScore;
  };

  getArcana = (k: string) => (arcana && k in arcana ? arcana[k] : null);

  getBadgeText = (
    k: string,
    hasMissionArcana: boolean,
    missionArcana?: { [key: string]: number | string }
  ) => {
    const a = this.getArcana(k);
    if (a?.type === 'inherent') return 'INH';
    if (hasMissionArcana) return String(missionArcana?.[k] ?? '');
    const LS = getLocalStorage(this.props.auth.user.username);
    return String(LS?.arcana?.[k] ?? '');
  };

  render() {
    const { auth, isPlayerArcana, isMission, missionArcana } = this.props;
    const { hoverArcane, selectedArcana } = this.state;
    const LS = getLocalStorage(auth.user.username);

    const arcanaObj =
      Object.keys(missionArcana || {}).length !== 0
        ? missionArcana
        : this.availableChapterArcana();
    const hasMissionArcana = Object.keys(missionArcana || {}).length !== 0;

    if (!isMission) return null;

    return (
      <div
        style={{
          height: '240px',
          width: '200px',
        }}
      >
        {isPlayerArcana && (
          <div className="arcana-picker-wrapper">
            <Button
              color="S"
              width={200}
              text="CLEAR ARCANA"
              className="tertiary"
              onClick={() => this.handleClearArcana()}
            />
            <div className="arcana-picker">
              {_.map(arcanaObj, (value: number, key: string) => {
                const meta = this.getArcana(key);
                if (!meta) {
                  return null;
                }

                const isSelected = _.includes(Object.keys(selectedArcana), key);
                const isDisabled = !isPlayerArcana || hasMissionArcana;

                return (
                  <div
                    key={key}
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <div style={{ position: 'absolute' }}>
                      {this.getBadgeText(key, hasMissionArcana, missionArcana)}
                    </div>
                    <img
                      className={`arcane ${hoverArcane === key ? 'focus' : ''}`}
                      src={`/assets/arcanaImages${meta.imagePath}.svg`} // ← use meta
                      style={{
                        opacity: isDisabled || isSelected ? 1 : 0.5,
                        cursor: isDisabled
                          ? 'not-allowed'
                          : 'url(/assets/images/cursors/pointer.svg) 12 4, pointer',
                      }}
                      onClick={() => {
                        if (isDisabled) return;
                        this.handleArcanaClick(key, value);
                      }}
                      onMouseEnter={() => this.props.onToggleHover(`${key}`)}
                      onMouseLeave={() => this.props.onToggleHover('')}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!isPlayerArcana && (
          <div className="arcana-picker-wrapper">
            <div className="arcana-picker">
              {_.map(
                this.props.engineArcana || {},
                (value: number, key: string) => {
                  const meta = this.getArcana(key);
                  if (!meta) return null; // skip unknown keys so we don't crash

                  return (
                    <div
                      key={key}
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <div style={{ position: 'absolute' }}>
                        {/* Engine badge: INH if inherent, otherwise the engine's count */}
                        {meta.type === 'inherent' ? 'INH' : String(value)}
                      </div>

                      <img
                        className={`arcane ${
                          this.state.hoverArcane === key ? 'focus' : ''
                        }`}
                        src={`/assets/arcanaImages${meta.imagePath}.svg`}
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        onMouseEnter={() => this.props.onToggleHover(`${key}`)}
                        onMouseLeave={() => this.props.onToggleHover('')}
                      />
                    </div>
                  );
                }
              )}
            </div>

            <div
              style={{
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              Imbalance Score: {this.calculateArcanaScore(LS)}
            </div>
          </div>
        )}
      </div>
    );
  }
}
