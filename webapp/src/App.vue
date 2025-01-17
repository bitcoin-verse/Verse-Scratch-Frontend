<script setup>

import { RouterView } from 'vue-router'
import { polygon } from '@wagmi/core/chains'
import { configureChains, createConfig, disconnect, watchAccount } from '@wagmi/core'
import NavBar from './components/NavBar.vue'
import { createWeb3Modal } from '@web3modal/wagmi/vue'
import { initAmplitude, logAmplitudeEvent } from "./helpers/analytics"

import { computed } from 'vue';

import { WalletConnectConnector } from "@wagmi/connectors/walletConnect";
import { InjectedConnector } from "@wagmi/connectors/injected";
import { CoinbaseWalletConnector } from "@wagmi/connectors/coinbaseWallet";

import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc";
import { store } from './store.js'
import globals from "./globals";

// IF NEW VERSION IS SET, CLEAR INDEXDB
if(localStorage.getItem(globals.VERSION) !== "true") {
  clearAllIndexedDB()
  localStorage.setItem(globals.VERSION, "true")
}

async function clearAllIndexedDB() {
    try {
        // Get a list of all databases
        const databases = await indexedDB.databases();
        
        for (const dbInfo of databases) {
            // Open a connection to each database
            const request = indexedDB.open(dbInfo.name);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(db.objectStoreNames, 'readwrite');

                transaction.oncomplete = () => {
                    console.log(`Cleared all object stores in ${dbInfo.name}`);
                };

                transaction.onerror = (event) => {
                    console.error(`Error clearing object stores in ${dbInfo.name}:`, event.target.error);
                };

                // Clear each object store in the database
                for (const storeName of db.objectStoreNames) {
                    transaction.objectStore(storeName).clear();
                }
            };
        }
    } catch (error) {
        console.error('Error clearing IndexedDB databases:', error);
    }
}

const projectId = '5d9e3863443e82e9222f3e3f5e075798'
const activeProduct = computed(() => store.getProduct())
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        switch (chain.id) {
          case 137:
          default:
            return {
              http: "https://polygon.meowrpc.com", //https://floral-empty-gas.matic.quiknode.pro/
            };
        }
      },
    }),
  ],
)



const metadata = {
  name: "VERSE Scratcher",
  description: "Unveiling our first space expedition themed Scratch Tickets powered by VERSE - your instant path to fun and fortune",
  url: "https://scratcher.verse.bitcoin.com",
  icons: ["https://scratcher.verse.bitcoin.com/icon.png"],
};

// quick fix converted into string
let isWallet = false

// dont have anything in session storage yet
if(!sessionStorage.getItem('isWallet')) {
  const search = new URLSearchParams(window.location.search);
  isWallet = search.get("origin") === "wallet";
  sessionStorage.setItem('isWallet', isWallet);
} else {
  if(sessionStorage.getItem('isWallet') == "true") {
    isWallet = true
  } else {
    isWallet = false
  }
}

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        showQrModal: false,
        metadata,
      },
    }),
    ...(isWallet === true
      ? []
      : [
          new InjectedConnector({
            chains,
            options: { shimDisconnect: true },
          }),
          new CoinbaseWalletConnector({
            chains,
            options: { appName: metadata.name },
          }),
        ]),
  ],
  publicClient,
  webSocketPublicClient,
})


initAmplitude()
logAmplitudeEvent({
  name: 'verse scratcher visited'
})

createWeb3Modal({ 
    tokens: {
        137:{
            address:"0xc708d6f2153933daa50b2d0758955be0a93a8fec",
            image:"https://assets.coingecko.com/coins/images/28424/small/verselogo.png?1670461811" 
        },
    
    },
    featuredWalletIds: ["107bb20463699c4e614d3a2fb7b961e66f48774cb8f6d6c1aee789853280972c"],
    includeWalletIds: [], wagmiConfig, projectId, chains})

</script>


<template>  
  <NavBar />
  <RouterView />
</template>

<style lang="scss">

