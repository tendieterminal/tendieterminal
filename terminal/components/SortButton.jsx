import React from "react";

const Sort = ({ label, option, setState, selected }) => {
  return (
    <button
      className={selected ? "sort selected" : "sort"}
      onClick={() => setState(option)}
    >
      {label}
    </button>
  );
};

export default Sort;
