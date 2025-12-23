import arcanaJson from 'src/shared/data/arcana.json';

interface ArcanaDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  imagePath: string;
}
interface ArcanaMap {
  [key: string]: ArcanaDetail;
}
interface Character {
  name: string;
  spellBook: ArcanaDetail[];
  setup: string;
  imagePath: string;
  color: string;
  description: string;
}

interface GameModeType {
  name: string;
  white: {
    arcana: ArcanaDetail[];
    setup: string;
  };
  black: {
    arcana: ArcanaDetail[];
    setup: string;
  };
}

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

const R = '#c53939';
const O = '#c77c35';
const Y = '#d9b800';
const G = '#34aa48';
const B = '#3f48cc';
const V = '#a043a2';

const path = '/assets/characters/';

const emptyArcane = {
  id: 'empty',
  name: '',
  description: 'No arcane selected here. Click to choose one!',
  type: '',
  imagePath: '/empty',
};

// CHARACTERS
const unpaddedCharacters = [
  {
    name: 'The Warlord',
    spellBook: [arcana.dyadK, arcana.dyadQ, arcana.dyadR],
    setup: 'RNBQKBNR',
    imagePath: 'warlord',
    color: Y,
    description:
      'Look for the double attacks, escape a threat against your King.',
  },
  {
    name: 'The Banshee',
    spellBook: [arcana.dyadW, arcana.dyadW, arcana.sumnW, arcana.sumnW],
    setup: 'RNWQKWNR',
    imagePath: 'banshee',
    color: V,
    description:
      'More predictable than The Ghoul, stronger control over choice color complexes.',
  },
  {
    name: 'The Ghoul',
    spellBook: [arcana.sumnS, arcana.sumnS, arcana.dyadS, arcana.dyadS],
    setup: 'RSBQKBSR',
    imagePath: 'ghoul',
    color: V,
    description: 'Chaotic control over both color complexes.',
  },
  // {
  //   name: 'The Politician',
  //   spellBook: [arcana.modsINH, arcana.offrC],
  //   setup: 'RNBVKBNR',
  //   imagePath: 'politician',
  //   color: R,
  //   description: 'Play for the endgame and use your resources.',
  // },
  {
    name: 'The Phoenix',
    spellBook: [arcana.dyadA, arcana.modsTEM, arcana.sumnRA, arcana.sumnRQ],
    setup: 'RNBQKBNR',
    imagePath: 'phoenix',
    color: O,
    description: 'Dazzle your opponent with high-end spells.',
  },
  {
    name: 'The Anarchist',
    spellBook: [arcana.modsTRO, arcana.offrE, arcana.sumnX],
    setup: 'RNBTKBNR',
    imagePath: 'anarchist',
    color: R,
    description: 'No rules, but still rules.',
  },
  {
    name: 'The Solider',
    spellBook: [arcana.shftP, arcana.shftN, arcana.shftB, arcana.shftR],
    setup: 'RNBQKBNR',
    imagePath: 'soldier',
    color: B,
    description: 'Mobility is your friend.',
  },
  {
    name: 'The Prophet',
    spellBook: [
      arcana.modsIMP,
      arcana.modsIMP,
      arcana.modsORA,
      arcana.modsORA,
      arcana.modsTEM,
      arcana.modsFUT,
    ],
    setup: 'RNBMKBNR',
    imagePath: 'prophet',
    color: G,
    description: 'See like the engine does.',
  },
  {
    name: 'The Barbarian',
    spellBook: [arcana.sumnX, arcana.sumnR, arcana.dyadA],
    setup: 'RNBQKBNR',
    imagePath: 'barbarian',
    color: R,
    description: 'Brute force strategy.',
  },
  {
    name: 'The Transcendent',
    spellBook: [arcana.sumnRV, arcana.dyadV, arcana.modsTEM, arcana.modsEXT],
    setup: 'RNMVKTNR',
    imagePath: 'transcendent',
    color: Y,
    description: 'Power from a higher entity.',
  },
  {
    name: 'The Demon',
    spellBook: [arcana.sumnX, arcana.modsCON, arcana.sumnRE, arcana.sumnRY],
    setup: 'RSWTKWSR',
    imagePath: 'demon',
    color: R,
    description: 'A dangerous and deadly spellcaster.',
  },
  {
    name: 'The Hexweaver',
    spellBook: [arcana.sumnH, arcana.sumnRY, arcana.sumnRZ, arcana.sumnRA],
    setup: 'RNBQKBNR',
    imagePath: 'wizard',
    color: V,
    description: 'Freeze and deflect opposing pieces.',
  },
];

