<script>
import { getAccount, waitForTransaction, switchNetwork, readContract, writeContract, watchAccount, watchNetwork } from '@wagmi/core'
import { useWeb3Modal } from '@web3modal/wagmi/vue'
import { ref } from 'vue';
import ERC20ABI from '../abi/ERC20.json'
import ContractABI from '../abi/contract.json'
import Web3 from 'web3'
import { copyText } from 'vue3-clipboard'
import GLOBALS from '../globals.js'
import Footer from '../components/Footer.vue'
import axios from "axios"

import { logAmplitudeEvent } from "../helpers/analytics"
const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-mainnet.g.alchemy.com/v2/jOIyWO860V1Ekgvo9-WGdjDgNr2nYxlh'));
const contractAddress = GLOBALS.CONTRACT_ADDRESS

  export default {
    components: {
        Footer
    }, 
  setup() {
    let account = getAccount()
    let currentAccountAddress = ref("")
    let modal = useWeb3Modal()
    let copyDone = ref(false)
    let reopenAfterConnection = ref(false)
    let accountActive = ref(false)
    let correctNetwork = ref(true)
    let modalActive = ref(false) 
    let ensLoaded = ref("")
    let verseBalance = ref(0);
    let verseAllowance = ref(0)
    let singleTransactionApproval = ref(false)
    let giftInputLoad = ref(false)
    let giftAddress = ref("");
    let modalLoading = ref(false)
    let loadingMessage = ref("getting wallet data")
    let buyStep = ref(0) 
    let giftTicket = ref(false); 
    let showTimer = ref(false)
    let ticketInputAddress = ref("")
    let ticketInputValid = ref(true)
    let timeoutId;
    let priceUsd = ref(0);

    async function getVersePrice() {
        try {
            let res = await axios.get("https://markets.api.bitcoin.com/coin/data?c=VERSE")
            if(res.data.priceUsd) {
                priceUsd.value = res.data.priceUsd
            }
        } catch (e) {
            console.log(e)
        }
    }
    getVersePrice()
    async function requestNetworkChange() {
        await switchNetwork({ chainId: 137 })
    }

    async function logCtaEvent(type) {
        logAmplitudeEvent({
            name: "verse scratcher CTA tapped",
            cta: type
        })
    }

    async function onTicketInputChange() {
        ticketInputValid.value = true
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
            ensLoaded.value = ""
            giftInputLoad.value = true
            if(ticketInputAddress.value.length != 42) {
                try {
                    const address = await web3.eth.ens.getAddress(ticketInputAddress.value);
                    if(address.length > 0) {
                        ensLoaded.value = "ENS name: " + ticketInputAddress.value
                        ticketInputAddress.value = address
                        ticketInputValid.value = true
                        giftInputLoad.value = false
                    } else {
                        ticketInputValid.value = false
                        giftInputLoad.value = false
                    }
            
                } catch (e) {
                    ticketInputValid.value = false
                    giftInputLoad.value = false
                }
            } else {
                giftInputLoad.value = false;
                ticketInputValid.value = true
            }
        }, 500); 

    }

    function toggleModal() {
        if(buyStep.value == 4 && modalActive.value == true) {
            loadingMessage.value = ""
            buyStep.value = 0;
            giftTicket.value = false;
            giftAddress.value == ""
            getBalance()
        }
        modalActive.value = !modalActive.value;
    }

    // handle intent to toggle modal
    const search = new URLSearchParams(window.location.search);

    if(search.get("purchase-intent") == "true") {
        toggleModal()
        search.delete("purchase-intent");
        window.history.replaceState({}, '', `${window.location.pathname}`);
    }


    function toggleSingleApproval() {
        singleTransactionApproval.value = !singleTransactionApproval.value
    }

    async function approve() {
        let approvalAmount = 30000000000000000000000000000
        if(singleTransactionApproval.value == true) {
            approvalAmount = 3000000000000000000000
        }

        loadingMessage.value = "Please confirm the approval in your connected wallet"
        modalLoading.value = true;
        try {
            const { hash } = await writeContract({
                address: '0xc708d6f2153933daa50b2d0758955be0a93a8fec',
                abi: ERC20ABI,
                functionName: 'approve',
                chainId: 137,
                args: [contractAddress, approvalAmount]
            })

             loadingMessage.value = "Processing the confirmation, please wait a moment"
             await waitForTransaction({ hash })
             getAllowance()
        } catch (e) {
            if(e.cause.code == 4001) {
                modalLoading.value = false
            }
        }
    }    

    async function purchaseTicket(_giftAddress) {
        try {
            if(_giftAddress) {
                giftAddress.value = _giftAddress
            } else {
                giftTicket.value = false;
            }
            loadingMessage.value = "Please confirm the purchase in your wallet"
            modalLoading.value = true
            let receiver = getAccount().address
            if(_giftAddress && _giftAddress.length > 0) {
                try {
                    receiver = _giftAddress
                    const { hash } = await writeContract({
                    address: contractAddress,
                    abi: ContractABI,
                    functionName: 'giftScratchTicket',
                    chainId: 137,
                    args: [receiver]
                    })
                    loadingMessage.value = "waiting for blockchain confirmation"
                    await waitForTransaction({ hash })
                } catch (e) {
                    if(e.cause.code == 4001) {
                        modalLoading.value = false
                        return 
                    }
                }
                
            } else {
                try {
                    const { hash } = await writeContract({
                    address: contractAddress,
                    abi: ContractABI,
                    functionName: 'buyScratchTicket',
                    chainId: 137,
                    args: []
                    })
                    loadingMessage.value = "waiting for blockchain confirmation"
                    await waitForTransaction({ hash })
                } catch (e) {
                    if(e.cause.code == 4001) {
                        modalLoading.value = false
                        return 
                    }
                }   
            }
            let timer = 25;  

            const countdown = setInterval(() => {
                showTimer.value = true
                timer--; 
                if(giftTicket.value == true) {
                    loadingMessage.value = `${timer} Seconds!`;
                } else {
                    loadingMessage.value = `${timer} Seconds!`;
                }

                if (timer <= 0) {
                    clearInterval(countdown);
                    modalLoading.value = false;
                    buyStep.value = 4;
                    showTimer.value = false;
                }
            }, 1000);

        } catch (e) {
            modalLoading.value = false
            console.log(e)
        }
    }
    async function getAllowance() {
        try {
            modalLoading.value = true;
            const data = await readContract({
            address: '0xc708d6f2153933daa50b2d0758955be0a93a8fec',
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [getAccount().address, contractAddress]
            })
            modalLoading.value = false;

            if(data) {
                 let dataString = data.toString()
                 verseAllowance.value= Web3.utils.fromWei(dataString, 'ether')
                 if(verseAllowance.value >= 3000 && buyStep.value < 3) {
                    buyStep.value = 3;
                }
            }
            } catch (e) {
                console.log(e)
                modalLoading.value = false;
            }
    }
    async function getBalance() {
        try {
            modalLoading.value = true;
            const data = await readContract({
            address: '0xc708d6f2153933daa50b2d0758955be0a93a8fec',
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [getAccount().address]
            })
            modalLoading.value = false;


            if(data) {
                
                 let dataString = data.toString()
                 verseBalance.value= parseFloat(dataString) / Math.pow(10, 18);
                 if(verseBalance.value >= 3000 && buyStep.value < 2) {
                    buyStep.value = 2;    
                    getAllowance()
                 } 
            }
            } catch (e) {
                console.log(e)
                modalLoading.value = false;
            }
    }
    watchNetwork((network) => {
        if(network.chain && network.chain.id != 137) {
            correctNetwork.value = false
        } else {
            correctNetwork.value = true
        }
    })
    watchAccount(async () => {
        
        if(!currentAccountAddress.value) {
            currentAccountAddress.value = getAccount().address
        }
        else {
            if(currentAccountAddress.value != getAccount().address) {
                location.reload()
            }
        }

        if(getAccount().address &&  getAccount().address.length != undefined) {
            accountActive.value = true;
            if(buyStep.value < 1) {
                buyStep.value = 1;
            }

            if(reopenAfterConnection.value == true) {
                reopenAfterConnection.value = false;
                toggleModal()
            }
            getBalance();
        } else {
            accountActive.value = false
            buyStep.value = 0;
        }
    })

    function copyText() {
        let text = `https://scratcher.verse.bitcoin.com/tickets?gift=1&address=${giftAddress.value}`
        navigator.clipboard.writeText(text);
        copyDone.value = true;

        setTimeout(() => {
            copyDone.value = false
        }, 1400)
    }

    function connectAndClose() {
        modal.open()
        reopenAfterConnection.value = true
        logAmplitudeEvent({
            name: 'connect wallet clicked'
        })
        toggleModal()
    }

    function openModal() {
        modal.open()
        logAmplitudeEvent({
                name: 'connect wallet clicked'
        })
    }

    function toggleGift()  {
        giftTicket.value = !giftTicket.value
    }

    return {
        getBalance,
        connectAndClose,
        account,
        openModal,
        buyStep,
        priceUsd,
        modal,
        accountActive,
        correctNetwork,
        approve,
        modalActive,
        toggleModal,
        modalLoading,
        giftAddress,
        copyDone,
        verseBalance,
        verseAllowance,
        loadingMessage,
        logCtaEvent,
        purchaseTicket,
        giftTicket,
        ticketInputAddress,
        copyText,
        toggleGift,
        onTicketInputChange,
        ticketInputValid,
        getAccount,
        showTimer,
        requestNetworkChange,
        ensLoaded,
        giftInputLoad,
        singleTransactionApproval,
        toggleSingleApproval
    }
  }
}
</script>

