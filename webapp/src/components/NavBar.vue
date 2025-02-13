<script>
import { getAccount, watchAccount, disconnect, getNetwork } from '@wagmi/core'
import { useWeb3Modal } from '@web3modal/wagmi/vue'
import { ref } from 'vue';
import { logAmplitudeEvent } from "../helpers/analytics";
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import ethIcon from '@/assets/icons/eth.png';
import plyIcon from '@/assets/icons/ply.png';
import smartBchIcon from '@/assets/icons/smartbch.png';

export default {
    setup() {
        let account = getAccount()
        let modal = useWeb3Modal()
        let isWallet = ref(false)
        let accountActive = ref(false)
        let connectedProvider = ref("")
        let ensUserName = ref("")
        let options = [
            // {
            //     label: 'Ethereum',
            //     chain: 1,
            //     icon: ethIcon,
            // },
            {
                label: 'Polygon',
                chain: 137,
                icon: plyIcon,
            },
            // {
            //     label: 'SmartBCH',
            //     chain: 10000,
            //     icon: smartBchIcon,
            // },
        ];
        let isOpen = ref(false)
        let selectedOption = ref(options[0]);

        sessionStorage.getItem('isWallet') === "true" ? isWallet.value = true : isWallet.value = false

        function toggleDropdown() {
            isOpen.value = !isOpen.value;
        }

        function selectOption(option) {
            selectedOption.value = option;
            isOpen.value = false;
        }

        function openWalletModal(refresh) {            
            if(refresh) disconnect()
            modal.open()
            logAmplitudeEvent({
                name: 'connect wallet clicked'
            })
        }

        function handleHome(newTab) {
            const openUrl = (url, newTab) => {
                if(newTab) {
                    window.open(url,"_blank")
                } else {
                    window.open(url,"_self")
                }
            }
            if(window.location.pathname == '/') {
               openUrl("https://verse.bitcoin.com" ,newTab)
            } else {
               openUrl("/")
            }
        }

        const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

        function truncateEthAddress(address) {
            const match = address.match(truncateRegex);
            if (!match) return address;
            return `${match[1]}…${match[2]}`;
        };

        watchAccount(async (account) => { 
        if(account.isConnected == true) {
            accountActive.value = true;
            let { chain  } = getNetwork()
            
            const publicClient = createPublicClient({ 
                chain: mainnet,
                transport: http()
            })

            const ensName = await publicClient.getEnsName({
                address: getAccount().address
            })
            if(ensName) ensUserName.value = ensName

            logAmplitudeEvent({
                name: 'connect wallet result',
                blockchain: 'MATIC',
            })
        } else {
            console.log("account not active")
            accountActive.value = false
        }
        connectedProvider.value = account.connector.name.toLowerCase()
    })

        return { account, isWallet, toggleDropdown, selectedOption, selectOption, options, isOpen, handleHome, ensUserName, openWalletModal, accountActive, truncateEthAddress, getAccount, connectedProvider} 
    }
    
}
</script>

