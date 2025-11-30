import React from 'react';

interface ButtonProps {
  className?: string;
  color: string;
  height?: number | string;
  width?: number | string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  text?: string | string[];
  disabled?: boolean;
  strong?: boolean;
  submit?: boolean;
  fontSize?: number;
  backgroundColorOverride?: string;
  styles?: React.CSSProperties;
  variant?: '<' | '<<' | '>' | '>>' | '';
}

const Button: React.FC<ButtonProps> = ({
  text,
  width = 120,
  height = 40,
  disabled = false,
  submit = false,
  backgroundColorOverride = '',
  variant = '',
  ...props
}: ButtonProps) => {
  const {
    className = 'tertiary',
    color,
    onClick,
    onMouseEnter,
    strong,
  } = props;

  return (
    <button
      className={`button ${className}-${color}${
        disabled ? '-disabled' : ''
      } ${variant}`}
      style={{
        ...props.styles,
        height: `${height}${typeof height === 'string' ? '' : 'px'}`,
        width: `${width}${typeof width === 'string' ? '' : 'px'}`,
        fontSize: `${props.fontSize}px`,
        background: backgroundColorOverride || '',
        cursor: "url('/assets/images/cursors/pointer.svg') 12 4, pointer",
        position: 'relative', // Needed for arrow positioning
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      type={submit ? 'submit' : 'button'}
    >
      {variant === '<' && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            borderWidth: '8px 10px 8px 0',
            borderColor: 'transparent white transparent transparent',
          }}
        />
      )}
      {variant === '<<' && (
        <>
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(calc(-50% - 8px))', // adjust for the two spans' combined width
              width: '0',
              height: '0',
              borderStyle: 'solid',
              borderWidth: '8px 10px 8px 0',
              borderColor: 'transparent white transparent transparent',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(calc(-50% + 8px))', // adjust for the two spans' combined width
              width: '0',
              height: '0',
              borderStyle: 'solid',
              borderWidth: '8px 10px 8px 0',
              borderColor: 'transparent white transparent transparent',
            }}
          />
        </>
      )}
      {variant === '>' && (
        <span
          style={{
            position: 'absolute',
            right: '50%',
            transform: 'translateX(50%)',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            borderWidth: '8px 0 8px 10px',
            borderColor: 'transparent transparent transparent white',
          }}
        />
      )}
      {variant === '>>' && (
        <>
          <span
            style={{
              position: 'absolute',
              right: '50%',
              transform: 'translateX(calc(50% + 8px))', // adjust for the two spans' combined width
              width: '0',
              height: '0',
              borderStyle: 'solid',
              borderWidth: '8px 0 8px 10px',
              borderColor: 'transparent transparent transparent white',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '50%',
              transform: 'translateX(calc(50% - 8px))', // adjust for the two spans' combined width
              width: '0',
              height: '0',
              borderStyle: 'solid',
              borderWidth: '8px 0 8px 10px',
              borderColor: 'transparent transparent transparent white',
            }}
          />
        </>
      )}
      {variant === '' &&
        (strong ? <strong>{text}</strong> : <span>{text}</span>)}
    </button>
  );
};

export default Button;
