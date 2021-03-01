import React, { useParams } from "react";

const User = () => {
  const { handle } = useParams();
  return <div>{handle}</div>;
};

export default User;
