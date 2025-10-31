import { useQueryStates } from "nuqs";
import {
  createLoader,
  createParser,
  createSerializer,
  type inferParserType,
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
  sort: sortParser,
  type: parseAsStringLiteral(MEDIA_FILTER_TYPES).withDefault("all"),
};

export const useMediaPageFilters = (options: Options = {}) =>
  useQueryStates(mediaPageSearchParams, options);

// React Query API endpoint level search params
const mediaApiSearchParams = {
  sort: sortParser,
  type: parseAsStringLiteral(MEDIA_TYPES),
  cursor: parseAsString,
  limit: parseAsInteger.withDefault(MEDIA_LIMIT),
};

export const loadMediaApiFilters = createLoader(mediaApiSearchParams);

export const getMediaApiUrl = createSerializer(mediaApiSearchParams, {
  clearOnDefault: false,
});
