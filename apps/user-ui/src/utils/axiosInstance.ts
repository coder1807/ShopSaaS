import axios from 'axios';

// create instance separate axios to config default all request
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI, // expose client
  withCredentials: true, // allow axios send cookie (HttpOnly JWT, sessionId, ...)
});

let isRefreshing = false; // indicate refresh token is running
let refreshSubscribers: (() => void)[] = []; // list array callback function to retry request after token refresh

// Handle logout and prevent infinite loops
const handleLogout = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Handle adding a new access token to queued requests
// The callback parameter has a data type of a function with no parameters and no return value
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback); // add function into array ( refreshSubscribers has initial value is array )
};

// Execute queued requests after refresh
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback()); // call and execute each function in the array in turn to run
  refreshSubscribers = []; // after all execution is complete, reset it
};

// Handle API requests
axiosInstance.interceptors.request.use(
  // does not change anything in config and just return the axios config
  // if don't return config, axios can not send request because it's dont know what is config used cause error
  (config) => config,
  (error) => Promise.reject(error) // if there is any error during request creation => promise reject error
);

// Handle expired tokens and refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // get original request failed then axios attach axios config into error object
    // if dont get original request,it will not know what is wrong with the request faling to retry the request
    const originalRequest = error.config;

    // prevent infinite retry loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      // isRefreshing === true meaning: Another request has already started refreshing the token,
      // so the current request has to wait until the new token is ready.
      if (isRefreshing) {
        // This request is temporarily suspended. It will not refresh the token itself,
        // but will wait for a new token to be issued from another request, then resend the request itself
        return new Promise((resolve) => {
          // subscribeTokenRefresh(...) meaning: add callback to refreshSubscribers[] queue
          // axiosInstance(originalRequest) meaning: Resend the original request (which had a 401 error before) with a new token.
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        // refresh success
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/refresh-token-user`, // enpoint refresh token
          {}, // dont need payload, just cookie
          { withCredentials: true } // ensure cookies sent with request
        );

        isRefreshing = false;
        onRefreshSuccess();

        //The request that performed the token refresh will send its own request again — after having the new token.
        return axiosInstance(originalRequest);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        handleLogout();
        return Promise.reject(error);
      }
    }
    // if the error does not 401 => not related to auth/token.
    return Promise.reject(error);
  }
);
