import React, { useContext, useState, memo, useEffect } from "react";

import {
  faArrowUp,
  faArrowDown,
  faEllipsisH,
  faPencilAlt,
  faThumbtack,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

import { CommentsContext } from "./Comments.jsx";

import { actionCreators } from "../reducers/comments.js";

import { sanitize, randomString } from "../utils.js";
import { normalizeComments } from "../utils/reddit.js";

import { Awards } from "./Metadata.jsx";

const NewReply = ({ onSubmit, onCancel, showCancel, label, autoFocus }) => {
  const [value, setValue] = useState("");

  const cancel = () => {
    if (onCancel) {
      onCancel();
    }
    setValue("");
  };

  const submit = () => {
    const cleaned = value.trim();
    if (cleaned) {
      onSubmit(cleaned);
      setValue("");
    }
  };

  return (
    <div>
      <textarea
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />

      <div>
        {showCancel && <button onClick={cancel}>Cancel</button>}
        <button onClick={submit}>{label}</button>
      </div>
    </div>
  );
};

const MoreReplies = ({ id, data }) => {
  const { comments, permalink, link_id } = useContext(CommentsContext);
  const [state, dispatch] = comments;

  const [fetchMore, setFetchMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  const api = new URL(
    data.parent
      ? `${permalink}/${data.parent.substring(3)}/.json?raw_json=1`
      : "https://www.reddit.com/api/morechildren.json" +
        "?api_type=json" +
        `&link_id=${link_id}` +
        `&children=${data.children.slice(0, 500).join(",")}` +
        "&limit_children=1" +
        "&raw_json=1"
  );

  useEffect(() => {
    if (fetchMore) {
      setFetching(true);
      fetch(api.href)
        .then((response) => response.json())
        .then((json) => {
          const normalized = normalizeComments(
            data.parent
              ? json[1]
              : {
                  data: { children: json["json"]["data"]["things"] },
                }
          );

          const relations = [];
          const attachments = [];

          const updates = Object.keys(normalized)
            .filter((name) => state["ids"]["comment"].includes(name))
            .reduce((updates, name) => {
              normalized[name].children?.forEach((cid) => {
                relations.push({ child: cid, parent: name });
              });
              updates.push(
                actionCreators.create("comment", name, normalized[name])
              );
              return updates;
            }, []);

          const newIds = Object.keys(normalized).filter(
            (name) => !state["ids"]["comment"].includes(name)
          );

          const creations = newIds
            .filter((name) => !state["ids"]["comment"].includes(name))
            .reduce((creations, name) => {
              normalized[name].children?.forEach((cid) => {
                relations.push({ child: cid, parent: name });
              });
              creations.push(
                actionCreators.create("comment", name, normalized[name])
              );
              return creations;
            }, []);

          relations.forEach((attachment) => {
            attachments.push(
              actionCreators.attach(
                "comment",
                attachment.child,
                "parent",
                attachment.parent,
                { reciprocalIndex: 0 }
              )
            );
          });

          const cascade = () => ({ children: cascade });

          dispatch(
            actionCreators.batch(
              actionCreators.delete("comment", id, cascade),
              actionCreators.batch(
                ...updates,
                ...creations,
                actionCreators.batch(...attachments)
              )
            )
          );

          if (!data.parent) {
            dispatch({
              type: "normalized/CREATE",
              entityType: "comment",
              id: randomString(3),
              data: {
                kind: "more",
                children: data.children.filter(
                  (id) => !newIds.includes(`t1_${id}`)
                ),
                depth: 0,
              },
            });
          }
        });
    }
  }, [fetchMore]);

  const margin = data.depth
    ? {
        marginLeft: `${data.depth ? data.depth * 1.5 : 0.5}vw`,
      }
    : {
        margin: "0 auto",
        marginBottom: "1vw",
      };

  return (
    <article
      className="more"
      onClick={() => setFetchMore(true)}
      style={{
        padding: "1vw",
        border: "1px solid grey",
        width: "12vw",
        fontSize: "1vw",
        textAlign: "center",
        margin: "1vw",
        marginTop: "0",
        ...margin,
      }}
    >
      <div className="children">
        {data.children.length} more replies{" "}
        {fetching && <FAI icon={faCog} spin />}
      </div>
    </article>
  );
};

const Comment = memo(({ id, data }) => {
  const { comments } = useContext(CommentsContext);
  const [state, dispatch] = comments;

  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const toggleReplying = () => setReplying(!replying);

  const cancelReply = () => {
    toggleReplying();
  };

  const submitReply = (value) => {
    if (value) {
      const childId = randomString();

      dispatch(
        actionCreators.batch(
          actionCreators.create("comment", childId, {
            kind: "t1",
            children: [],
            created: new Date(),
            depth: data.depth + 1,
            body: value,
          }),
          actionCreators.attach("comment", childId, "parent", id, {
            reciprocalIndex: 0,
          })
        )
      );

      toggleReplying();
    }
  };

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

  const commentStyle = {
    marginLeft: `${data.depth * 1.5}vw`,
  };

  const receivedAwards =
    data.all_awardings?.length || data.total_awards_received;

  return (
    <>
      <article className="comment" style={commentStyle}>
        <div className={data.depth ? "child" : "parent"}>
          <header className="metadata">
            <ul>
              {data.stickied && (
                <li
                  className="stickied"
                  style={{ color: data.distinguished ? "green" : "white" }} // TODO: red/green moderator/admin
                >
                  <FAI icon={faThumbtack} />
                </li>
              )}
              <li
                className="author"
                style={{ color: data.distinguished ? "green" : "white" }}
              >
                {data.author}
              </li>
              <li className="score">
                {data.score_hidden ? "—" : data.score}{" "}
                <FAI icon={Math.sign(data.score) ? faArrowUp : faArrowDown} />
              </li>
              {data.edited && (
                <li className="edited">
                  <FAI icon={faPencilAlt} />
                </li>
              )}
              {receivedAwards && (
                <Awards
                  all_awardings={data.all_awardings}
                  total_awards_received={data.total_awards_received}
                />
              )}
              {data.author_flair_text !== null && data.author_flair_text && (
                <li
                  className="flair"
                  dangerouslySetInnerHTML={{
                    __html: `${data.author_flair_text}`,
                  }}
                />
              )}
            </ul>
            <ul>
              <li className="actions">
                <FAI icon={faEllipsisH} onClick={toggleReplying} />
              </li>
              <li className="created">{timeAgo(data.created)}</li>
            </ul>
          </header>
          <section
            className="body"
            dangerouslySetInnerHTML={{
              __html: sanitize(data.body),
            }}
          />
          {replying && (
            <NewReply
              autoFocus
              onSubmit={submitReply}
              onCancel={cancelReply}
              showCancel={true}
              label="Reply"
            />
          )}
        </div>
      </article>
    </>
  );
});

const Reply = ({ id }) => {
  const { comments } = useContext(CommentsContext);
  const [state] = comments;

  const comment = state["entities"]["comment"][id];

  return comment.kind === "t1" ? (
    <>
      <Comment key={id} id={id} data={comment} />
      {comment.children?.map((childId) => {
        return <Reply key={childId} id={childId} />;
      })}
    </>
  ) : (
    <MoreReplies key={id} id={id} data={comment} />
  );
};

const Replies = ({ ids }) => {
  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {ids.map((id, i) => {
        return <Reply key={i} id={id} />;
      })}
    </div>
    // <Virtuoso
    //   useWindowScroll
    //   data={ids}
    //   totalCount={ids.length}
    //   style={{ width: "100%", minHeight: "100vh" }}
    //   overscan={600}
    //   itemContent={(_, id) => <Reply id={id} />}
    // />
  );
};

export default Replies;
