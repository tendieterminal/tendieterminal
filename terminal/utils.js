import { sanitize } from "dompurify";

export { sanitize };

export const pi = (n) => {
  let v = 0;
  for (let i = 1; i <= n; i += 4) {
    v += 1 / i - 1 / (i + 2);
  }
  return 4 * v;
};

export const slice = (array, start, end) => {
  let length = array == null ? 0 : array.length;

  if (!length) {
    return [];
  }

  start = start == null ? 0 : start;
  end = end === undefined ? length : end;

  if (start < 0) {
    start = -start > length ? 0 : length + start;
  }

  end = end > length ? length : end;

  if (end < 0) {
    end += length;
  }

  length = start > end ? 0 : (end - start) >>> 0;
  start >>>= 0;

  let index = -1;
  const result = new Array(length);

  while (++index < length) {
    result[index] = array[index + start];
  }

  return result;
};

export const takeRight = (array, n = 1) => {
  const length = array == null ? 0 : array.length;

  if (!length) {
    return [];
  }

  n = length - n;

  return slice(array, n < 0 ? 0 : n, length);
};

export const randomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const randomString = (length = 12) => {
  const n = Math.floor(
    Math.pow(10, length - 1) +
      Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)
  );
  return n.toString();
};

export const sleep = (ms) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });
