import { reactive } from 'vue'

const isFlagDisabled = import.meta.env.VITE_FLAG === 'false';
const devProducts = ['womensday'];

const DEFAULT_PRODUCT_NAME = 'valentines';
const products = [
    {
        id: 1,
        active: false,
        multibuy: false,
        campaign: 'space-expeditions',
        contractAddress: '0x4879372A662a09ce5Fd64CD7523B8F231Ac200f8',
        ticketPriceString: '3,000',
        bannerLarge: 'url(/spaceexpeditions/banner-lg.png)',
        cardPreviewLarge: 'url(/spaceexpeditions/card-preview-lg.png)',
        cardPreviewMedium: 'url(/spaceexpeditions/card-preview-md.png)',
        bucketUrl: 'verse-scratcher-images',
        ticketPrice: 3000, 
        title: 'Space Expeditions - Discontinued',
        jackpotString: '1,000,000',
        templateFolder: 'default',
        homeLinkColor: '#0085FF',
        jackpot: 1000000,
        lowestPrice: 100,
        lowestPriceString: '100',
        highestPrice: 100000,
        highestPriceString: '100k',
        cover: '/spaceexpeditions/cover.png',
        backgroundImage: window.location.pathname === '/' ? `url('/bg.png')` : `url('/darker.png')`,
        bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
        homeSwitchColor: '#028DFD',
        jackpotBoxColorOne: '#1F2D52',
        jackpotBoxColorOneTitle: '#028DFD',
        jackpotBoxColorTwo: '#1F2D52',
        jackpotBoxColorTwoTitle: '#028DFD',
        jackpotBoxColorThree: '#1F2D52',
        jackpotBoxColorThreeTitle: '#028DFD',
        meta: {
          title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
          description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
          socialImage: "https://scratcher.verse.bitcoin.com/meta.png"
        }
    },
    {
        id: 2,
        multibuy: true,
        active: false,
        campaign: 'lunar-new-year',
        contractAddress: '0xd9b59ffbeb8e6b1cc9bc140f5050233555803483',
        ticketPriceString: '22,000',
        bannerLarge: 'url(/lunar/banner-lg.png)',
        cardPreviewLarge: 'url(/lunar/card-preview-lg.png)',
        cardPreviewMedium: 'url(/lunar/card-preview-md.png)',
        bucketUrl: 'verse-scratcher-images',
        ticketPrice: 22000, 
        title: 'Lunar New Year',
        cover: '/lunar/cover.png',
        jackpotString: '8,888,888',
        templateFolder: 'lunar',
        homeLinkColor: '#a98529',
        jackpot: 8888888,
        lowestPrice: 888,
        lowestPriceString: '888',
        highestPrice: 800000,
        highestPriceString: '800k',
        backgroundImage: window.location.pathname === '/' ? `url('/lunar/background.png')` : `url('/darker.png')`,
        bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
        homeSwitchColor: '#B89A4D',
        jackpotBoxColorOne: '#232323',
        jackpotBoxColorOneTitle: '#fac43b',
        jackpotBoxColorTwo: '#232323',
        jackpotBoxColorTwoTitle: '#fac43b',
        jackpotBoxColorThree: '#232323',
        jackpotBoxColorThreeTitle: '#fac43b',
        meta: {
          title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
          description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
          socialImage: "https://scratcher.verse.bitcoin.com/meta_lunar.png"
        }
    },
    {
      id: 3,
      multibuy: true,
      active: true,
      campaign: 'bitcoin-pizza',
      contractAddress: '0xae16fca128d5a27c738419674a0eba886e170595',
      ticketPriceString: '22,000',
      bannerLarge: 'url(/bitcoinpizza/banner-lg.png)',
      cardPreviewLarge: 'url(/bitcoinpizza/card-preview-lg.png)',
      cardPreviewMedium: 'url(/bitcoinpizza/card-preview-md.png)',
      bucketUrl: 'verse-scratcher-images',
      ticketPrice: 22000, 
      title: 'Bitcoin Pizza Day',
      cover: '/bitcoinpizza/cover.png',
      jackpotString: '8,888,888',
      templateFolder: 'bitcoinpizza',
      homeLinkColor: '#F09E0E',
      jackpot: 8888888,
      lowestPrice: 888,
      lowestPriceString: '888',
      highestPrice: 800000,
      highestPriceString: '800k',
      backgroundImage: window.location.pathname === '/' ? `url('/bitcoinpizza/background.png')` : `url('/darker.png')`,
      bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
      homeSwitchColor: '#F09E0E',
      jackpotBoxColorOne: '#232323',
      jackpotBoxColorOneTitle: '#F09E0E',
      jackpotBoxColorTwo: '#232323',
      jackpotBoxColorTwoTitle: '#F09E0E',
      jackpotBoxColorThree: '#232323',
      jackpotBoxColorThreeTitle: '#F09E0E',
      meta: {
        title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
        description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
        socialImage: "https://scratcher.verse.bitcoin.com/meta_pizza.png"
      }
    },
    {
      id: 4,
      multibuy: true,
      active: false,
      campaign: 'christmas',
      contractAddress: '0x748ec42a0664c026f7b392347f0cf99c8883333a',
      ticketPriceString: '22,000',
      bannerLarge: 'url(/christmas/banner-lg.png)',
      cardPreviewLarge: 'url(/christmas/card-preview-lg.png)',
      cardPreviewMedium: 'url(/christmas/card-preview-md.png)',
      bucketUrl: 'verse-scratcher-images',
      ticketPrice: 22000, 
      title: 'Christmas',
      cover: '/christmas/cover.png',
      jackpotString: '8,888,888',
      templateFolder: 'christmas',
      homeLinkColor: '#a98529',
      jackpot: 8888888,
      lowestPrice: 888,
      lowestPriceString: '888',
      highestPrice: 800000,
      highestPriceString: '800k',
      backgroundImage: window.location.pathname === '/' ? `url('/christmas/background.png')` : `url('/darker.png')`,
      bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
      homeSwitchColor: '#E02D2D',
      jackpotBoxColorOne: '#232323',
      jackpotBoxColorOneTitle: '#E02D2D',
      jackpotBoxColorTwo: '#232323',
      jackpotBoxColorTwoTitle: '#E02D2D',
      jackpotBoxColorThree: '#232323',
      jackpotBoxColorThreeTitle: '#E02D2D',
      meta: {
        title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
        description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
        socialImage: "https://scratcher.verse.bitcoin.com/meta_christmas.png"
      },
    },
    {
      id: 5,
      multibuy: true,
      active: true,
      campaign: 'valentines',
      contractAddress: '0x0e2F51Ce5D9cD0cdfD091AB6a235D2ee5EF087d2',
      ticketPriceString: '22,000',
      bannerLarge: 'url(/valentines/background-lg.png)',
      cardPreviewLarge: 'url(/valentines/card-preview-lg.png)',
      cardPreviewMedium: 'url(/valentines/card-preview-md.png)',
      bucketUrl: 'verse-scratcher-images',
      ticketPrice: 22000, 
      title: "Valentine's Day",
      cover: '/valentines/cover.png',
      jackpotString: '8,888,888',
      templateFolder: 'valentines',
      homeLinkColor: '#e71717',
      jackpot: 8888888,
      lowestPrice: 888,
      lowestPriceString: '888',
      highestPrice: 800000,
      highestPriceString: '800k',
      backgroundImage: window.location.pathname === '/' ? `url('/valentines/background.png')` : `url('/darker.png')`,
      bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
      homeSwitchColor: '#A90101',
      jackpotBoxColorOne: '#232323',
      jackpotBoxColorOneTitle: '#A90101',
      jackpotBoxColorTwo: '#232323',
      jackpotBoxColorTwoTitle: '#A90101',
      jackpotBoxColorThree: '#232323',
      jackpotBoxColorThreeTitle: '#A90101',
      meta: {
        title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
        description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
        socialImage: "https://scratcher.verse.bitcoin.com/meta_valentines.png"
      }
    },
    {
      id: 6,
      active: true,
      multibuy: true,
      campaign: 'default',
      contractAddress: '0x1570cb8c20511e670174a8a25dae851f80bd9e11',
      ticketPriceString: '3,000',
      bannerLarge: 'url(/spaceexpeditions/banner-lg.png)',
      cardPreviewLarge: 'url(/spaceexpeditions/card-preview-lg.png)',
      cardPreviewMedium: 'url(/spaceexpeditions/card-preview-md.png)',
      bucketUrl: 'verse-scratcher-images',
      ticketPrice: 3000, 
      title: 'Space Expeditions',
      jackpotString: '1,000,000',
      templateFolder: 'default',
      homeLinkColor: '#0085FF',
      jackpot: 1000000,
      lowestPrice: 100,
      lowestPriceString: '100',
      highestPrice: 100000,
      highestPriceString: '100k',
      cover: '/spaceexpeditions/cover.png',
      backgroundImage: window.location.pathname === '/' ? `url('/bg.png')` : `url('/darker.png')`,
      bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
      homeSwitchColor: '#028DFD',
      jackpotBoxColorOne: '#1F2D52',
      jackpotBoxColorOneTitle: '#028DFD',
      jackpotBoxColorTwo: '#1F2D52',
      jackpotBoxColorTwoTitle: '#028DFD',
      jackpotBoxColorThree: '#1F2D52',
      jackpotBoxColorThreeTitle: '#028DFD',
      meta: {
        title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
        description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
        socialImage: "https://scratcher.verse.bitcoin.com/meta.png"
      }
    },
    {
      id: 7,
      active: true,
      multibuy: true,
      campaign: 'womensday',
      contractAddress: '0x3d3b4c51ebd470c444499e08015e2f07303b0c46',
      ticketPriceString: '22,000',
      bannerLarge: 'url(/womensday/background-lg.png)',
      cardPreviewLarge: 'url(/womensday/card-preview-lg.png)',
      cardPreviewMedium: 'url(/womensday/card-preview-md.png)',
      bucketUrl: 'verse-scratcher-images',
      ticketPrice: 22000, 
      title: "Women's Day",
      jackpotString: '8,888,888',
      templateFolder: 'womensday',
      homeLinkColor: '#a741f1',
      jackpot: 8888888,
      lowestPrice: 888,
      lowestPriceString: '888',
      highestPrice: 800000,
      highestPriceString: '800k',
      cover: '/womensday/cover.png',
      backgroundImage: window.location.pathname === '/' ? `url('/womensday/background.png')` : `url('/darker.png')`,
      bodyStick: window.location.pathname === '/' ? `unset` : `fixed`,
      homeSwitchColor: '#6a0dad',
      jackpotBoxColorOne: '#232323',
      jackpotBoxColorOneTitle: '#6a0dad',
      jackpotBoxColorTwo: '#232323',
      jackpotBoxColorTwoTitle: '#6a0dad',
      jackpotBoxColorThree: '#232323',
      jackpotBoxColorThreeTitle: '#6a0dad',
      meta: {
        title: "Scratch & Win: On-Chain Scratch Tickets Powered by Verse",
        description: "Purchase and play on-chain scratch tickets with instant results and immediate prize claims.",
        socialImage: "https://scratcher.verse.bitcoin.com/meta_womensday.png"
      }
    },
]