.verse-wide {
  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Hairline.otf") format("opentype");
    font-weight: 100;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Thin.otf") format("opentype");
    font-weight: 200;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-ExtraLight.otf") format("opentype");
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Light.otf") format("opentype");
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Regular.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Medium.otf") format("opentype");
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-SemiBold.otf") format("opentype");
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Bold.otf") format("opentype");
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-ExtraBold.otf") format("opentype");
    font-weight: 800;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-Black.otf") format("opentype");
    font-weight: 900;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Saeada";
    src: url("/fonts/LTSaeada-ExtraBlack.otf") format("opentype");
    font-weight: 950;
    font-style: normal;
    font-display: swap;
  }
  &.home {
    background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
  }
  &:hover {
    background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
  }
  &:active {
    background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
  }
  
  &.fixBottomMobile {
    @media(max-width: 880px) {
      position: fixed;
      left: 32px;
      width: calc(100% - 64px);
      bottom: 48px;
    }
  }
  &.extraTop {
    margin-top: 100px;
  }
  &.extraTopMobile {
    @media(max-width: 880px) {
      margin-top: 45px!important;
    }
  }
  &.half {
    width: 222px;
    margin-left: 8px;
    margin-right: 8px;
    @media(max-width: 880px) {
      margin-left: 0;
      margin-right: 0;
      margin-top: 8px;
      width: 100%;
    }
  }
  &.secondary {
    background: #202B58;

  }
  cursor: pointer;
  margin-top: 24px;
  background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
  height: 48px;
  border: none;
  width: 100%;
  border-radius: 100px;
  color: white;
  font-weight: 800;
  font-size: 17px;
  line-height: 21.6px;
  font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;

  &.disabled {
    color: #313E57;
    background: none;
    background-color: #1A2231;
  }
}

.global-wrap {
  background-image: v-bind('activeProduct.backgroundImage')!important;
  background-size: cover;
  /* position: relative; */
  /* min-height: 800px; */
  
  @media(max-width: 880px) {
    background-image: none!important;
  }
}

.flex-wrap {
  @media(min-width: 768px) {
    width: 100%;
    align-items: center;
    z-index: 0;
    max-width: 80rem;
    margin: 0px auto;
    gap: 1rem;
    /* display: grid; */
    /* grid-template-columns: min-content max-content auto; */
    height: fit-content;
  }
}
i.close-btn {
    background-image: url("./assets/icons/close.png");
    width: 24px;
    height: 24px;
    display: block;
    background-size: cover;
    position: absolute;
    z-index: 5;
    right: 32.5px;
    top: 26.5px;
}

