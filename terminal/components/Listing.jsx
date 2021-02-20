import React, { useState, useEffect, useReducer } from "react";
import { useParams } from "react-router";

import normalizedSlice, { Cardinalities } from "normalized-reducer";

import { sanitize } from "../utils/Format.js";

import {
  faArrowUp,
  faArrowDown,
  faEllipsisH,
  faPencilAlt,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

import { Thumbnail } from "./Content.jsx";
import { Awards, Metadata, Author } from "./Metadata.jsx";
import { Subscription } from "./Subscription.jsx";

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

const Comment = ({ id, comment, state, dispatch }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);

  const timeAgo = (date) => {
    let currentDate = new Date();

    let yearDiff = currentDate.getFullYear() - date.getFullYear();

    if (yearDiff > 0) return `${yearDiff}y`;

    let monthDiff = currentDate.getMonth() - date.getMonth();

    if (monthDiff > 0) return `${monthDiff}m`;

    let dateDiff = currentDate.getDate() - date.getDate();

    if (dateDiff > 0) return `${dateDiff}d`;

    let hourDiff = currentDate.getHours() - date.getHours();

    if (hourDiff > 0) return `${hourDiff}h`;

    let minuteDiff = currentDate.getMinutes() - date.getMinutes();

    if (minuteDiff > 0) return `${minuteDiff}m`;

    return `1s`;
  };

  const leftIndent = comment.depth * 1.5;

  const commentStyle = {
    marginLeft: `${leftIndent}vw`,
  };

  const receivedAwards =
    comment.all_awardings.length && comment.total_awards_received;

  return (
    <>
      <article className="comment" style={commentStyle}>
        <div className={comment.depth ? "child" : "parent"}>
          <header className="metadata">
            <ul>
              <li className="author">{comment.author}</li>
              <li className="score">
                {comment.score}{" "}
                <FAI
                  icon={Math.sign(comment.score) ? faArrowUp : faArrowDown}
                />
              </li>
              {comment.edited && (
                <li className="edited">
                  <FAI icon={faPencilAlt} />
                </li>
              )}
              {receivedAwards !== 0 && (
                <Awards
                  all_awardings={comment.all_awardings}
                  total_awards_received={comment.total_awards_received}
                />
              )}
              {comment.author_flair_text !== null && comment.author_flair_text && (
                <li
                  className="flair"
                  dangerouslySetInnerHTML={{
                    __html: `${comment.author_flair_text}`,
                  }}
                />
              )}
            </ul>
            <ul>
              <li className="actions">
                <FAI icon={faEllipsisH} />
              </li>
              <li className="created">{timeAgo(comment.created)}</li>
            </ul>
          </header>
          <section
            className="body"
            dangerouslySetInnerHTML={{
              __html: sanitize(comment.body),
            }}
          />
        </div>
      </article>

      {comment.children?.map((childId, index) => (
        <Reply key={childId} id={childId} state={state} dispatch={dispatch} />
      ))}
    </>
  );
};

const MoreReplies = ({ id, comment, state, dispatch }) => {
  // TODO: not yet implemented
  return <></>;
};

const Reply = ({ id, state, dispatch }) => {
  const comment = selectors.getEntity(state, { type: "comment", id });

  if (!comment) {
    return null;
  }

  return comment.kind === "t1" ? (
    <Comment id={id} comment={comment} state={state} dispatch={dispatch} />
  ) : (
    <MoreReplies id={id} comment={comment} state={state} dispatch={dispatch} />
  );
};

const Comments = ({ state, dispatch }) => {
  const getRootCommentIds = (state) => {
    const ids = selectors.getIds(state, { type: "comment" });

    return ids.filter((id) => {
      const comment = selectors.getEntity(state, { type: "comment", id });
      return !!comment && !comment.parent;
    });
  };

  return (
    <>
      {getRootCommentIds(state).map((id) => (
        <Reply key={id} id={id} state={state} dispatch={dispatch} />
      ))}
    </>
  );
};

const Post = ({ post }) => {
  return (
    <>
      <article className="post">
        <Thumbnail post={post} />
        <div className="info">
          <div className="title">{post.title}</div>
          <Author post={post} />
          <Metadata post={post} />
        </div>
      </article>

      {post.is_self && (
        <article
          className="body"
          dangerouslySetInnerHTML={{
            __html: sanitize(post.selftext_html),
          }}
        />
      )}
    </>
  );
};

const Listing = () => {
  const { sub, id } = useParams();

  const [state, dispatch] = useReducer(reducer, emptyState);

  const sortDefault = "new";
  const sortOptions = ["New", "Best", "Top", "Controversial", "Old"];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState(null);

  const [sort, setSort] = useState(sortDefault);
  const [sortType, time] = sort.split(" ");

  const listing =
    `${global.REDDIT}/${sub}/comments/${id}/
    ${sortType}.json` + (time ? `?t=${time}&raw_json=1` : `?raw_json=1`);

  const mapChildren = (json) => json.data.children.map((l) => l.data);

  const normalizeComments = (comments, normalized = {}) => {
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

      Object.assign(normalized, { [data.name]: values });

      if (data.replies) {
        normalizeComments(data.replies, normalized);
      }
    });

    return normalized;
  };

  useEffect(() => {
    setLoading(true);

    window.scrollTo(0, 0);

    fetch(listing)
      .then((response) => response.json())
      .then((json) => {
        setLoading(false);
        setLastRequest(json);
        setPost(mapChildren(json[0]));

        const normalized = normalizeComments(json[1]);

        dispatch(
          actionCreators.setState({
            entities: {
              comment: normalized,
            },
            ids: {
              comment: Object.keys(normalized),
            },
          })
        );
        setError(null);
      })
      .catch((error) => {
        setLoading(false);
        setError(error);
        setPost(null);
        setComments(null);
        console.error("Error:", error);
      });
  }, [sort]);

  return (
    <div>
      {post !== null && (
        <>
          <section className="op">
            {post.map((p) => (
              <Post key={p.id} post={p} />
            ))}
          </section>
          <Subscription
            subreddit={sub}
            link_id={id}
            dispatch={dispatch}
            actions={actionCreators}
          />
          <section className="comments">
            <Comments state={state} dispatch={dispatch} />
          </section>
        </>
      )}
    </div>
  );
};

export default Listing;
