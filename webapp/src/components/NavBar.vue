<script>
import { getAccount, watchAccount, disconnect, switchChain, getChainId } from '@wagmi/core'
import { useAppKit } from '@reown/appkit/vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { logAmplitudeEvent } from "../helpers/analytics";
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import core from "../core"
import { store } from '../store.js'
import globals from "../globals";

export default {
    setup() {
        let walletInfo = ref(null)
        let accountRef = ref(getAccount(core.config))
        let truncatedAddress = computed(() => truncateEthAddress(accountRef.value.address ?? ""))
        let modal = useAppKit()
        let accountActive = computed(() => accountRef.value.isConnected)
        let ensUserName = ref(null);
        let dropdownRef = ref(null);
        let isOpen = ref(false)
        let chains = globals.CHAINS;
        const selectedChain = ref(store.getSelectedChain())

        function toggleDropdown() {
            isOpen.value = !isOpen.value;
        }

        const selectOption = async (chain) => {
            const chainId = getChainId(core.config)
            selectedChain.value = chain; // Update selectedChain directly
            isOpen.value = false; // Close dropdown after selection
            try {
                if (chainId !== chain.chain) {
                    await switchChain(core.config, { chainId: chain.chain })
                }
            } catch (e) {
                console.log('ERROR', e);
            }
        }
        function handleClickOutside(event) {
            if (isOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
                isOpen.value = false;
            }
        }
        watch(selectedChain, (newChain) => {
            store.setSelectedChain(newChain);
        });
        onMounted(() => {
            setTimeout(() => {
                document.addEventListener("click", handleClickOutside);
            }, 0); // Delays event binding to ensure refs are assigned
        });
        onUnmounted(() => {
            document.removeEventListener("click", handleClickOutside);
        });
        function openWalletModal(refresh) {            
            if(refresh) disconnect(core.config)
            modal.open()
            logAmplitudeEvent({
                name: 'connect wallet clicked'
            })
        }

        function handleHome(newTab) {
            if(window.location.pathname == '/') {
                window.open("https://verse.bitcoin.com", newTab ? "_blank" : "_self")
            } else {
                window.open("/", "_self")
            }
        }

        const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

        function truncateEthAddress(address) {
            const match = address.match(truncateRegex);
            if (!match) return address;
            return `${match[1]}…${match[2]}`;
        };

        watchAccount(core.config, {
            onChange: async (account) => { 
                accountRef.value = account

                if(account.connector) {
                    if(account.connector.name === "WalletConnect") {
                        const metadata = (await account.connector.getProvider?.())?.signer?.session?.peer.metadata
                        walletInfo.value = metadata ? { name: metadata.name, icon: metadata.icons[0] } : null
                    } else {
                        const { name, icon } = account.connector
                        walletInfo.value = { name, icon }
                    }
                }

                if(!account.isConnected) {
                    console.log("account not active")
                    return
                }

                const publicClient = createPublicClient({ 
                    chain: mainnet,
                    transport: http()
                })

                const ensName = await publicClient.getEnsName({
                    address: account.address
                })
                ensUserName.value = ensName

                logAmplitudeEvent({
                    name: 'connect wallet result',
                    blockchain: 'MATIC',
                })
            }
        })

        return {selectedChain, chains, dropdownRef, toggleDropdown, selectOption, isOpen, isWallet: core.isWallet, walletInfo, handleHome, ensUserName, openWalletModal, accountActive, truncatedAddress } 
    }
    
}

</script>

<template>
    <div class="navbar-mobile">
        <a @click="handleHome(!isWallet)">
            <div class="nav-chev"></div>
            <div class="nav-verse"></div>
        </a>
        <h3 class="title-nav">Verse Scratcher</h3>
        <div class="mobile-btn-wrap">
            <button 
                @click.stop="toggleDropdown()"
                class="btn verse-nav-chain">
                <img :src="selectedChain.icon" :alt="selectedChain.label" height="24px" width="24px"/>
                <img src="@/assets/icons/chevron.svg" alt="Chevron" height="5px" width="10px"/>
            </button>
            <div v-if="isOpen" class="dropdown" ref="dropdownRef">
                <div 
                    v-for="chain in chains" 
                    :key="chain.label" 
                    @click="selectOption(chain)"
                    class="chain-option">
                    <img :src="chain.icon" :alt="chain.label" height="24px" width="24px"/>
                    {{ chain.label }}
                </div>
            </div>
            <button class="btn verse-nav" v-if="!accountActive" @click="openWalletModal(true)">Connect</button>
            <button class="btn verse-nav mobile connected" v-if="accountActive" @click="openWalletModal(false)">
                <img v-if="!!walletInfo" :src="walletInfo.icon" :alt="walletInfo.name" class="provider-logo"/>
            </button>
        </div>
    </div>
    <div class="navbar">
        <a style="cursor: pointer;" href="/">
            <div class="logo">
                <a @click="handleHome(!isWallet)">
                    <div class="nav-chev"></div>
                    <div class="nav-verse"></div>
                </a>
            </div>
        </a>
        <h3 class="title-nav-desk">Verse Scratcher</h3>

        <div class="wallet">
            <div class="chain-btn">
                <button 
                    @click.stop="toggleDropdown()"
                    class="btn verse-nav-chain">
                    <img :src="selectedChain.icon" :alt="selectedChain.label" height="24px" width="24px"/>
                    {{ selectedChain.label }}
                    <img src="@/assets/icons/chevron.svg" alt="Chevron" height="5px" width="10px"/>
                </button>
                <div v-if="isOpen" class="dropdown" ref="dropdownRef">
                    <div 
                        v-for="chain in chains" 
                        :key="chain.label" 
                        @click="selectOption(chain)"
                        class="chain-option">
                        <img :src="chain.icon" :alt="chain.label" height="24px" width="24px"/>
                        {{ chain.label }}
                    </div>
                </div>
            </div>
            <button class="btn verse-nav" v-if="!accountActive" @click="openWalletModal(true)">Connect Wallet</button>
            <div>
                <button class="btn verse-nav connected" v-if="accountActive" @click="openWalletModal(false)">
                    {{ ensUserName ?? truncatedAddress }} 
                    <img v-if="!!walletInfo" :src="walletInfo.icon" :alt="walletInfo.name" class="provider-logo"/>
                </button>
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
            margin: 0;
            margin-top: 10px;
            margin-right: 10px;
            float: right;
            padding-top: 5px;
            text-align: right;
            display: flex;
            gap: 10px;
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