export const startingSpellBook = Array(6).fill(emptyArcane);

export const padSpellBook = (characters: Character[]) => {
  return characters.map((character) => ({
    ...character,
    imagePath: `${path}${character.imagePath}`,
    spellBook: character.spellBook.slice(0, 6),
  }));
};

export const characters = padSpellBook(unpaddedCharacters);

// MODES
const padArcana = (arcana: ArcanaDetail[]) => {
  return arcana.slice(0, 6);
};

const padModes = (modes: Record<string, GameModeType>) => {
  return Object.entries(modes).reduce(
    (acc, [key, mode]) => {
      acc[key] = {
        ...mode,
        white: {
          ...mode.white,
          arcana: padArcana(mode.white.arcana),
        },
        black: {
          ...mode.black,
          arcana: padArcana(mode.black.arcana),
        },
      };
      return acc;
    },
    {} as Record<string, GameModeType>
  );
};

export const modes: Record<string, GameModeType> = padModes({
  hermitHemlock: {
    name: 'Hermit vs. Hemlock',
    white: {
      arcana: [
        // arcana.sumnH,
        // arcana.modsGLU,
        // arcana.modsBOU,
        // arcana.moriDYA,
        // arcana.moraDYA,
        // arcana.doplA,
        // arcana.doplB,
        // arcana.doplC,
        arcana.gainPAW,
        arcana.gainFOR,
        arcana.gainPIN,
        arcana.gainOUT,
        arcana.gainCOM,
        arcana.modsBLI,

        // arcana.modsEVO,
        // arcana.modsMAG,
        // arcana.modsTRA,
      ],
      setup: 'RNBTKBNR',
    },
    black: {
      arcana: [
        // arcana.sumnH,
        // arcana.toknHEM,
        // arcana.swapADJ,
        // arcana.modsEVO,
        // arcana.modsBOU,
        // arcana.doplA,
        // arcana.doplB,
        // arcana.doplC,
        // arcana.gainPAW,
        // arcana.gainFOR,
        // arcana.gainPIN,
        // arcana.gainOUT,
        // arcana.gainCOM,
      ],
      setup: 'rnbmkbnr',
    },
  },
  tutorial1: {
    name: 'Tutorial 1',
    white: {
      arcana: [arcana.modsINH, arcana.modsDIV, arcana.dyadC],
      setup: 'RNBTKBNR',
    },
    black: {
      arcana: [arcana.modsFUG, arcana.shftB, arcana.swapDEP],
      setup: 'rnbmkbnr',
    },
  },
  tutorial2: {
    name: 'Tutorial 2',
    white: {
      arcana: [arcana.sumnRE, arcana.sumnX, arcana.sumnRT],
      setup: 'RNBVKBNR',
    },
    black: {
      arcana: [arcana.modsCON, arcana.modsTRO, arcana.moriROY],
      setup: 'rnbvkbnr',
    },
  },
  tutorial3: {
    name: 'Tutorial 3',
    white: {
      arcana: [arcana.modsORA, arcana.moraPAW, arcana.sumnRN],
      setup: 'RSWQKWSR',
    },
    black: {
      arcana: [arcana.modsDIM, arcana.shftP, arcana.swapADJ],
      setup: 'rswqkwsr',
    },
  },
  tutorial4: {
    name: 'Tutorial 4',
    white: {
      arcana: [arcana.shftK, arcana.dyadF, arcana.sumnX],
      setup: 'RSWQKWSR',
    },
    black: {
      arcana: [arcana.sumnRF, arcana.swapADJ, arcana.modsSUR],
      setup: 'rswqkwsr',
    },
  },
  tutorial5: {
    name: 'Tutorial 5',
    white: {
      arcana: [arcana.sumnV, arcana.modsSIL, arcana.modsHEX],
      setup: 'RSWQKBNR',
    },
    black: {
      arcana: [arcana.modsREA, arcana.gainDYA, arcana.modsPHA],
      setup: 'rswvkwsr',
    },
  },
  tutorial6: {
    name: 'Tutorial 6',
    white: {
      arcana: [arcana.modsGLA, arcana.shftI, arcana.modsDIM],
      setup: 'RNBVKBNR',
    },
    black: {
      arcana: [arcana.sumnT, arcana.modsCON, arcana.sumnRI],
      setup: 'rswqkwsr',
    },
  },
  senario2: {
    name: 'Scenario 2',
    white: {
      arcana: [],
      setup: 'RNBQKBNR',
    },
    black: {
      arcana: [arcana.modsAET],
      setup: 'rnbqkbnr',
    },
  },
  secnario6: {
    name: 'Scenario 6',
    white: {
      arcana: [arcana.modsAET],
      setup: 'RNBQKBNR',
    },
    black: {
      arcana: [arcana.dyadB],
      setup: 'rnbqkbnr',
    },
  },
  secnario7: {
    name: 'Scenario 7',
    white: {
      arcana: [arcana.modsAET],
      setup: 'RNBQKBNR',
    },
    black: {
      arcana: [arcana.modsFUG],
      setup: 'rnbqkbnr',
    },
  },
  newClassic: {
    name: 'The New Classic',
    white: {
      arcana: [arcana.dyadA, arcana.offrA, arcana.sumnRQ, arcana.sumnX],
      setup: 'RNBTKBNR',
    },
    black: {
      arcana: [arcana.dyadA, arcana.offrA, arcana.sumnRQ, arcana.sumnX],
      setup: 'rnbtkbnr',
    },
  },
  sacsAndSwaps: {
    name: 'Sacs and Swaps',
    white: {
      arcana: [
        arcana.offrI,
        arcana.offrI,
        arcana.offrI,
        arcana.swapDEP,
        arcana.swapDEP,
        arcana.modsEXT,
      ],
      setup: 'RNBMKBNR',
    },
    black: {
      arcana: [
        arcana.offrI,
        arcana.offrI,
        arcana.offrI,
        arcana.swapDEP,
        arcana.swapDEP,
        arcana.modsEXT,
      ],
      setup: 'rnbmkbnr',
    },
  },
  seconds: {
    name: 'Seconds',
    white: {
      arcana: [arcana.dyadC, arcana.dyadC, arcana.dyadC, arcana.modsGLU],
      setup: 'RNBQKBNR',
    },
    black: {
      arcana: [arcana.dyadC, arcana.dyadC, arcana.dyadC, arcana.modsGLU],
      setup: 'rnbqkbnr',
    },
  },
  goliaths: {
    name: 'Clash of Goliaths',
    white: {
      arcana: [
        arcana.dyadA,
        arcana.sumnRA,
        arcana.sumnV,
        arcana.swapDEP,
        arcana.modsEXT,
        arcana.modsGLU,
      ],
      setup: 'TMQVKQMT',
    },
    black: {
      arcana: [
        arcana.dyadA,
        arcana.sumnRA,
        arcana.sumnV,
        arcana.swapDEP,
        arcana.modsEXT,
        arcana.modsGLU,
      ],
      setup: 'tmqvkqmt',
    },
  },
  suddenDeath: {
    name: 'Sudden Death',
    white: {
      arcana: [
        arcana.dyadA,
        arcana.dyadA,
        arcana.sumnRA,
        arcana.modsEXT,
        arcana.modsREA,
        arcana.modsSIL,
      ],
      setup: 'TMQVKQMT',
    },
    black: {
      arcana: [
        arcana.dyadA,
        arcana.dyadA,
        arcana.sumnRA,
        arcana.modsEXT,
        arcana.modsREA,
        arcana.modsSIL,
      ],
      setup: 'tmqvkqmt',
    },
  },
  rockAndHardPlace: {
    name: 'A Rock and a Hard Place',
    white: {
      arcana: [arcana.sumnR, arcana.modsREA],
      setup: 'RNBVKBNR',
    },
    black: {
      arcana: [arcana.sumnR, arcana.modsEXT],
      setup: 'rnbvkbnr',
    },
  },
  stampede: {
    name: 'Stampede!',
    white: {
      arcana: [
        arcana.dyadC,
        arcana.dyadC,
        arcana.dyadC,
        arcana.sumnN,
        arcana.sumnZ,
        arcana.sumnU,
      ],
      setup: 'ZNUVKUNZ',
    },
    black: {
      arcana: [
        arcana.dyadC,
        arcana.dyadC,
        arcana.dyadC,
        arcana.sumnN,
        arcana.sumnZ,
        arcana.sumnU,
      ],
      setup: 'znuvkunz',
    },
  },

  cursedStack: {
    name: 'Cursed Stack',
    white: {
      arcana: [arcana.modsFUG, arcana.modsTRO, arcana.modsINH],
      setup: 'RSBQKWNR',
    },
    black: {
      arcana: [arcana.modsFUG, arcana.modsTRO, arcana.modsINH],
      setup: 'rsbqkwnr',
    },
  },

  sequel: {
    name: 'The Sequel',
    white: {
      arcana: [arcana.offrI, arcana.sumnRE, arcana.shftN],
      setup: 'RNMQKBNR',
    },
    black: {
      arcana: [arcana.offrI, arcana.sumnRE, arcana.shftN],
      setup: 'rnmqkbnr',
    },
  },
  chronicles: {
    name: 'Chronicles',
    white: {
      arcana: [arcana.modsSUS, arcana.offrE, arcana.modsEXT, arcana.sumnRQ],
      setup: 'RNMQKMNR',
    },
    black: {
      arcana: [arcana.modsSUS, arcana.offrE, arcana.modsEXT, arcana.sumnRQ],
      setup: 'rnmtkmnr',
    },
  },
  alternateTimeline: {
    name: 'Alternate Timeline',
    white: {
      arcana: [arcana.dyadA, arcana.swapDEP, arcana.shftP, arcana.shftB],
      setup: 'RNBQKBTR',
    },
    black: {
      arcana: [arcana.dyadA, arcana.swapDEP, arcana.shftP, arcana.shftB],
      setup: 'rnbqkbtr',
    },
  },
});

