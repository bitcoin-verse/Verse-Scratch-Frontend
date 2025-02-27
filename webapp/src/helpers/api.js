import axios from "axios"

export const getVersePrice = async () => {
    try {
        let res = await axios.get("https://markets.api.bitcoin.com/coin/data?c=VERSE")
        if(res.data.priceUsd) {
           return res.data.priceUsd
        }
    } catch (e) {
        console.log(e)
    }
}