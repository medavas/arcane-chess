import React from 'react';
import './Input.scss';

interface InputProps {
  id?: string;
  className?: string;
  color: string;
  height?: number;
  width?: number;
  placeholder?: string;
  value: string; // Made this non-optional to ensure a value is always provided
  onChange: (value: string) => void; // Simplified the type
  styles?: React.CSSProperties;
}

const Input: React.FC<InputProps> = ({
  id,
  className,
  color,
  height = 40,
  width = 120,
  placeholder = 'Type here...',
  value,
  onChange,
  styles,
}: InputProps) => {
  return (
    <input
      id={id}
      className={`${className} input`} // Concatenated className prop with 'input'
      type="text"
      style={{
        ...styles,
        height: `${height}px`,
        width: `${width}px`,
        color: `${color}`,
      }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)} // Simplified the onChange handling
    />
  );
};

export default Input;
