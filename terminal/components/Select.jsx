import React from "react";

const Select = ({
  options,
  placeholder,
  selected,
  setState,
  value = (option) => option,
  label = (option) => option,
}) => {
  return (
    <select value={selected} onChange={(e) => setState(e.currentTarget.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={value(option)} value={value(option)}>
          {label(option)}
        </option>
      ))}
    </select>
  );
};

export default Select;
