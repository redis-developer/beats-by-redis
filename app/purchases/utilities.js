import fetch from 'node-fetch';

export const createAmount = () => {
  const random = getRandom();
  let amount = ((random / 100) % 300).toFixed(2);
  amount *= Math.random() < 0.5 ? -1 : 1;
  return amount;
};

export const getRandom = () => {
  return Math.floor(Math.random() * 9999999999);
};

export const replacer = (key, value) => {
  if (typeof value === 'number') {
    return value.toString();
  }
  if (value == null) {
    return 'null';
  }
  return value;
};

export const getPurchases = async () => {
  const twoMinutesAgo = Date.now() / 1000 - 120;
  const bcEndpoint = `https://bandcamp.com/api/salesfeed/1/get?start_date=${twoMinutesAgo}`;

  const bandcampPayload = await fetch(bcEndpoint, { method: 'GET' })
    .then((data) => data.json())
    .then((data) => {
      return {
        timestmap: twoMinutesAgo,
        purchases: data.events,
      };
    })
    .catch((err) => {
      return {
        error: err,
      };
    });
  return bandcampPayload;
};
