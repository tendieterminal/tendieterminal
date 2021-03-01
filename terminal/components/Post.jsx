import React from "react";

import { sanitize } from "../utils.js";

import { Thumbnail } from "./Content.jsx";
import { Author, Metadata } from "./Metadata.jsx";

const Post = ({ data }) => {
  return (
    <>
      <article className="post">
        <Thumbnail post={data} />
        <div className="info">
          <div className="title">{data.title}</div>
          <Author post={data} />
          <Metadata post={data} />
        </div>
      </article>

      {data.is_self && (
        <article
          className="body"
          dangerouslySetInnerHTML={{
            __html: sanitize(data.selftext_html),
          }}
        />
      )}
    </>
  );
};

export default Post;
