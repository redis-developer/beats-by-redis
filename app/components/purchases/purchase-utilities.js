function createAmount() {
  const random = getRandom();
  let amount = ((random / 100) % 300).toFixed(2);
  amount *= Math.random() < 0.5 ? -1 : 1;
  return amount;
}

function getRandom() {
  return Math.floor(Math.random() * 9999999999);
}

function replacer(key, value) {
  if (typeof value === 'number') {
    return value.toString();
  }
  if (value == null) {
    return 'null';
  }
  return value;
}

async function getPurchases() {
  const twoMinutesAgo = Date.now() / 1000 - 120;
  const bcEndpoint = `https://bandcamp.com/api/salesfeed/1/get?start_date=${twoMinutesAgo}`;

  try {
    const response = await fetch(bcEndpoint, { method: 'GET' });
    const data = await response.json();

    return {
      timestmap: twoMinutesAgo,
      purchases: data.events,
    };
  } catch (err) {
    return {
      error: err,
    };
  }
}

export { createAmount, getRandom, replacer, getPurchases };
