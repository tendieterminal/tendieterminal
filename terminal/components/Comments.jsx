import React, { useEffect, useReducer, useState, createContext } from "react";
import { useParams } from "react-router-dom";

import {
  reducer,
  emptyState,
  selectors,
  actionCreators,
} from "../reducers/comments.js";

import { normalizeComments } from "../utils/reddit.js";

import Post from "./Post.jsx";
import Replies from "./Replies.jsx";
import Subscription from "./Subscription.jsx";

export const CommentsContext = createContext();

const Comments = () => {
  const { sub, id, slug } = useParams();

  const sortDefault = "new";
  const sortOptions = ["New", "Best", "Top", "Controversial", "Old"];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const [post, setPost] = useState(null);
  const [state, dispatch] = useReducer(reducer, emptyState);

  const [sort, setSort] = useState(sortDefault);
  const [sortType, time] = sort.split(" ");

  const permalink = `${global.REDDIT}/${sub}/comments/${id}/${slug}`;
  const listing = `${global.REDDIT}/${sub}/comments/${id}`;

  const api = new URL(
    `${listing}/${sortType}.json` +
      (time ? `?t=${time}&raw_json=1` : `?raw_json=1`)
  );

  const getRootCommentIds = (state) => {
    const ids = selectors.getIds(state, { type: "comment" });
    return ids.filter((id) => {
      const comment = selectors.getEntity(state, { type: "comment", id });
      return !!comment && !comment.parent;
    });
  };

  const mapChildren = (json) => json.data.children.map((l) => l.data);

  useEffect(() => {
    setLoading(true);

    window.scrollTo(0, 0);

    fetch(api.href)
      .then((response) => response.json())
      .then((json) => {
        setLoading(false);

        setLastRequest(json);

        setPost(mapChildren(json[0]));

        const normalized = normalizeComments(json[1]);
        console.log(normalized);

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
        console.error("Error:", error);
      });
  }, [sort]);

  const styles = {
    container: {
      display: "flex",
      flexDirection: "row",
      height: "100%",
    },
  };

  return (
    <CommentsContext.Provider
      value={{
        comments: [state, dispatch],
        permalink: permalink,
        link_id: `t3_${id}`,
      }}
    >
      {post !== null && (
        <div className="comments">
          <section className="replies" style={{ overflow: "hidden" }}>
            {post.map((p) => (
              <Post key={p.id} data={p} />
            ))}
            <Replies ids={getRootCommentIds(state)} />
          </section>
          <Subscription
            subreddit={sub}
            link_id={id}
            dispatch={dispatch}
            actions={actionCreators}
          />
          {/* <Sidebar dispatch={dispatch} /> */}
        </div>
      )}
    </CommentsContext.Provider>
  );
};

export default Comments;
