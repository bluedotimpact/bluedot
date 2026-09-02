import axios, {
  AxiosError, AxiosHeaders, type AxiosRequestConfig, type AxiosResponse,
} from 'axios';
import { configure } from 'axios-hooks';

export type MockResponse = { status: number; data: unknown };

const toAxiosResponse = (config: AxiosRequestConfig, { status, data }: MockResponse): AxiosResponse => ({
  status,
  statusText: String(status),
  data,
  headers: new AxiosHeaders(),
  config: { ...config, headers: new AxiosHeaders() },
});

export const mockApi = (handler: (url: string) => MockResponse | Error) => {
  const instance = axios.create({
    adapter: async (config) => {
      const result = handler(config.url ?? '');
      if (result instanceof Error) {
        throw result;
      }

      const response = toAxiosResponse(config, result);
      if (result.status >= 400) {
        throw new AxiosError(`Request failed with status code ${result.status}`, AxiosError.ERR_BAD_REQUEST, response.config, {}, response);
      }

      return response;
    },
  });
  configure({ axios: instance, cache: false });
};