<template>
    <div class="navbar-mobile">
        <a v-if="!isWallet" @click="handleHome(true)">
            <div class="nav-chev"></div>
            <div class="nav-verse"></div>
        </a>
        <a v-if="isWallet" @click="handleHome()">
            <div class="nav-chev"></div>
            <div class="nav-verse"></div>
        </a>
        <h3 class="title-nav">Verse Scratcher</h3>
        <div class="mobile-btn-wrap">
            <button 
                    @click="toggleDropdown()"
                    class="btn verse-nav-chain">
                    <img :src="selectedOption.icon" :alt="selectedOption.label" height="24px" width="24px"/>
                    <img src="@/assets/icons/chevron.svg" alt="Chevron" height="5px" width="10px"/>
                </button>
                <div v-if="isOpen" class="dropdown">
                    <div 
                        v-for="option in options" 
                        :key="option.label" 
                        @click="selectOption(option)"
                        class="chain-option">
                        <img :src="option.icon" :alt="option.label" height="24px" width="24px"/>
                        {{ option.label }}
                    </div>
                </div>        
            <button class="btn verse-nav" v-if="!accountActive" @click="openWalletModal(true)">Connect</button>
            <button class="btn verse-nav mobile connected" v-if="accountActive && !isWallet" @click="openWalletModal(false)"><div :class="'provider-logo ' + connectedProvider"></div></button>
            <button class="btn verse-nav mobile connected" v-if="accountActive && isWallet" @click="openWalletModal(false)"><div :class="'provider-logo bitcoin'"></div></button>        

        </div>

    </div>
    <div class="navbar">
        <a style="cursor: pointer;" href="/">
            <div class="logo">
                <a v-if="!isWallet" @click="handleHome(true)">
                    <div class="nav-chev"></div>
                    <div class="nav-verse"></div>
                </a>
                <a v-if="isWallet" @click="handleHome()">
                    <div class="nav-chev"></div>
                    <div class="nav-verse"></div>
                </a>
            </div>
        </a>
        <h3 class="title-nav-desk">Verse Scratcher</h3>

        <div class="wallet">
            <div class="chain-btn">
                <button 
                    @click="toggleDropdown()"
                    class="btn verse-nav-chain">
                    <img :src="selectedOption.icon" :alt="selectedOption.label" height="24px" width="24px"/>
                    {{ selectedOption.label }}
                    <img src="@/assets/icons/chevron.svg" alt="Chevron" height="5px" width="10px"/>
                </button>
                <div v-if="isOpen" class="dropdown">
                    <div 
                        v-for="option in options" 
                        :key="option.label" 
                        @click="selectOption(option)"
                        class="chain-option">
                        <img :src="option.icon" :alt="option.label" height="24px" width="24px"/>
                        {{ option.label }}
                    </div>
                </div>
            </div>
            <button class="btn verse-nav" v-if="!accountActive" @click="openWalletModal(true)">Connect</button>
            <div v-if="ensUserName">
                <button class="btn verse-nav connected" v-if="accountActive && !isWallet" @click="openWalletModal(false)">{{ ensUserName}} <div :class="'provider-logo ' + connectedProvider"></div></button>
                 <button class="btn verse-nav connected" v-if="accountActive && isWallet" @click="openWalletModal(false)">{{ ensUserName }} <div :class="'provider-logo bitcoin'"></div></button>
            </div>
            <div v-if="!ensUserName">
                <button class="btn verse-nav connected" v-if="accountActive && !isWallet" @click="openWalletModal(false)">{{truncateEthAddress(getAccount().address || "")}} <div :class="'provider-logo ' + connectedProvider"></div></button>
                 <button class="btn verse-nav connected" v-if="accountActive && isWallet" @click="openWalletModal(false)">{{truncateEthAddress(getAccount().address || "")}} <div :class="'provider-logo bitcoin'"></div></button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.title-nav-desk {
    color: white;
    position: absolute;
    left: calc(50% - 200px);
    top: 20px;
    text-align: center;
    width: 400px;
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    margin: 0 auto;
    font-size: 22px;
    font-weight: 600;
}

