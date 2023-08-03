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
  const bcEndpoint = `https://bandcamp.com/api/salesfeed/1/get`;

  try {
    const response = await fetch(bcEndpoint, { method: 'GET' });
    return response.json();
  } catch (err) {
    return {
      error: err,
    };
  }
}

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export { createAmount, getRandom, replacer, getPurchases, wait };
