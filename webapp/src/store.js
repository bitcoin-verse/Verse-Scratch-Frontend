import { reactive } from 'vue'


const products = [
    {
        id: 1,
        contractAddress: '0x4879372A662a09ce5Fd64CD7523B8F231Ac200f8',
        ticketPriceString: '3,000',
        ticketPrice: 3000, 
        title: 'Space Collection',
        jackpotString: '1,000,000',
        jackpot: 1000000,
        lowestPrice: 100,
        lowestPriceString: '100',
        highestPrice: 100000,
        highestPriceString: '100k',
        backgroundImage: `url('/bg.png')`,
        jackpotBoxColorOne: '#363E82',
        jackpotBoxColorTwo: '#4C3777',
        jackpotBoxColorThree: '#6E376F',

    },
    {
        id: 2,
        contractAddress: '0x0000000000000',
        ticketPriceString: '10,000',
        ticketPrice: 10000, 
        title: 'Lunar New Year',
        jackpotString: '10,000,000',
        jackpot: 10000000,
        lowestPrice: 1000,
        lowestPriceString: '1000',
        highestPrice: 300000,
        highestPriceString: '300k',
        backgroundImage: `url('https://images.template.net/123293/Chinese-New-Year-Black-Background---JPG-01-1.jpg')`,
        jackpotBoxColorOne: '#67293a',
        jackpotBoxColorTwo: '#23203a',
        jackpotBoxColorThree: '#23203a',
    }
]
export const store = reactive({
  productId: 1, // default product
  updateProduct(value) {
    this.productId = value
  },
  getProduct() {
    return products.find(product => product.id === this.productId);
  },
  getProducts() {
    return products
  }
})


