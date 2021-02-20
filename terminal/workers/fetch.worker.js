import * as Comlink from "comlink";

const wordApi = {
  getWord,
};

async function getWord() {
  const result = await fetch(
    "https://random-word-api.herokuapp.com/word?number=1"
  );
  const json = await result.json();
  return json[0];
}

Comlink.expose(wordApi);
