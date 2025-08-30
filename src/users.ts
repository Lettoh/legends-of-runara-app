import axios from "axios";

export default function users() {

    const searchUsers = async (search) => {
        await axios.get('/sanctum/csrf-cookie')

        try {
            const response = await axios.get(`/api/users?search=${encodeURIComponent(search)}`).then(function (response) {
                return response.data.data;
            })
            return response;
        } catch (e) {
            return Promise.reject(e.response.data.errors)
        }
    }

    const getUserById = async (user_id) => {
        await axios.get('/sanctum/csrf-cookie')

        try {
            const response = await axios.get(`/api/user/${user_id}`).then(function (response) {
                return response.data;
            })
            return response;
        } catch (e) {
            return Promise.reject(e.response.data.errors)
        }
    }

    return {
        searchUsers, getUserById
    }
}