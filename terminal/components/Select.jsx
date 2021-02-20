import React from "react";

const Select = ({ options, placeholder, selected, setState }) => {
  return (
    <select value={selected} onChange={(e) => setState(e.currentTarget.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default Select;
