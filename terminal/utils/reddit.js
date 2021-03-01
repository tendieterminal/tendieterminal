export const clientInfo = {
  userAgent: "TendieTerminal",
  clientId: "VRvIgSI5lyHa4w",
};

export const fetchAnonymousToken = () => {
  const form = new FormData();
  const now = new Date().getTime();
  const inThirtyMinutes = now + 1000 * 60 * 30;
  const expires = new Date(inThirtyMinutes);

  form.set("grant_type", "https://oauth.reddit.com/grants/installed_client");
  form.set("device_id", "DO_NOT_TRACK_THIS_DEVICE");

  return fetch("https://www.reddit.com/api/v1/access_token", {
    method: "post",
    body: form,
    headers: { authorization: `Basic ${btoa(clientInfo.clientId + ":")}` },
    credentials: "omit",
  })
    .then((response) => response.text())
    .then(JSON.parse)
    .then((tokenInfo) => tokenInfo.access_token)
    .then((anonymousToken) => {
      return { accessToken: anonymousToken, expiryTime: expires };
    });
};

export const normalizeComments = (comments, normalized = {}) => {
  comments.data.children.forEach((comment) => {
    const data = comment.data;
    const isMore = comment.kind === "more";
    const hasParent = data.parent_id && data.parent_id.startsWith("t1");

    let children = [];

    if (isMore) {
      children = data.children;
    } else if (data.replies) {
      children = data.replies.data.children.map((child) => {
        return child.data.name;
      });
    }

    const values = {
      kind: comment.kind,
      children: children,
      depth: data.depth ? data.depth : 0,
      ...(hasParent && { parent: data.parent_id }),
      ...(data.created_utc && {
        created: new Date(data.created_utc * 1000),
      }),
      ...(data.author && { author: data.author }),
      ...(data.stickied && { stickied: data.stickied }),
      ...(data.distinguished && { distinguished: data.distinguished }),
      ...(data.body_html && { body: data.body_html }),
      ...(data.score && { score: data.score }),
      ...(data.score_hidden && { score_hidden: data.score_hidden }),
      ...(data.edited && { edited: data.edited }),
      ...(data.all_awardings && { all_awardings: data.all_awardings }),
      ...(data.total_awards_received && {
        total_awards_received: data.total_awards_received,
      }),
      ...(data.author_flair_text && {
        author_flair_text: data.author_flair_text,
      }),
    };

    Object.assign(normalized, { [data.name]: values });

    if (data.replies) {
      normalizeComments(data.replies, normalized);
    }
  });

  return normalized;
};

export const hasRedditVideo = (post) => {
  return post.is_video && post.domain === "v.redd.it";
};

export const hasVideo = (post) => {
  return (
    hasRedditVideo(post) ||
    post.domain === "gfycat.com" ||
    post.secure_media?.oembed?.type === "video"
  );
};
