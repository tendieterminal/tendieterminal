import React from "react";
import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

export const Thumbnail = ({ post }) => {
  const thumbnail =
    post.thumbnail === "default" || post.thumbnail === "self" ? (
      <FAI icon={faAlignLeft} />
    ) : (
      <img src={post.thumbnail} />
    );
  return <div className="image">{thumbnail}</div>;
};
