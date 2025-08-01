import axios from "axios";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Sends an HTTP request to the API using the specified method and endpoint.
 *
 * Constructs the request URL from the `NEXT_PUBLIC_APP_URL` environment variable and the provided endpoint, then performs the request with Axios. Returns the full Axios response object.
 *
 * @param endpoint - The API endpoint to request, appended to `/api/`
 * @param method - The HTTP method to use (defaults to "GET")
 * @param body - Optional payload to include in the request
 * @returns The Axios response object containing the response data and metadata
 */
export async function request<T>(
  endpoint: string,
  method: RequestMethod = "GET",
  body?: unknown,
) {
  const response = await axios<T>({
    method,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/${endpoint}`,
    data: body,
  });
  return response;
}
