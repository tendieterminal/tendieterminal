import React from "react";

import {
  faComment,
  faArrowUp,
  faArrowDown,
  faClock,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

import { timeAgo } from "../utils.js";

export const Awards = ({ all_awardings, total_awards_received }) => {
  return (
    <ul className="awards">
      {all_awardings.slice(0, 3).map((award) => (
        <li key={award.id} className="icon">
          <img src={award.icon_url}></img>
        </li>
      ))}
      <li className="received">{total_awards_received}</li>
    </ul>
  );
};

export const Author = ({ post }) => {
  return (
    <ul className="author">
      {post.stickied && (
        <li className="stickied">
          <FAI icon={faBullhorn} />
        </li>
      )}
      <li className="name">{post.author}</li>
      {post.author_flair_text !== null && (
        <li
          className="flair"
          dangerouslySetInnerHTML={{
            __html: `${post.author_flair_text}`,
          }}
        />
      )}
    </ul>
  );
};

export const Metadata = ({ post }) => {
  const received_awards =
    post.all_awardings.length && post.total_awards_received;

  return (
    <ul className="metadata">
      <li>
        <FAI icon={Math.sign(post.score) ? faArrowUp : faArrowDown} />{" "}
        {post.score}
      </li>
      <li>
        <FAI icon={faComment} /> {post.num_comments}
      </li>
      <li>
        <FAI icon={faClock} /> {timeAgo(post.created_utc)}
      </li>
      {received_awards !== 0 && (
        <Awards
          all_awardings={post.all_awardings}
          total_awards_received={post.total_awards_received}
        />
      )}
    </ul>
  );
};
