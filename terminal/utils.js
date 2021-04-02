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

export const hash = (str) => {
  let hash = 5381,
    i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
};

const timeUnits = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
};

const rtf = new Intl.RelativeTimeFormat("en");

export const timeAgo = (date, full = true, now = new Date()) => {
  const then = date instanceof Date ? date : new Date(date) * 1000;
  const elapsed = then - now;

  for (var u in timeUnits)
    if (Math.abs(elapsed) > timeUnits[u] || u == "second")
      if (full) {
        return rtf.format(Math.round(elapsed / timeUnits[u]), u);
      } else {
        const time = rtf.formatToParts(
          Math.round(elapsed / timeUnits[u]),
          u
        )[0];
        return time.value + time.unit.charAt(0);
      }
};

export const documentHeight = () => {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );
};

export const documentWindowHeightOffset = () => {
  const windowHeight =
    window.innerHeight ||
    (document.documentElement || document.body).clientHeight;
  return documentHeight() - windowHeight;
};

export const percentageScrolled = () => {
  const scrollTop =
    window.pageYOffset ||
    (document.documentElement || document.body.parentNode || document.body)
      .scrollTop;
  return Math.floor((scrollTop / documentWindowHeightOffset()) * 100);
};

export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};
