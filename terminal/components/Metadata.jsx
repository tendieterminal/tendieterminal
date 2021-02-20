import React from "react";
import {
  faComment,
  faArrowUp,
  faArrowDown,
  faClock,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

const timeAgo = (timestamp) => {
  let date = new Date(timestamp * 1000);
  let currentDate = new Date();

  let yearDiff = currentDate.getFullYear() - date.getFullYear();

  if (yearDiff > 0) return `${yearDiff} year${yearDiff == 1 ? "" : "s"} ago`;

  let monthDiff = currentDate.getMonth() - date.getMonth();

  if (monthDiff > 0)
    return `${monthDiff} month${monthDiff == 1 ? "" : "s"} ago`;

  let dateDiff = currentDate.getDate() - date.getDate();

  if (dateDiff > 0) return `${dateDiff} day${dateDiff == 1 ? "" : "s"} ago`;

  let hourDiff = currentDate.getHours() - date.getHours();

  if (hourDiff > 0) return `${hourDiff} hour${hourDiff == 1 ? "" : "s"} ago`;

  let minuteDiff = currentDate.getMinutes() - date.getMinutes();

  if (minuteDiff > 0)
    return `${minuteDiff} minute${minuteDiff == 1 ? "" : "s"} ago`;

  return `a few seconds ago`;
};

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
