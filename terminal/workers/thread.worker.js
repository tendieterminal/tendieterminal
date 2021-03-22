import reddit from "../services/reddit.js";
import { clientInfo, fetchAnonymousToken } from "../utils/reddit.js";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

import { actionCreators as actions } from "../reducers/comments.js";
import { sleep } from "../utils.js";
import Parser from "../services/parser.ts";

const subscriptionApi = {
  startSubscription,
};

const parser = new Parser();
// TODO: rewrite reddit links to tendieterminal
// const redirectHelper = newParser()

parser.addPreset("mdlink", (mdlink, text) => {
  try {
    let url = new URL(text);
    return url.host;
  } catch (e) {
    return text;
  }
});

parser.addPreset("url", (url) => {
  try {
    let linkURL = new URL(url);
    return linkURL.host;
  } catch (e) {
    return url;
  }
});

const normalizeComment = (data, state) => {
  const hasParent =
    data.parent_id &&
    data.parent_id.startsWith("t1") &&
    state.includes(data.parent_id);

  return {
    hidden: false,
    collapsed: false,
    filtered: false, // TODO: filter() array of parser.toTree() node properties
    muted: false,

    kind: "t1",
    depth: data.depth ? data.depth : 0,

    ...(hasParent && { parent: data.parent_id }),
    ...(data.created_utc && {
      created: new Date(data.created_utc * 1000),
    }),
    ...(data.author.name && { author: data.author.name }),
    ...(data.body_html && { body: data.body_html }),
    ...(data.score && { score: data.score }),
    ...(data.edited && { edited: data.edited }),
    ...(data.all_awardings && { all_awardings: data.all_awardings }),
    ...(data.total_awards_received && {
      total_awards_received: data.total_awards_received,
    }),
    ...(data.author_flair_text && {
      author_flair_text: data.author_flair_text,
    }),
  };
};

async function* startSubscription(subreddit, link_id, state) {
  let token = await fetchAnonymousToken();
  console.log("Will fetch at " + token.expiryTime);

  let client = new reddit({
    ...clientInfo,
    accessToken: token.accessToken,
  });

  let stream = client.commentStream(subreddit);

  let comments = [];

  let identifiers = state;

  stream.on("post", (c) => {
    comments.push(c);
  });

  for (;;) {
    let now = new Date();
    let batch = [];
    let bodies = [];

    while (comments.length) {
      let comment = comments.shift();

      if (comment.link_id === "t3_" + link_id) {
        identifiers.push(comment.name);
        let normalized = normalizeComment(comment, identifiers);

        // TODO: add a permalink to the comment, it is not in the state
        if (normalized.parent) {
          batch.push(
            actions.batch(
              actions.create("comment", comment.name, normalized),
              actions.attach(
                "comment",
                comment.name,
                "parent",
                normalized.parent
              )
            )
          );
        } else {
          batch.push(actions.create("comment", comment.name, normalized));
        }

        // TODO: filter() array of parser.toTree() node properties
        bodies.unshift({
          id: comment.name,
          body: parser.render(comment.body),
          created: comment.created,
        });
      }
    }

    if (batch.length) {
      yield {
        batch: batch,
        speech: bodies.sort((a, b) => (a.created > b.created ? -1 : 1)),
      };
    }

    if (token.expiryTime < now) {
      console.log("Fetching new token...");
      token = await fetchAnonymousToken();
      console.log("Will fetch at " + token.expiryTime);
      client.setAccessToken(token.accessToken);
    }

    await sleep(2500);
  }
}

Comlink.expose(subscriptionApi);