.verse-nav {
    border: none;
    outline: none;
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    text-wrap: nowrap;
    border-radius: 100px;
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
    font-weight: 500;
    color: rgb(255, 255, 255);
    font-size: 14px;
    height: 36px;
    padding: 0px 16px;
    position: relative;
    &.mobile {
        padding-right: 21px!important;
        background: #3f526e!important;
        background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
    }
    &.connected {
        background: #202B58;
        padding-right: 40px;
    }


    .provider-logo {
        position: absolute; 
        width: 28px;
        height: 28px;
        border-radius: 50%;
        right: 5.2px;
        top: 4.5px;
        background-size: cover;

        &.bitcoin {
            background-image: url("./../assets/icons/bitcoincom.png");
            right: 4.3px;
            top: 4.2px;
        }
        &.walletconnect {
            background-image: url("./../assets/icons/wc-logo.png");
            right: 4.3px;
            top: 4.2px;
        }

        &.metamask {
            background-image: url("./../assets/icons/mm-logo.png");
            right: 5.3px;
            top: 4.5px;
        }
        &.rabby {
            width: 26px;
            height: 22px;
            border-radius: 0;
            top: -5px;
            right: -5px;
            border-radius: 50%;
            background-image: url("./../assets/icons/rabby.png");
            background-size: cover;
            @media(max-width: 880px) {
                width: 28px;
                height: 28px;
                top: 4.5px;
                right: 4.3px;
            }
        }
    }
    &:hover {
        background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
    }
    &:active {
        background: linear-gradient(90deg, #2569fa 0%, #9333ea 100%);
    }
}
.btn-connect {
    @media(max-width: 880px) {
    width: 100%;
    position: fixed;
    bottom: 0;
    font-weight: 500;
    font-size: 15px;
    left: 0;
    height: 50px;
    background-color: #2f2b5d;
    border-radius: 0;
    color: white;
    border: none;
    }
    margin-top: 2px;
    border: none;
    width: 140px;
    border-radius: 10px;
    font-weight: 800;
    padding: 5px 20px;
    height: 40px;
    background-color: transparent;
    border: 1px solid white;
    color: white;
    cursor: pointer;
}

    a {
        .nav-chev {
            position: absolute;
            left: 17px;
            top: 24px;
            background-image: url("./../assets/icons/chev.png");
            background-size: cover;
            width: 20px;
            height: 20px;
        }

        .nav-verse {
            position: absolute;
            left: 36px;
            top: 18px;
            background-image: url("./../assets/icons/logo-full.png");
            background-size: cover;
            width: 119px;
            height: 34px;
        }
    }

    .navbar-mobile {
        background-color: black;
        width: 100%;
        height: 56px;
        background: #0A0A2C;

        .toggle-mobile {
            background: linear-gradient(180deg, #425472 0%, #313E57 100%);
            width: fit-content;
            height: 36px;
            padding: 4px 8px 4px 4px;
            gap: 8px;
            border-radius: 40px;
            opacity: 0px;
            position: absolute;
            right: 60px;
            top: 10px;
        }

        .mobile-btn-wrap {
            position: absolute;
            right: 16px;
            top: 10px;
            width: fit-content;
            display: flex;
            gap: 10px;
        }

        .title-nav {
            color:#FFFFFF;
            margin: 0;
            position: absolute;
            left: 80px;
            top: 17.5px;
            font-size:16px;
            font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: white;
            font-weight: 800;
        }

        a {
            .nav-chev {
                position: absolute;
                left: 8px;
                top: 18px;
                background-image: url("./../assets/icons/chev.png");
                background-size: cover;
                width: 20px;
                height: 20px;
            }

            .nav-verse {
                position: absolute;
                left: 28px;
                top: 10px;
                background-image: url("./../assets/icons/verse-mob.png");
                background-size: cover;
                width: 36px;
                height: 36px;
            }
        }

        @media(min-width: 880px) {
            display: none;
        }
       
    }

    .navbar {
        @media(max-width: 879px) {
            display: none;
        }
        z-index: 2;
        position: fixed;
        top: 0;
        display: block;
        width: 100%;
        left: 0;
        height: 70px;
        background: #0A0A2C;

        div.logo {
            color: white;
            padding-left: 30px;
            width: 32%;
            position: absolute;
            margin: 0;
            float: left;
            @media(max-width: 880px) {
                width: 100%;
            }
 
        }
        div.links { 
            @media(max-width: 880px) {
            width: 100%!important;
            padding-top: 0;
            }
            margin: 0;
            padding-top: 10px;
            float: left;
            width: 32%;
            text-align: center;
            ul {
            @media(max-width: 880px) {
                padding-left: 0;
                margin-top: 0;
            }
            display: inline-block;
            margin-left: 0 auto;
            list-style-type: none;
                li {
                    
                    float: left;
                    margin-right: 20px;

                    a{
                        text-decoration: none;
                        color: #c6bfff;
                        font-weight: 500;
                    }
                }
            }
        }
        div.wallet {
            @media(max-width: 930px) {
                display: none;
            }
            display: flex;
            flex-direction: row;
            gap: 5px;
            margin: 0;
            margin-top: 10px;
            margin-right: 10px;
            float: right;
            padding-top: 5px;
            text-align: right;

            h5 {
                font-weight: 400;
                color: #c6bfff;
                margin-right: 20px;
            }
        }
    }

.chain-btn {
    position: relative;
}

.verse-nav-chain {
    border: none;
    outline: none;
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    text-wrap: nowrap;
    border-radius: 100px;
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    background: #202B58;
    min-width: 150px;
    font-weight: 500;
    color: rgb(255, 255, 255);
    font-size: 14px;
    height: 36px;
    padding: 0px 16px;
    position: relative;
    display: flex;
    gap: 10px;
    @media(max-width: 880px) {
        min-width: unset;
        height: 36px;
        padding: 4px 8px 4px 4px;
        gap: 8px;
    }
}
.chain-option {
    width: 100%;
    height: 40px;
    padding: 0px 24px;
    gap: 10px;
    box-sizing: border-box;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
}
.dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 16px 1px;
    background: #0A0A2C;
    box-shadow: 0px 2px 60px 0px #2FA9EE33;
    width: 240px;
    border-radius: 12px;
    color: #C5CEDB;
    font-family: Barlow;
    font-weight: 500;
    font-size: 16px;
    line-height: 19.2px;
    @media(max-width: 880px) {
        position: fixed;
        border-radius: 0;
        top: 56px;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        overflow-y: auto;
        box-shadow: none;
        border-top: 1px solid #1A2231;
    }
}
.toggle {
    background: #202B58;
    display: flex;
    flex-direction: row;
    padding: 16px 4px 4px;
    box-shadow: 0px 1px 1px 0px #FFFFFF26 inset;
    width: fit-content;
    height: 36px;
    padding: 0px 16px 0px 4px;
    gap: 10px;
    border-radius: 40px 0px 0px 0px;
    opacity: 0px;

}

</style>