.wallet-balance {
  margin-top: 24px;
  @media(max-width: 880px) {
    margin-bottom: 24px;
  }
  background-color: #1A2231;
  width: 100%;
  padding-top: 16px;
  padding-bottom: 16px;
  border-radius: 12px;
  
  .balance-title {
    font-size: 12px;
    margin-top: 0;
    color: #C5CEDB!important;
    margin-bottom: 0;
    font-weight: 800px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }
  .balance {
    margin-top: 2px;
    font-weight: 800;
    margin-bottom: 0;
    font-size: 24px;
  }
}
.backdrop {
    overflow: hidden;
    position: fixed; 
    top: 0;
    left: 0;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    background-color: #030c14a6;
    z-index: 2;


    .modal {
        @media(max-width: 880px) {
            position: absolute;
            top: 0;
            width: 100%;
            height: 520px;
            overflow: auto;
            min-height: 100vh;
            min-height: 100dvh;
            left: 0;
            border-radius: 0;
            padding: 0;
        }

      .modal-head {
        width: 100%;
        border-top-left-radius: 13.5px;
        border-top-right-radius: 13.5px;
        .title {
          margin-bottom: 24px;
          margin-top: 24px;
          font-size: 24px;
          margin-left: 32px;
        }
      }

      .modal-divider {
        background-color: white;
        height: 4px;
        background-color: #1A2231;
        border: 1px solid #1A2231;
        position: relative;
      }

      .modal-progress {
        &.p25 {
          width: 25%;
        }
        &.p50 {
          width: 50%;
        }
        &.p75 {
          width: 75%;
        }
        &.p100 {
          width: 100%;
        }
        background-color: #0085FF;
        position: absolute;
        left: 0;
        top: 0;
        height: 4px;
      }

      .modal-body {
        &.collection {
          padding-top: 10px;
          h3.title {
           
          }
          @media(max-width: 880px) {
            padding: 4px;
            padding-top: 10px;
          }
        }
        table {
          padding: 20px;
          border-radius: 10px;
          background-color: #05111c;
          border: 1px solid #273953;
          color: white;
          width: 100%;
          td.key {
            width: 50%;
            font-weight: 800;
            text-align: left;
          }
          td.value {
            width: 50%;
            text-align: right;
          }
        }
        min-height: 500px;
        @media(max-width: 880px) {
          height: 500px!important;
        }
        &.no-min-height {
          min-height: unset!important;
        }
        .loadingText {
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 800;
        }
        position: relative;
        @media(max-width: 880px) {
          padding: 24px;
          padding-bottom: 60px;
        }

        &.short {
          height: unset;
          padding-bottom: 47px;
        }

        .attention-footer {
          position: absolute;
          background: #0085FF;
          height: 54px;
          width: 100%;
          left: 0;
          bottom: 0;
          margin: 0;
          border-bottom-left-radius: 13.5px;
          border-bottom-right-radius: 13.5px;
          @media(max-width: 880px) {
            position: fixed;
            bottom: 0;
            left: 0;
            border-radius: 0;
          }
          p {
            margin-top: 18px!important;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
        }
        .modal-footer {
          @media(max-width: 880px) {
            position: absolute;
            padding-left: 24px;
            padding-right: 24px;
            width: calc(100% - 48px);
          }
          text-align: center;
          position: relative;
          bottom: 0;
          left: 0;
          font-size: 14px;
          font-weight: 500;
          color: #586F91;
          width: calc(100% - 80px);
          margin-top: 40px;
          margin-bottom: 0;
          padding: 40px;
          padding-bottom: 0;
          line-height: 16.71px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          a { 
            color: #0085FF;
            cursor: pointer;
            text-decoration: none;
          }
        }

        .helper {
          padding: 12px;
          background: #163756;
          position: relative;
          height: 28px;
          margin-top: 2px;
          border-radius: 12px;
          @media(max-width: 880px) {
            height: unset;
            margin-bottom: 16px;
          }

          .bulb-icn {
            position: absolute;
            width: 16px;
            height: 16px;
            top: 17.5px;
            left: 12px;
            background-image: url("./assets/icons/bulb.png");
            background-size: cover;
          }
          p {
            position: relative;
            width: calc(100% - 60px);
            left: 40px;
            text-align: left;
            color: #C5CEDB;
            line-height: 14.32px;
            font-weight: 800;
            margin: 0;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
        }


        // min-height: 540px;
        padding: 40px 32px 24px 32px;
        text-align: center;
        .img-spinner {
          background-image: url("./assets/icons/activity.svg");
          width: 44px;
          height: 44px;
          background-size: cover;
          margin: 0 auto;
          margin-top: 180px;
        }
        .img-success {
          background-image: url("./assets/icons/success.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
          margin-top: 70px;
        }
        .change-network {
          background-image: url("./assets/icons/change-network.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
          margin-top: 70px;
        }
        .img-gift {
          margin-top: 10px!important;
          background-image: url("./assets/icons/gift.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
          @media(max-width: 880px) {
            margin-top: 199px!important;
          }
        }
        .img-wallet {
          background-image: url("./assets/icons/wallet.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
        }
        .img-verse {
          background-image: url("./assets/icons/verse.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
        }
        .img-purchase {
          background-image: url("./assets/icons/purchase.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
        }
        .img-approve {
          background-image: url("./assets/icons/approve.png");
          width: 148px;
          height: 120px;
          background-size: cover;
          margin: 0 auto;
        }
        .title {
          margin-top: 16px;
          font-size: 24px;
        }
        .subtext {
          &.short {
              width: 300px;
              margin-left: calc(50% - 175px);
          }
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          font-size: 14px;
          color: #899BB5;
          font-weight: 500;
          padding: 0 25px 0 25px;
          span {
            color: #C5CEDB; 
          }
        }

        .icn-min {
            background-image: url("./assets/icons/min.png");
            width: 30px;
            height: 30px;
            position: absolute;
            background-size: cover;
            left: 4px;
            top: 2px;
          }
          .icn-plus {
            background-image: url("./assets/icons/plus.png");
            width: 30px;
            height: 30px;
            top: 2px;
            right: 4px;
            position: absolute;
            background-size: cover;
          }

        .gift-toggle-holder {

          &.second {
            margin-top: 10px!important;
          }
          .input-holder {
            position: absolute;
            right: 16px;
            top: 10px;
            width: 120px;
            height: 35px;

            .toggler {
              position: absolute;
              height: 100%;
              cursor: pointer;
              width: 50px;
              background: #425472;
              
              &.up {
                border-top-right-radius: 9px;
                border-bottom-right-radius: 9px;
                top: 0px;
                right: 0px;
              }
              &.down {
                border-top-left-radius: 9px;
                border-bottom-left-radius: 9px;
                top: 0px;
                left: 0px;
              }
            }

            /* Chrome, Safari, Edge, Opera */
            input::-webkit-outer-spin-button,
            input::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }

            /* Firefox */
            input[type=number] {
              -moz-appearance: textfield;
            }

            input {
              background: #0F1823;
              border: 1px solid #0F1823;
              outline: none;
              color: white;
              font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
              font-size: 13px;
              font-weight: 800;
              text-align: center;
              z-index: 5;
              position: relative;
              width: 45px;
              border-color: none;
              height: calc(100% - 2px);
              border-radius: 9px;
              padding: 0;
              @media(max-width: 880px) {
                font-weight: 800;
              }
            }
          }
          background-color: #252D40;
          height: 56px;
          width: 100%;
          position: relative;
          border-radius: 12px;
          margin-top: 24px;
          &.opened {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
          .switch {
            position: absolute;
            right: 16px;
            top: 16px;
          }
          h3.title {
            color: white;
            font-size: 16px;
            font-weight: 800;
            position: absolute;
            left: 18px;
          }
        }

        .gift-toggle-holder-bottom {
          background-color: #1A2231;
          padding: 16px;
          p {
            color: white;
            font-size: 12px;
            margin: 0;
            text-align: left;
            line-height: 14.32px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
        }
      }
      
        box-shadow: 0 0 20px rgba(17, 17, 29, 0.7);
        width: 540px;
        position: absolute;
        left: calc(50% - 270px);
        top: 110px;

        background-color: #030C14;
        border-radius: 24px;
        box-shadow: 0px 2px 60px 0px #2FA9EE33;
      
        h3 {
            margin-top: 0;
            color: white;
        }
        p {
            color: white;
        }
        p.iholder {
            text-align:right;
            margin-top: 0;
            margin-right: 5px;
            margin-bottom: 0;
            color: white;
            i {
                cursor: pointer;
            }
        }
    }
  }

h3 {
  font-size: 24px;
  font-weight: 800;
}

body {
  position: unset;
  width: 100%;
  /* min-height: calc(100vh - 200px); */
  padding: 0;
  background-size: 100%;
  margin: 0;
  overflow: auto;
  font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  background: #0A0A2C;
  background-repeat: no-repeat!important;
  background-size: cover;
  @media(max-width: 880px) {
    background: #0A0A2C;
    background-image: none!important;
    min-height: unset;
  }

  // &::-webkit-scrollbar {
  //       -webkit-appearance: none;
  //       width: 0;
  //       height: 0;
  //       display: none!important;
  //   }
}

#app {
  width: 100%;
}

svg {
  display: none!important;
}

.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid #fff;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #fff transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #0F1823;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #0085FF;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(18px);
  -ms-transform: translateX(18px);
  transform: translateX(18px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

</style>
