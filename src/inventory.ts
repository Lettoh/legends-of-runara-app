import axios from "axios";

export default function inventory() {

    const getInventory = async (user_id) => {
        await axios.get('/sanctum/csrf-cookie')

        try {
            const response = await axios.get(`/api/inventory/${user_id}`).then(function (response) {
                return response.data.data;
            })
            return response;
        } catch (e) {
            return Promise.reject(e.response.data.errors)
        }
    }

    return {
        getInventory
    }
}