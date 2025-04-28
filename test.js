// Node.js v18+ has global fetch — if you're using older version, uncomment line below:
// const fetch = require('node-fetch');

const url = 'https://mamma.eliott-markus.cloud/wp-json/wp/v2/architect';

async function getArchitects() {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const architects = await response.json();
    console.log('Architects:', architects);
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

getArchitects();
