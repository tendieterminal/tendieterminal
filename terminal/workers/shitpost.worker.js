import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

import { randomInt, randomString, sleep } from "../utils.js";
import { actionCreators } from "../reducers/comments.js";

import Parser from "../services/parser.ts";

const shitpostApi = {
  startShitposting,
};

const parser = new Parser();

// parser.addRule(/guh+/gi, (guh) => {
//   return `<audio src="/terminal/autism/guh.mp3" />`;
// });

const randomShitpost = () => {
  const shitposts = [randomInt(9999)];
  return shitposts[Math.floor(Math.random() * shitposts.length)];
};

async function* startShitposting() {
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
      const body = randomShitpost();

      comments.push(
        actionCreators.batch(
          actionCreators.create("comment", childId, {
            hidden: false,
            collapsed: false,
            filtered: false, // TODO: filter() array of parser.toTree() node properties
            muted: false,

            kind: "t1",
            depth: 0,
            author: shitposters[Math.floor(Math.random() * shitposters.length)],
            score: randomInt(2),
            created: new Date(),
            body: body,
          })
        )
      );

      bodies.unshift({ id: randomInt(9999), body: parser.render(body) });

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
