import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import { setMyShopData } from '../redux/ownerSlice';

function useGetMyshop() {
  const dispatch = useDispatch();
 const { userData } = useSelector(state => state.user);
if (!userData?._id) return;
);

  useEffect(() => {
    // Only fetch if userData exists and role is owner
    if (!userData || userData.role !== 'owner') return;

    const fetchShop = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/shop/get-my`, { withCredentials: true });
        dispatch(setMyShopData(res.data));
      } catch (error) {
        console.error('Failed to fetch shop:', error);
      }
    };

    fetchShop();
  }, [userData, dispatch]);
}

export default useGetMyshop;

