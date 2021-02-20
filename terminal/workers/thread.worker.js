import reddit from "../services/reddit.js";
import { clientInfo, fetchAnonymousToken } from "../utils/reddit.js";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

import normalizedSlice, { Cardinalities } from "normalized-reducer";

const commentSchema = {
  comment: {
    parent: {
      type: "comment",
      cardinality: Cardinalities.ONE,
      reciprocal: "children",
    },
    children: {
      type: "comment",
      cardinality: Cardinalities.MANY,
      reciprocal: "parent",
    },
  },
};

export const {
  emptyState,
  actionCreators,
  reducer,
  selectors,
  actionTypes,
} = normalizedSlice(commentSchema);

const subscriptionApi = {
  startSubscription,
};

const sleep = () =>
  new Promise((res) => {
    setTimeout(res, 2500);
  });

const normalizeComment = (data, parent) => {
  const hasParent = parent && data.parent_id && data.parent_id.startsWith("t1");
  return {
    kind: "t1",
    depth: parent && data.depth ? data.depth : 0,
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

        bodies.push({ id: comment.name, body: comment.body });

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

    await sleep();
  }
}

Comlink.expose(subscriptionApi);