export const FACTIONS = {
  chi: {
    id: 'chi',
    name: 'chi',
    army: 'RNBQKBNR',
    arcana: ['sumnRE', 'modsSIL', 'sumnX', 'modsTRO', 'modsINH', 'swapADJ'],
    unlocked: true,
    description: 'Law-breaking Pawns, unpredictable Valkyrie impersonation.',
    // color: MENU_COLORS.R_MENU,
  },
  gamma: {
    id: 'gamma',
    name: 'gamma',
    army: 'RNBTKBNR',
    arcana: ['sumnRE', 'shftP', 'modsAET', 'modsSUR', 'modsEXT', 'modsSUS'],
    unlocked: true,
    description:
      'Dangerous, flexible Pawns, unpredictable Valkyrie impersonation',
    // color: MENU_COLORS.O_MENU,
  },
  omega: {
    id: 'omega',
    name: 'omega',
    army: 'RNBMKBNR',
    arcana: ['dyadC', 'shftI', 'modsSUS', 'modsGLA', 'swapDEP', 'modsFUT'],
    unlocked: true,
    description:
      'Queen impersonation, flexible and dangerous double-moves at a price',
    // color: MENU_COLORS.Y_MENU,
  },
  lambda: {
    id: 'lambda',
    name: 'lambda',
    army: '1SWTKWS1',
    arcana: ['sumnRM', 'sumnRE', 'shftP', 'shftI', 'modsTRO', 'modsDIM'],
    unlocked: true,
    description:
      'Trap and capture pieces in a web, flexible and dangerous double-moves at a price',
    // color: MENU_COLORS.G_MENU,
  },
  sigma: {
    id: 'sigma',
    name: 'sigma',
    army: '1SWMKWS1',
    arcana: ['sumnRT', 'sumnRE', 'modsSIL', 'sumnX', 'modsFUG', 'modsBAN'],
    unlocked: true,
    description: 'Heavy-hitting Wraiths, trap pieces in multiple webs.',
    // color: MENU_COLORS.B_MENU,
  },
  psi: {
    id: 'psi',
    name: 'psi',
    army: '1SWQKWS1',
    arcana: ['sumnRQ', 'dyadD', 'modsAET', 'modsINH', 'modsEXT', 'modsREA'],
    unlocked: true,
    description: 'Buff Spectres, trap pieces in multiple webs.',
    // color: MENU_COLORS.V_MENU,
  },
  tau: {
    id: 'tau',
    name: 'tau',
    army: '2VVKV2',
    arcana: ['sumnRA', 'modsSIL', 'dyadA', 'modsGLU', 'shftK', 'modsREA'],
    unlocked: true,
    description: 'Small army with many spells.',
    // color: MENU_COLORS.S_MENU,
  },
};
