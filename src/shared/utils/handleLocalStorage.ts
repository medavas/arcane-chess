import _ from 'lodash';

export const setLocalStorage = ({
  auth = {
    user: {
      id: '',
      username: '',
      campaign: { topScores: [...Array(12).fill(0)] as number[] },
    },
  },
  chapter = 0,
  config = {},
  arcana = {},
  nodeScores = {},
  lessonsCompleted = [] as string[],
  inventory = {},
  spellBook = {},
  nodeId = '',
  chapterEnd = false,
  difficulty = 'novice',
} = {}) => {
  const username = auth.user.username;

  // If there is no username, you might not want to proceed
  if (username === '') {
    console.warn('No user ID provided for setLocalStorage');
    return;
  }

  // Retrieve existing data or initialize if not present
  const existingData = JSON.parse(localStorage.getItem(username) || '{}');

  // Ensure existingData[username] is initialized properly
  if (!existingData[username]) {
    existingData[username] = {
      auth: {},
      chapter: 0,
      config: {
        multiplier: 80,
        clock: false,
        color: 'white',
        depth: 1,
        thinkingTime: 2,
      },
      arcana: {},
      nodeScores: {},
      lessonsCompleted: [],
      inventory: {},
      spellBook: {},
      nodeId: '',
      chapterEnd: false,
      difficulty: difficulty,
    };
  }

  if (Object.keys(nodeScores).length === 0) {
    existingData[username].nodeScores = {};
  }

  // Merge and update the lessonsCompleted by checking each lesson individually
  lessonsCompleted.forEach((lesson) => {
    if (!_.includes(existingData[username].lessonsCompleted, lesson)) {
      existingData[username].lessonsCompleted.push(lesson);
    }
  });

  // Merge existing data with new data
  const newData = {
    [username]: {
      ...existingData[username],
      auth: { ...existingData[username].auth, ...auth },
      chapter: chapter,
      config: { ...existingData[username].config, ...config },
      arcana: { ...arcana },
      nodeScores: { ...existingData[username].nodeScores, ...nodeScores },
      lessonsCompleted: [...existingData[username].lessonsCompleted],
      inventory: { ...existingData[username].inventory, ...inventory },
      spellBook: { ...existingData[username].spellBook, ...spellBook },
      nodeId: nodeId,
      chapterEnd: chapterEnd,
      difficulty: difficulty,
    },
  };

  localStorage.setItem(username, JSON.stringify(newData));
};

export const getLocalStorage = (username: string) => {
  const storedData = localStorage.getItem(username);

  if (storedData) {
    const parsedData = JSON.parse(storedData);
    const userData = parsedData[`${username}`];

    if (userData) {
      return userData;
    } else {
      console.error('User data not found for the provided ID');
      return null;
    }
  } else {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith('guest')) {
        const guestData = localStorage.getItem(key);

        if (guestData) {
          const parsedGuestData = JSON.parse(guestData);
          const guestUserData = parsedGuestData[`${key}`];

          if (guestUserData) {
            return guestUserData;
          } else {
            console.error('User data not found for the provided ID');
            return null;
          }
        }
      }
    }
  }
  console.error(
    'No data found in localStorage for the provided username or a key starting with "guest"'
  );
  return null;
};