const updateMetaData = (product) => {
  const descEl = document.querySelector('head meta[name="description"]');
  const titleEl = document.querySelector('head title');
  const ogImage = document.querySelector('head meta[property="og:image"]');    

  titleEl.textContent = product.meta.title
  descEl.setAttribute('content', product.meta.description)
  ogImage.setAttribute('content', product.meta.socialImage)
}

const initProduct = () => {
  const urlParams = new URLSearchParams(window.location.search);;
  const campaign = urlParams.get('campaign');
  urlParams.delete("campaign");

  // campaign is set in url
  if(campaign) {
    localStorage.setItem('collection', campaign)
    let product = products.find(product => product.campaign === campaign);
    if(product.active == true) {
      updateMetaData(product)
      return product.id 
    } else {
      // product no longer active
      product = products.find(product => product.campaign === DEFAULT_PRODUCT_NAME);
      return product.id
    }
  } 
  // campaign is not set in url
  else {
    let product = {}
    if(localStorage.getItem('collection') == null) {
      product = products.find(product => product.campaign === DEFAULT_PRODUCT_NAME);
      
    } 
    else {
      let activeProduct = localStorage.getItem('collection') != 'null' ? localStorage.getItem('collection') : DEFAULT_PRODUCT_NAME
      product = products.find(product => product.campaign === activeProduct);
      // if active campaign is no longer available
      if(!product || product.active == false) {
        product = products.find(product => product.campaign === DEFAULT_PRODUCT_NAME);
        localStorage.setItem('collection', DEFAULT_PRODUCT_NAME)
      }
    }

    updateMetaData(product)
    return parseInt(product.id)
  }
}

export const store = reactive({
  productId: initProduct(), // default product
  
  updateProduct(value) {
    this.productId = value;
    let product = products.find(product => product.id === value);
    localStorage.setItem('collection', product.campaign);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('campaign', product.campaign);
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.replaceState(null, '', newUrl);
  },
  
  getProduct() {
    return products.find(product => product.id === this.productId);
  },
  getRandomOtherProduct() {
    const filtered = products.filter(p => 
      p.id !== this.productId && 
      p.active && 
      (isFlagDisabled || !devProducts.includes(p.campaign))
    );
  
    return filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : null;
  },
  
  getProductContractAddresses() {
    return products.map(product => product.contractAddress)
  },
  getProducts() {
    if (isFlagDisabled) {
      return products;
    } else {
      return products.filter((p) => !devProducts.includes((p.campaign)));
    }
  },
})