<template>
    <!-- modals -->
    <div class="backdrop" v-if="modalActive">
        <!-- modal for loading -->
        <div class="modal" v-if="modalLoading">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider" v-if="buyStep < 3">
                <div class="modal-progress p50"></div>
            </div>  
            <div class="modal-divider" v-if="buyStep >= 3">
                <div class="modal-progress p75"></div>
            </div>  
            <div class="modal-body">
                <div class="img-spinner"></div>
                <p v-if="!showTimer" class="loadingText">{{loadingMessage}}</p>
                <h3 v-if="showTimer" class="title">Payment Successful</h3>
                <p v-if="showTimer && !giftTicket" class="subtext short">Issuing ticket to your wallet and awaiting final confirmation</p>
                <p v-if="showTimer && giftTicket" class="subtext short">Issuing ticket to the chosen wallet and awaiting final confirmation</p>
                <div v-if="showTimer" class="attention-footer">
                    <p>Expected Arrival in <strong>{{loadingMessage}}</strong></p>
                </div>
            </div>
        </div>

        <!-- modal for switching network -->
        <div class="modal" v-if="correctNetwork == false">
            <div>
                <div class="modal-head">
                    <h3 class="title">Switch Network</h3>
                    <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
                </div>
                <div class="modal-body">
                    <div class="change-network"></div>
                    <h3 class="title">Wrong Network Selected</h3>
                    <p class="subtext">Verse Scratch uses the Polygon network. Please change the network in your connected wallet or click the button below to switch automatically.</p>
                    <a class="" target="_blank" @click="requestNetworkChange()"><button class="btn verse-wide">Switch Wallet to Polygon</button></a>
                </div>
            </div>
        </div>

        <!-- modal for connecting account -->
        <div class="modal" v-if="buyStep == 0 && !modalLoading && correctNetwork">
            <div>
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p25"></div>
            </div>  
            <div class="modal-body">
                <div class="img-wallet"></div>
                <h3 class="title">No Wallet Connected</h3>
                <p class="subtext short">Connect your wallet below to get started. We support all major wallet providers.</p>
                <a class="" target="_blank" @click="connectAndClose()"><button class="btn verse-wide">Connect Wallet</button></a>
                <p class="modal-footer">Haven't set up a wallet yet? Get your wallet up and running with just a few clicks at <a target="_blank" href="https://wallet.bitcoin.com/">wallet.bitcoin.com </a></p>
            </div>
            </div>
        </div>
        <!-- modal for purchasing verse -->
        <div class="modal" v-if="buyStep == 1 && !modalLoading && correctNetwork">
            <div>
                <div class="modal-head">
                    <h3 class="title">Buy Ticket</h3>
                    <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
                </div>
                <div class="modal-divider">
                    <div class="modal-progress p50"></div>
                </div>  
                <div class="modal-body">
                    <div class="img-verse"></div>
                    <h3 class="title">Not Enough Verse</h3>
                    <p class="subtext short">You need <span>3000 VERSE</span> on Polygon in order to purchase a ticket</p>

                    <div class="wallet-balance">
                        <p class="balance-title">WALLET BALANCE</p>
                        <p class="balance">{{ verseBalance ? verseBalance.toFixed(2) : 0 }} VERSE</p>
                    </div>
                    <a class="" target="_blank" href="https://verse.bitcoin.com/" @click="logCtaEvent('buy')"><button class="btn verse-wide half">Buy VERSE</button></a>
                    <a class="" target="_blank" href="https://wallet.polygon.technology/polygon/bridge" @click="logCtaEvent('bridge')"><button class="btn verse-wide half secondary">Bridge VERSE</button></a>
                    <p class="modal-footer">Already bought VERSE? Click <a @click="getBalance()">here</a> to refresh your balance</p>
                </div>
            </div>
        </div>

        <!-- allowance modal -->
        <div class="modal" v-if="buyStep == 2 && !modalLoading && correctNetwork">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p50"></div>
            </div>  
            <div class="modal-body">
                <div class="img-approve"></div>
                <h3 class="title">Approve the use of VERSE</h3>
                <p class="subtext">You need to enable the use of at least <span>3000 VERSE</span>. This is used to pay for your ticket. </p>
                <div class="gift-toggle-holder">
                            <h3 class="title">Allow for one transaction only</h3>
                            <label class="switch">
                            <input type="checkbox" v-on:change="toggleSingleApproval">
                                <span class="slider round"></span>
                            </label>
                        </div>
                <a class="" target="_blank" @click="approve()"><button class="btn verse-wide">Allow the use of VERSE</button></a>
                <p class="modal-footer">All tokens on the Polygon network require an approval transaction before they can be spent. <a target="blank" href="https://revoke.cash/learn/approvals/what-are-token-approvals">learn more here.</a></p>
            </div>
        </div>
        <!-- purchase modal post approval -->
        <div class="modal" v-if="buyStep == 3 && !modalLoading && correctNetwork">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p75"></div>
            </div>  
            <div class="modal-body">
                <div class="img-purchase"></div>
                <h3 class="title">Buy Ticket</h3>
                <p class="subtext">You have at least <span>3000 VERSE</span> in your wallet, and you've given approval for its use. All that remains is to purchase your ticket.</p>
                <div class="gift-toggle-holder" :class="{ opened: giftTicket }">
                    <h3 class="title">Send ticket as gift?</h3>
                    <label class="switch">
                    <input type="checkbox" :checked="giftTicket" v-on:change="toggleGift">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="gift-toggle-holder-bottom" v-if="giftTicket">
                    <p>Please provide us with the Polygon wallet address of the person you want to gift the ticket to.</p>
                    <input placeholder="Polygon Address" class="giftInput" @input="onTicketInputChange" style="color: white;" v-model="ticketInputAddress" type="text" v-if="giftTicket == true">
                    <p v-if="ensLoaded.length > 0" style="color: white; text-align: center;  margin-top: 5px;  font-weight: 500"><small>{{ ensLoaded }}</small></p>
                    <p  v-if="!ticketInputValid && ticketInputAddress.length > 0" style="margin-top: 11px; color: #c6bfff; text-align: center; font-weight: 500"><small>address is not valid</small></p>
                </div>  

                <div v-if="!giftTicket">
                    <a class="" target="_blank" @click="purchaseTicket()" ><button class="btn verse-wide">Buy a Ticket</button></a>
                </div>

                <div v-if="giftInputLoad && giftTicket">
                    <a class="" target="_blank" ><button class="btn verse-wide disabled">Checking Address</button></a>
                </div>

                <div v-if="giftInputLoad == false && giftTicket">
                    <a class="" target="_blank" @click="purchaseTicket(ticketInputAddress)" v-if="giftTicket && ticketInputValid && ticketInputAddress.length > 0"><button class="btn verse-wide">Buy a Ticket</button></a>
                    <a class="" target="_blank" v-if="ticketInputAddress.length == 0 && giftTicket"><button class="btn verse-wide disabled">Submit an Address</button></a>
                    <a class="" target="_blank" v-if="giftTicket && !ticketInputValid && ticketInputAddress.length > 0"><button class="btn verse-wide disabled">Input Valid Address</button></a>
                </div>
            </div>
        </div>

        <!-- normal finish -->
        <div class="modal" v-if="buyStep == 4 && !modalLoading && correctNetwork">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p100"></div>
            </div>  
            <div class="modal-body">
                <div>
                    <div class="img-success"></div>
                    <!-- gifted ticket delivery -->
                    <div v-if="giftTicket">
                        <h3 class="title">Ticket Purchased & Gifted!</h3>
                        <p class="subtext">The ticket has been sent to the your specified wallet! Share the following link to let them know:</p>

                        <div class="ticketfield">
                            <input class="ticketlink" type="text" :value="`https://scratcher.verse.bitcoin.com/tickets?gift=1&address=${giftAddress}`">
                            <button style="cursor:pointer" v-if="!copyDone" class="btn-copy" @click="() => copyText()">copy</button>
                            <button style="cursor:pointer" v-if="copyDone" class="btn-copy" @click="() => copyText()">copied</button>
                        </div>
                        <a class="" href="/"><button class="btn verse-wide half extraTop extraTopMobile" style="margin-left: 0">Buy Another Ticket</button></a>
                        <a class="" href="/tickets"><button class="btn verse-wide half secondary extraTop"  style="margin-right: 0">View your tickets</button></a>
                    </div>
                    <!-- normal ticket delivery -->
                    <div v-if="!giftTicket">
                        <h3 class="title">Ticket Purchased!</h3>
                        <p class="subtext short" style="margin-bottom: 0;">Time to scratch your ticket and test your luck!</p>
                        <a class="" href="/tickets"><button class="btn verse-wide">View Your Ticket</button></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- <div class="wrongNetworkWarning" v-if="correctNetwork == false">
        <p><i class="fa fa-warning" style="margin-right: 10px; margin-left: 5px;"></i>Wallet connected to the wrong network, please switch your wallet to Polygon</p>
    </div> -->
    <div class="page">
        <div class="jumbo-mob">
            <img  src="../assets/cover.png">
        </div>
        <div class="float-holder clearfix">
            <div class="card-info">
                <h2>SCRATCH & WIN</h2>
                <p class="top-meta">Unveiling our first space expedition themed Scratch Tickets powered by VERSE - your instant path to fun and fortune</p>
                <div class="topblock">
                    <p>JACKPOT</p>
                    <h2>1,000,000 VERSE</h2>
                    <p v-if="priceUsd" class="usd">{{ (priceUsd * 1000000).toFixed() }} USD</p>
                </div>
                <div class="splitblock">
                    <div class="block leftblock">
                        <p>PRICE PER TICKET</p>
                        <h2>3,000 VERSE</h2>
                        <p v-if="priceUsd" class="usd">{{ (priceUsd * 3000).toFixed() }} USD</p>
                    </div>
                    <div class="block rightblock">
                        <p>OTHER PRIZES</p>
                        <h2>100 - 100k VERSE</h2>
                        <p v-if="priceUsd" class="usd">{{ (priceUsd * 100).toFixed(2) }} - {{ (priceUsd * 100000).toFixed() }}  USD</p>
                    </div>
                </div>
                <button class="btn verse-wide" @click="toggleModal(); logCtaEvent('buy ticket')">Buy Ticket</button>
                <a @click="openModal()" v-if="!accountActive"><button class="btn verse-wide secondary" style="margin-top: 10px!important;">Connect Wallet</button></a>
                <a href="/tickets" v-if="accountActive"><button class="btn verse-wide secondary" style="margin-top: 10px!important;">View My Tickets</button></a>

                <p class="terms-link">*Self custodial and verifiably random, powered by smart contracts and Chainlink VRF. <a target="_blank" href="https://support.bitcoin.com/en/articles/8607322-verse-scratcher-faq">Learn More</a></p>
            </div>

        <div class="card-holder">
            <img class=""  src="../assets/cover.png">
        </div>
        </div>
        <Footer />
    </div>
