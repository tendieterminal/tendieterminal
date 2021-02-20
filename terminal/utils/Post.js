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