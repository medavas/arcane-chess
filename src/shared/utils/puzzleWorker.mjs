// type DataRow = { Rating: number; Themes: string };

self.onmessage = async (e) => {
  if (e.data.action === 'processCSV') {
    const { rating, keyword } = e.data;
    const data = await fetchAndParseCSV(); // This function fetches and parses the CSV
    const filteredData = filterData(data, rating, keyword); // Filter the data
    const randomSubset = getRandomSubset(filteredData, 12); // Get 12 random items
    self.postMessage(randomSubset); // Send the data back to the main thread
  }
};

async function fetchAndParseCSV() {
  try {
    const response = await fetch('/data/puzzles.csv');
    console.log('Fetch Response:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const csvText = await response.text();

    console.log('CSV Text:', csvText);
    const data = parseCSV(csvText);
    console.log('Parsed Data:', data);

    console.log('First few lines of CSV:', csvText.split('\n').slice(0, 5));

    console.log('CSV Text:', csvText); // Log the CSV content
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching or parsing CSV:', error);
    throw error;
  }
}

function parseCSV(csvText) {
  const rows = csvText.trim().split('\n');
  return rows.slice(1).map((row) => {
    const [ratingStr, themes] = row.split(',');
    return { Rating: parseInt(ratingStr, 10), Themes: themes };
  });
}

function filterData(data, rating, keyword) {
  return data.filter((row) => {
    const isWithinRatingRange = !rating || Math.abs(row.Rating - rating) <= 100;
    const containsKeyword =
      !keyword || row.Themes.toLowerCase().includes(keyword.toLowerCase());
    return isWithinRatingRange && containsKeyword;
  });
}

function getRandomSubset(data, count) {
  // Shuffle array using the Fisher-Yates algorithm
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }

  // Return the first 'count' elements
  return data.slice(0, count);
}
