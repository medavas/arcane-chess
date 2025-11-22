import React, { useState } from 'react';
import './Toggle.scss';

interface Props {
  title?: string;
  height?: number;
  width?: number;
  onText?: string;
  offText?: string;
  callback?: (checked: boolean) => void;
  initialState?: boolean;
}

const Toggle: React.FC<Props> = ({
  title = 'Toggle',
  height = 30,
  width = 60,
  onText = 'ON',
  offText = 'OFF',
  callback = (checked: boolean) => checked,
  initialState = false,
}: {
  title?: string;
  height?: number;
  width?: number;
  onText?: string;
  offText?: string;
  callback?: (checked: boolean) => void;
  initialState?: boolean;
}) => {
  const [isChecked, setIsChecked] = useState(initialState);

  const toggleSwitch = () => {
    callback(!isChecked);
    setIsChecked(!isChecked);
  };

  return (
    <div className="toggle">
      <div>
        <span className="toggle-title">{title}</span>
      </div>
      <div className="toggle-setting">
        <label
          className="switch"
          style={{ height: `${height}px`, width: `${width}px` }}
        >
          <input type="checkbox" onChange={toggleSwitch} checked={isChecked} />
          <span className="slider"></span>
        </label>
        <div
          className="toggle-text"
          style={isChecked ? { color: 'white' } : { display: 'none' }}
        >
          {onText}
        </div>
        <div
          className="toggle-text"
          style={isChecked ? { display: 'none' } : { color: 'white' }}
        >
          {offText}
        </div>
      </div>
    </div>
  );
};

export default Toggle;
