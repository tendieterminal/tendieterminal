import reddit from "../services/reddit.js";
import { clientInfo, fetchAnonymousToken } from "../utils/reddit.js";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

import { actionCreators } from "../reducers/comments.js";
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

const normalizeComment = (data, parent) => {
  const hasParent = parent && data.parent_id && data.parent_id.startsWith("t1");
  return {
    kind: "t1",
    depth: parent && data.depth ? data.depth : 0,
    collapsed: false,
    filtered: false, // TODO: filter() array of parser.toTree() node properties
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

async function* startSubscription(subreddit, link_id, parents = false) {
  let token = await fetchAnonymousToken();
  console.log("Will fetch at " + token.expiryTime);

  let client = new reddit({
    ...clientInfo,
    accessToken: token.accessToken,
  });

  let stream = client.commentStream(subreddit);

  let comments = [];

  stream.on("post", (c) => {
    comments.push(c);
  });

  for (;;) {
    let now = new Date();
    let actions = [];
    let bodies = [];

    while (comments.length) {
      let comment = comments.shift();

      if (comment.link_id === "t3_" + link_id) {
        let normalized = normalizeComment(comment, parents);

        actions.push(
          actionCreators.create("comment", comment.name, normalized, 0)
        );

        if (normalized.parent) {
          actions.push(
            actionCreators.attach(
              "comment",
              comment.name,
              "parent",
              normalized.parent,
              { reciprocalIndex: 0 }
            )
          );
        }

        // TODO: filter() array of parser.toTree() node properties
        bodies.push({
          id: comment.name,
          body: parser.render(comment.body),
        });
      }
    }

    if (actions.length) {
      yield { batch: actions, speech: bodies };
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
