import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

import { LoremIpsum } from "lorem-ipsum";

import { randomInt, randomString, sleep } from "../utils.js";
import { actionCreators } from "../reducers/comments.js";

const shitpostApi = {
  startShitposting,
};

async function* startShitposting() {
  const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4,
    },
    wordsPerSentence: {
      max: 16,
      min: 4,
    },
  });

  const shitposters = [
    "QueefMaster",
    "POTATO_IN_ASS",
    "NotMarkSpiegel",
    "Pumperino",
    "Snek69",
  ];

  for (;;) {
    let count = 0;
    let comments = [];
    let bodies = [];

    while (true) {
      const childId = randomString();
      const body = randomInt(9999);

      comments.push(
        actionCreators.create(
          "comment",
          childId,
          {
            kind: "t1",
            author: shitposters[Math.floor(Math.random() * shitposters.length)],
            score: randomInt(2),
            created: new Date(),
            body: body,
          },
          0
        )
      );

      bodies.push({ id: randomInt(9999), body: body });

      count++;

      if (count > randomInt(6)) {
        break;
      }
    }

    yield { batch: comments, speech: bodies };

    await sleep(500);
  }
}

Comlink.expose(shitpostApi);