</template>

<style lang="scss" scoped>
.terms-link {
    font-size: 12px;
    margin-top: 16px;
    font-weight: 400!important;
    text-align: center;
    color: #899BB5;
    a {
        color: #0085FF;
        cursor: pointer;
        text-decoration: none;
    }
}
p.usd {
    color: white!important;
    font-size: 12px;
}
.jumbo-mob {
    background-image: url("../assets/bg.png")!important;
    height: 211px;
    background-size: cover;
    width: 100%;
    justify-content: center;
    display: flex;
    img {
        max-width: 100%;
        margin-top: 20px;
        background-size: cover;
    }
    @media(min-width: 881px) {
        display: none;
    }
}
.splitblock {
    width: 100%;
    .block {
        width: calc(49% - 24px)!important;
        float: left;
        padding: 0;
        margin-top: 8px;
        border-radius: 12px;
        padding: 12px;
        text-align: center;
        @media(max-width: 880px) {
            width: calc(49% - 24px)!important;
            margin: 0;
            margin-top: 8px;
        }
        &.leftblock {
            background: #4C3777;
            margin-right: 2%!important;
            @media(max-width: 880px) {
                margin-right: 2%!important;
            }
            h2 {
                font-size: 17px;
                text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
                @media(max-width: 1100px) {
                 font-size: 17px;
                }
                @media(max-width: 930px) {
                 font-size: 15px;
                }
            }
            p {
                margin-top: 2px;
                margin-bottom: 2px;
                font-size: 12px;
                color: #D2BDFF;
            }
        }
        &.rightblock {
            background: #6E376F;
            h2 {
                font-size: 17px;
                text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
                @media(max-width: 1100px) {
                 font-size: 17px;
                }
                @media(max-width: 930px) {
                 font-size: 15px;
                }
            }
            p {
                margin-top: 2px;
                margin-bottom: 2px;
                font-size: 12px;
                color: #F7C0F8;
            }
        }
    }
}
.topblock {
    padding: 12px;
    width: calc(100% - 24px);
    background: #363E82;
    border-radius: 12px;
    p {
        margin: 0;
        text-align: center;
        font-weight: 600;
        color: #BFD9FF;
    }
    h2 {
        font-weight: 800;
        font-size: 32px;
        text-align: center;
        text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
    }
}
.top-meta {
    font-weight: 500;
    font-size: 14px;
    color: #C5CEDB;
    text-align: center;
    margin-top: 0;
}

