import { useQueryStates } from "nuqs";
import {
  createLoader,
  createParser,
  createSerializer,
  type Options,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import {
  MEDIA_FILTER_TYPES,
  MEDIA_LIMIT,
  MEDIA_SORT_BY,
  MEDIA_TYPES,
  POST_LIMIT,
  SORT_DIRECTIONS,
} from "./constants";

function parseAsSort<const Field extends string>(fields: readonly Field[]) {
  const parseAsField = parseAsStringLiteral(fields);
  const parseAsDirection = parseAsStringLiteral(SORT_DIRECTIONS);
  return createParser({
    parse(query) {
      const [field = "", direction = ""] = query.split("_");
      const parsedField = parseAsField.parse(field);
      const parsedDirection = parseAsDirection.parse(direction);
      if (!parsedField || !parsedDirection) {
        return null;
      }
      return `${parsedField}_${parsedDirection}` as const;
    },
    serialize: String,
  });
}

const sortParser = parseAsSort(MEDIA_SORT_BY).withDefault("createdAt_desc");

// Page level search params
const mediaPageSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(MEDIA_LIMIT),
  search: parseAsString.withDefault(""),
  sort: sortParser,
  type: parseAsStringLiteral(MEDIA_FILTER_TYPES).withDefault("all"),
};

export const useMediaPageFilters = (options: Options = {}) =>
  useQueryStates(mediaPageSearchParams, options);

// React Query API endpoint level search params
const mediaApiSearchParams = {
  sort: sortParser,
  type: parseAsStringLiteral(MEDIA_TYPES),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(MEDIA_LIMIT),
  search: parseAsString,
};

export const loadMediaApiFilters = createLoader(mediaApiSearchParams);

export const getMediaApiUrl = createSerializer(mediaApiSearchParams, {
  clearOnDefault: false,
});

const mediaEditorApiSearchParams = {
  sort: sortParser,
  cursor: parseAsString,
  limit: parseAsInteger.withDefault(MEDIA_LIMIT),
};

export const loadMediaEditorApiFilters = createLoader(
  mediaEditorApiSearchParams
);

export const getMediaEditorApiUrl = createSerializer(
  mediaEditorApiSearchParams,
  {
    clearOnDefault: false,
  }
);

export const POST_SORT_BY = [
  "createdAt",
  "publishedAt",
  "updatedAt",
  "title",
] as const;

export const POST_SORTS = POST_SORT_BY.flatMap((field) =>
  SORT_DIRECTIONS.map((direction) => `${field}_${direction}` as const)
);

const postSortParser = parseAsSort(POST_SORT_BY).withDefault("createdAt_desc");

const postPageSearchParams = {
  category: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(POST_LIMIT),
  search: parseAsString.withDefault(""),
  sort: postSortParser,
  status: parseAsStringLiteral(["all", "published", "draft"]).withDefault(
    "all"
  ),
};

export const usePostPageFilters = (options: Options = {}) =>
  useQueryStates(postPageSearchParams, options);

export const loadPostApiFilters = createLoader(postPageSearchParams);

export const getPostApiUrl = createSerializer(postPageSearchParams, {
  clearOnDefault: false,
});
