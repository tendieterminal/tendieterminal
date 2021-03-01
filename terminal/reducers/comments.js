import normalizedSlice, { Cardinalities } from "normalized-reducer";

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