.btn-copy {
    height: 24px;
    position: absolute;

    width: 55px;
    border: none;
    right: 10px;
    top: 32px;
    font-size: 12px;
    color: white;
    background: linear-gradient(180deg, #0EBEF0 0%, #0085FF 100%);
    padding: 0px, 12px, 0px, 12px;
    border-radius: 100px;
}

.ticketfield {
    position: relative;
}
.ticketlink {
    height: 46px; 
    padding-left: 10px;
    padding-right: 80px;
    position: relative;
    width: calc(100% - 90px);
    font-size: 16px;
    font-weight: 500;
    background-color: #030C14;
    border: 1px solid #313E57;
    color: white;
    margin-top: 20px;
    border-radius: 12px;
}

.giftInput {
    outline: none;
    width: calc(100% - 18px);
    font-family: 'Barlow', sans-serif;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    height: 48px;
    padding-bottom: 2px;
    margin-top: 16px;
    color: #899BB5;
    background-color: #030C14;
    border: 1px solid #0085FF;
    padding-left: 16px;
    font-size: 16px;
}

.wrongNetworkWarning {
    @media(max-width: 880px) {
        font-size: 13px;
        width: calc(100% - 10px);
        padding-left: 15px;
        color: white;
        font-weight: 600;
        padding-bottom: 13px;
        padding-top: 10px;
    }
    z-index: 1;
    position: fixed;
    width: 100%;
    left: 0;
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 30px;
    background-color: #4a42aa;
    color: #fff; 
    p {
        font-weight: 600;
        max-width: 80rem;
        margin: 0px auto;
        @media(max-width: 880px) {
            margin-left: 0;
            max-width: 95%;
        }
    }
}

.clearfix {
    overflow: auto;
    max-width: 1600px;
    width: 100%;
    @media(max-width: 880px) {
        width: 100%!important;
        position: unset;
    }
}
.float-holder{
    margin-top: 40px!important;
    margin: 0 auto;
    min-height: calc(100vh - 188px);
    min-height: calc(100dvh - 188px);
    @media(max-width: 880px) {
        min-height: calc(100vh - 170px); 
        min-height: calc(100dvh - 170px); 
        margin-top: 0!important;
    }
}
.blocks {
    height: 210px;
    width: 750px;
    .block {
        float: left;
        margin-right: 10px; 
        width: 205px;
        border-radius: 15px;
        height: 150px;
        background-color: #11111d;
        box-shadow: 0 0 20px rgba(17, 17, 29, 0.7);
        padding: 15px;

        h5 {
            margin-top: 0;
            text-align: center;
        }

        h3 {
            text-align: center;
            margin: 0;
            font-size: 30px;
            i {
                color: #c6bfff;
            }
        }

        p {
            text-align: center;
            font-size: 14px;
            color: #777;
            font-weight: 300;
            margin-bottom: 0;
        }
    }
}
.card-info {
    padding: 30px;
    padding-top: 60px;
    float: left;
    padding-left: 100px;
    width: 27%;
    color: white;
    padding-right: 0;
    @media(max-width: 880px) {
        width: calc(100% - 30px)!important;
        padding: 15px;
        padding-bottom: 50px;
    }

    h2 {
        margin: 0;
        font-size: 40px;
        font-weight: 800;
        text-align: center;

    }
    h3 {
        margin-bottom: 40px;
    }
    p {
        font-weight: 500;
    }
}

.card-holder {
    @media(max-width: 880px) {
        display: none;
    }
    @media(max-width: 1000px) {
        margin-top: 115px!important;
    }
    margin-left: 5%;
    float: left;
    width: 52%;
    margin-top: 70px;
    border-radius: 6px;
    padding-left: 0px;
    background-color: transparent;

    img {
        border-radius: 8px;
        width: 100%;
        }
    
    h2 {
        text-align: center;
    }
    .info {
        color: white;
        text-align: center;
        font-size: 14px;
        width: 100%;
    }
}
.page {
    @media(max-width: 880px) {
        width: 100%;
        padding-top: 0px;
        height: calc(100vh - 60px);
        height: calc(100dvh - 60px);
        overflow-y: scroll;
        overflow-x: scroll;
    }

    @media(max-width: 980px) {
        padding-top: 0;
    }
    height: unset;
    min-height: calc(100vh - 100px);
    min-height: calc(100dvh - 100px);
    width: 100%;
    padding-top: 50px;
}
</style>