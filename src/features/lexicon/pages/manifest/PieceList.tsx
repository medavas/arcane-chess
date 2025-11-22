import './PieceList.scss';

interface PieceItem {
  name: string;
  description: string;
  imagePath: string;
  family: string;
}

const pieceList: PieceItem[] = [
  // Infantry
  {
    name: 'Pawn',
    description:
      'Moves forward one square, captures diagonally. Represents the rank-and-file soldiers of the battlefield.',
    imagePath: '/assets/images/pieces/tactorius/normal/wP',
    family: 'Infantry',
  },
  {
    name: 'Herring',
    description:
      'Moves in a hex-like pattern like the site logo (2 squares to either side or 2 squares to the front/back and 1 to the right/left). Must be captured if attacked. Cunning and elusive, forcing opponents into traps.',
    imagePath: '/assets/images/pieces/tactorius/normal/wH',
    family: 'Infantry',
  },

  // Equus
  {
    name: 'Knight',
    description:
      'Moves in an L-shape, leaping over pieces. The mounted cavalry, striking from unexpected angles.',
    imagePath: '/assets/images/pieces/tactorius/normal/wN',
    family: 'Equus',
  },
  {
    name: 'Zebra',
    description:
      'Moves in a diamond-shaped path, leaping through pieces on the second rook move. A wild and unpredictable charger.',
    imagePath: '/assets/images/pieces/tactorius/normal/wZ',
    family: 'Equus',
  },
  {
    name: 'Unicorn',
    description:
      'Close combat on orthognoal squares; leaps through pieces on the second bishop move. A mythical hunter of legends.',
    imagePath: '/assets/images/pieces/tactorius/normal/wU',
    family: 'Equus',
  },

  // Sliders
  {
    name: 'Bishop',
    description:
      'Moves diagonally any distance. The spiritual guide and master of long-range influence.',
    imagePath: '/assets/images/pieces/tactorius/normal/wB',
    family: 'Sliders',
  },
  {
    name: 'Rook',
    description:
      'Moves orthogonally any distance. The steadfast tower, guardian of the ranks.',
    imagePath: '/assets/images/pieces/tactorius/normal/wR',
    family: 'Sliders',
  },

  // Ghost
  {
    name: 'Spectre',
    description:
      'Moves to the opposite-colored square complex in a 5×5 box from its position. A phantom that haunts the board.',
    imagePath: '/assets/images/pieces/tactorius/normal/wS',
    family: 'Ghost',
  },
  {
    name: 'Wraith',
    description:
      'Moves to the same-colored square complex in a 5×5 box from its position. A relentless spirit shadowing its prey.',
    imagePath: '/assets/images/pieces/tactorius/normal/wW',
    family: 'Ghost',
  },

  // Royalty
  {
    name: 'Mystic',
    description:
      'Moves like a bishop and knight combined. A wielder of arcane power with unmatched versatility.',
    imagePath: '/assets/images/pieces/tactorius/normal/wM',
    family: 'Royalty',
  },
  {
    name: 'Templar',
    description:
      'Moves like a rook and knight combined. A holy warrior defending the crown.',
    imagePath: '/assets/images/pieces/tactorius/normal/wT',
    family: 'Royalty',
  },
  {
    name: 'Queen',
    description:
      'Moves any distance in any direction. The most powerful piece, ruler of the battlefield.',
    imagePath: '/assets/images/pieces/tactorius/normal/wQ',
    family: 'Royalty',
  },
  {
    name: 'Valkyrie',
    description:
      'Attacks all squares within a 5×5 box around it. A celestial champion delivering swift judgment.',
    imagePath: '/assets/images/pieces/tactorius/normal/wV',
    family: 'Royalty',
  },
  {
    name: 'King',
    description:
      'Moves one square in any direction. The sovereign whose safety determines victory or defeat.',
    imagePath: '/assets/images/pieces/tactorius/normal/wK',
    family: 'Royalty',
  },
];

export default function PieceList() {
  const families = ['Infantry', 'Equus', 'Sliders', 'Ghost', 'Royalty'];

  return (
    <div className="piece-list">
      {families.map((family) => (
        <div key={family} className={`piece-family  ${family}`}>
          <h4>{family}</h4>
          {pieceList
            .filter((piece) => piece.family === family)
            .map((item, index) => (
              <div key={index} className="piece-item">
                <img
                  src={`${item.imagePath}.svg`}
                  alt={item.name}
                  className="thumb"
                />
                <div className="content">
                  <div className="name">{item.name}</div>
                  <div className="description">{item.description}</div>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
