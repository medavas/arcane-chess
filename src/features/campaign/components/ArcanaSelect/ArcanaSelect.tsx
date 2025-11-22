import React from 'react';
import _ from 'lodash';

import './ArcanaSelect.scss';
import 'src/features/game/board/styles/normal.scss';

import arcanaJson from 'src/shared/data/arcana.json';

interface ArcanaDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  imagePath: string;
}

interface ArcanaSelectProps {
  inventory: ArcanaDetail[];
  color: string;
  isOpen: boolean;
  updateInventory?: (inventory: ArcanaDetail[]) => void;
  updateHover?: (arcane: ArcanaDetail) => void;
  handleToggle?: () => void;
  /** When true, disables hovering and clicking. */
  readOnly?: boolean;
}

interface ArcanaSelectState {
  hoverId: string;
  currentInventorySlot: number;
}

interface ArcanaMap {
  [key: string]: ArcanaDetail;
}

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

export default class ArcanaSelect extends React.Component<
  ArcanaSelectProps,
  ArcanaSelectState
> {
  constructor(props: ArcanaSelectProps) {
    super(props);
    this.state = {
      hoverId: '',
      currentInventorySlot: -1,
    };
  }

  updateSlot = (newValue: ArcanaDetail) => {
    const { inventory, updateInventory, handleToggle, updateHover, readOnly } =
      this.props;
    const { currentInventorySlot } = this.state;

    if (readOnly) return;

    const updatedInventory = [...inventory];
    updatedInventory[currentInventorySlot] = newValue;

    updateInventory?.(updatedInventory);
    handleToggle?.();
    updateHover?.(newValue);

    this.setState({
      currentInventorySlot: -1,
      hoverId: '',
    });
  };

  render() {
    const { inventory, isOpen, updateHover, handleToggle, readOnly } =
      this.props;
    const { hoverId, currentInventorySlot } = this.state;
    const cursorInteractive =
      "url('/assets/images/cursors/pointer.svg') 12 4, pointer";

    return (
      <div className="arcane-select">
        <div className="inventory">
          {inventory.map((arcane, key) => (
            <div
              key={key}
              className="arcane-wrapper"
              style={
                key === currentInventorySlot
                  ? {
                      display: 'inline-block',
                      borderRadius: '50%',
                      border: '2px solid white',
                      width: '60px',
                      height: '60px',
                      overflow: 'hidden',
                    }
                  : {}
              }
              onMouseEnter={() => {
                updateHover?.(arcane);
                this.setState({
                  hoverId: arcane.id,
                  currentInventorySlot: key,
                });
              }}
              onMouseLeave={() => {
                updateHover?.({} as ArcanaDetail);
                if (!isOpen) {
                  this.setState({
                    hoverId: '',
                    currentInventorySlot: -1,
                  });
                }
              }}
              onClick={
                readOnly
                  ? undefined
                  : () => {
                      handleToggle?.();
                      this.setState({
                        currentInventorySlot: key,
                      });
                    }
              }
              aria-disabled={readOnly || undefined}
            >
              <img
                className="arcane"
                src={`/assets/arcanaImages${arcane.imagePath}.svg`}
                style={{
                  cursor: cursorInteractive,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                alt={arcane.name}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {isOpen && (
          <div className="arcana-block" aria-disabled={readOnly || undefined}>
            {_.map(arcana, (arcaneObject: ArcanaDetail, key: string) => (
              <img
                key={key}
                className={`arcane ${hoverId === key ? 'focus' : ''}`}
                src={`/assets/arcanaImages${arcana[key].imagePath}.svg`}
                style={{
                  cursor: cursorInteractive,
                }}
                onMouseEnter={
                  readOnly
                    ? undefined
                    : () => {
                        updateHover?.(arcaneObject);
                        this.setState({ hoverId: key });
                      }
                }
                onMouseLeave={
                  readOnly
                    ? undefined
                    : () => {
                        updateHover?.({} as ArcanaDetail);
                        this.setState({ hoverId: '' });
                      }
                }
                onClick={
                  readOnly ? undefined : () => this.updateSlot(arcaneObject)
                }
                alt={arcaneObject.name}
                draggable={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}
