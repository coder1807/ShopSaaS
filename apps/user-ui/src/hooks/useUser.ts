import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

// fetch user data from API
const fetchUser = async () => {
  const response = await axiosInstance.get('/api/logged-in-user');
  return response.data.user;
};

const useUser = () => {
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['user'], // save response data in-memory cache in QueryClient with key is "user"
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // data time "fresh"
    retry: 1, // auto retry 1 time if queryFn failed
  });
  return { user, isLoading, isError, refetch };
};

export default useUser;
