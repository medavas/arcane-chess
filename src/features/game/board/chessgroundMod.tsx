import React from 'react';
import { Chessground as NativeChessground } from 'chessgroundx';

import './styles/chessground.scss';

type AnyChessground = {
  [key: string]: number | string | React.CSSProperties | null;
};

export interface IChessground {
  fen: string;
  resizable: boolean;
  wFaction: string;
  bFaction: string;
  width: number | string;
  height: number | string;
  // style: React.CSSProperties;
  enabled?: boolean;
  lastMove?: string[];
  check?: boolean;
  free?: boolean;
  color?: 'white' | 'black';
  dests?: any; // Replace `any` with a more specific type if available
  change?: () => void;
  move?: (orig: string, dest: string, capturedPiece: number) => void;
  animation?: {
    enabled: boolean;
    duration: number;
  };
  highlight?: {
    lastMove: boolean;
    check: boolean;
    royalties?: boolean;
  };
  wVisible?: boolean;
  bVisible?: boolean;
  disableContextMenu?: boolean;
  turnColor?: string;
  movable?: any; // Replace `any` with a more specific type if available
  events?: any; // Replace `any` with a more specific type if available
  forwardedRef?: React.Ref<IChessgroundApi>;
  royalties?:
  | { [key: string]: { [key: string]: number | undefined } }
  | undefined;
  // Adding an index signature for additional flexibility
  [key: string]: any;
}

export interface IChessgroundApi {
  set: (config: Record<string, AnyChessground>) => void;
  destroy: () => void;
  selectPocket: (piece: object) => void;
  setShapes: (shapes: object[]) => void;
  setAutoShapes: (shapes: object[]) => void;
  getFen: () => string;
  unselect: () => void;
}

export class Chessground extends React.Component<IChessground> {
  cg: IChessground;
  el: HTMLDivElement | null = null;
  config: Record<string, any> = {};

  constructor(props: IChessground) {
    super(props);
    this.cg = {} as IChessground;
    this.config = {};
  }

  buildConfigFromProps(props: IChessground): Record<string, any> {
    const config: { events: Record<string, any>;[key: string]: any } = {
      events: {},
    };

    Object.keys(props).forEach((k) => {
      const v = props[k];

      if (typeof v !== 'undefined') {
        const match = k.match(/^on([A-Z]\S*)/);

        if (match) {
          config.events[match[1].toLowerCase()] = v;
        } else {
          config[k] = v;
        }
      }
    });

    // If a movable Map/dests was produced by arcaneChess.validGroundMoves,
    // it may carry an optional `shiftDests` Set attached to the Map. Forward
    // that Set into config.movable.shiftDests so the underlying renderer
    // (night-chess-ui-2) can consume it without requiring changes at all
    // call sites that create the dests Map.
    try {
      const movable = (props as any).movable;
      const maybeDests = movable && (movable.dests || movable);
      const shiftSet =
        maybeDests && maybeDests.shiftDests
          ? maybeDests.shiftDests
          : movable && movable.shiftDests;
      if (shiftSet) {
        config.movable = config.movable || {};
        config.movable.shiftDests = shiftSet;
      }
      // Normalize dest keys: some callers (engine/UI) may produce origins in
      // different casings (eg. 'Rq@' vs 'rq@'). The renderer expects keys to
      // match the drop origin produced by `dropOrigOf(role)` (uppercase), so
      // add normalized lowercase/uppercase entries to improve matching and
      // ensure highlights / valid-dest rendering works regardless of casing.
      if (maybeDests instanceof Map) {
        const norm = new Map();
        for (const [k, v] of maybeDests.entries()) {
          norm.set(k, v);
          try {
            if (typeof k === 'string') {
              norm.set(k.toLowerCase(), v);
              norm.set(k.toUpperCase(), v);
            }
          } catch (e) {
            // noop
          }
        }
        config.movable = config.movable || {};
        config.movable.dests = norm;
      }
    } catch (e) {
      // noop
    }
    return config;
  }
  componentDidMount() {
    if (this.el) {
      this.cg = NativeChessground(
        this.el,
        this.buildConfigFromProps(this.props)
      ) as unknown as IChessground & IChessgroundApi; // Add the missing properties from IChessground to IChessgroundApi
    }

    if (this.props.forwardedRef) {
      if (typeof this.props.forwardedRef === 'function') {
        this.props.forwardedRef({
          set: this.cg.set.bind(this.cg),
          destroy: this.cg.destroy.bind(this.cg),
          selectPocket: this.cg.selectPocket.bind(this.cg),
          setShapes: this.cg.setShapes.bind(this.cg),
          setAutoShapes: this.cg.setAutoShapes.bind(this.cg),
          getFen: this.cg.getFen.bind(this.cg),
          unselect: this.cg.unselect.bind(this.cg),
        });
      } else if (this.props.forwardedRef) {
        (
          this.props.forwardedRef as React.MutableRefObject<IChessgroundApi>
        ).current = {
          set: this.cg.set.bind(this.cg),
          destroy: this.cg.destroy.bind(this.cg),
          selectPocket: this.cg.selectPocket.bind(this.cg),
          setShapes: this.cg.setShapes.bind(this.cg),
          setAutoShapes: this.cg.setAutoShapes.bind(this.cg),
          getFen: this.cg.getFen.bind(this.cg),
          unselect: this.cg.unselect.bind(this.cg),
        };
      }
    }
  }

  componentDidUpdate(prevProps: IChessground) {
    if (this.props !== prevProps) {
      this.cg.set(this.buildConfigFromProps(this.props));
    }
  }

  componentWillUnmount() {
    this.cg.destroy();
  }

  render() {
    // Initialize the style object with the provided style or an empty object
    /* eslint-disable react/prop-types */ // TODO: upgrade to latest eslint tooling
    const style: React.CSSProperties =
      this.props.style && typeof this.props.style === 'object'
        ? { ...this.props.style }
        : {};

    if (this.props.width !== undefined) {
      style.width = this.props.width;
    }

    if (this.props.height !== undefined) {
      style.height = this.props.height;
    }

    const props: React.HTMLAttributes<HTMLDivElement> = {
      style: style,
    };

    return (
      <div
        ref={(el) => {
          this.el = el;
        }}
        {...props}
      ></div>
    );
  }
}

export default React.forwardRef<IChessgroundApi, IChessground>((props, ref) => (
  <Chessground {...props} forwardedRef={ref} />
));
