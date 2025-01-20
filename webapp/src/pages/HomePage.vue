<script>
import { getAccount, waitForTransaction, switchNetwork, readContract, writeContract, disconnect, watchAccount, watchNetwork } from '@wagmi/core'
import { useWeb3Modal } from '@web3modal/wagmi/vue'
import { ref, computed, watch, registerRuntimeCompiler } from 'vue';
import ERC20ABI from '../abi/ERC20.json'
import ContractABI from '../abi/contract.json'
import Web3 from 'web3'
import { copyText } from 'vue3-clipboard'
import Footer from '../components/Footer.vue'
import axios from "axios"
import { store } from '../store.js'
import { logAmplitudeEvent } from "../helpers/analytics"


const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-mainnet.g.alchemy.com/v2/jOIyWO860V1Ekgvo9-WGdjDgNr2nYxlh'));

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
    let loadingMessage = ref("Getting Wallet Data")
    let txHash = ref("")
    let buyStep = ref(0) 
    let giftTicket = ref(false); 
    let showTimer = ref(false)
    let ticketInputAddress = ref("")
    let ticketInputValid = ref(true)
    let timeoutId;
    let priceUsd = ref(0)
    let purchaseAmount = ref(1)

    const products = computed(() => store.getProducts().filter(product => product.active == true));
    const activeProduct = computed(() => store.getProduct())
    const randomOtherProduct = computed(() => store.getRandomOtherProduct())
    const selectedProductId = computed({
      get: () => store.productId,
      set: (value) => {
        store.updateProduct(value)
      }
    })
    
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

    const validatedAmount = computed(() => {
        if (purchaseAmount.value > 50) {
            return 50;
        } else if (purchaseAmount.value < 1) {
            return 1;
        }
        return purchaseAmount.value;
    })

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
        if(modalActive.value == true) {
            loadingMessage.value = ""
            buyStep.value = 2;
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
        txHash.value = ""
        let approvalAmount = 30000000000000000000000000000
        if(singleTransactionApproval.value == true) {
            let amount = activeProduct.value.ticketPrice * validatedAmount.value
            approvalAmount = Web3.utils.toWei(amount, 'ether');
        }

        loadingMessage.value = "Please confirm the approval in your connected wallet"
        modalLoading.value = true;
        try {
            const { hash } = await writeContract({
                address: '0xc708d6f2153933daa50b2d0758955be0a93a8fec',
                abi: ERC20ABI,
                functionName: 'approve',
                gas: 75000n,
                chainId: 137,
                args: [activeProduct.value.contractAddress, approvalAmount]
            })
             txHash.value = hash
             loadingMessage.value = "Processing the confirmation. Please wait a moment"
             await waitForTransaction({ hash })
             buyStep.value = 4;
             getAllowance()
        } catch (e) {
            console.log(e)
            modalLoading.value = false
        }
    }    

    const startTimer = () => {
        let timer = 25;  
        const countdown = setInterval(() => {
            showTimer.value = true
            timer--; 
            loadingMessage.value = `${timer} Seconds!`;

            if (timer <= 0) {
                clearInterval(countdown);
                modalLoading.value = false;
                buyStep.value = 5;
                showTimer.value = false;
            }
        }, 1000);
    }

    async function multiBuy(_giftAddress) {
        txHash.value = ""
        if(validatedAmount.value < 2) {
            return 
        }
        let receiver = getAccount().address
        if(_giftAddress) {
         giftAddress.value = _giftAddress
        } else {
            giftTicket.value = false;
        }
        loadingMessage.value = "Please confirm the purchase in your wallet"
        modalLoading.value = true
        if(_giftAddress && _giftAddress.length > 0) receiver = _giftAddress

        try {
            const { hash } = await writeContract({
            address: activeProduct.value.contractAddress,
            abi: ContractABI,
            functionName: 'bulkPurchase',
            chainId: 137,
            args: [receiver, validatedAmount.value]
            })
            txHash.value = hash
            loadingMessage.value = "Waiting for blockchain confirmation"
            await waitForTransaction({ hash })
            startTimer()
        } catch (e) {
            console.log(e)
            modalLoading.value = false
            return 
        }   

    }

    async function purchaseTicket(_giftAddress) {
        txHash.value = ""

        try {

   
            if(buyStep.value == 2) {
                console.log(verseAllowance.value, "allowance")
                if(verseAllowance.value >= activeProduct.value.ticketPrice * validatedAmount.value) {
                    // continue to final step
                    buyStep.value = 4
                    return
                } else {
                    buyStep.value = 3
                    return
                }
            }
            
            if(validatedAmount.value > 1) {
                multiBuy(_giftAddress)
            } else {
                // purchase ticket
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
                        address: activeProduct.value.contractAddress,
                        abi: ContractABI,
                        functionName: 'giftScratchTicket',
                        chainId: 137,
                        args: [receiver]
                        })
                        txHash.value = hash
                        loadingMessage.value = "Waiting for blockchain confirmation"
                        await waitForTransaction({ hash })
                    } catch (e) {
                        console.log(e)
                        modalLoading.value = false
                        return 
                    }
                    
                } else {
                    try {
                        const { hash } = await writeContract({
                        address: activeProduct.value.contractAddress,
                        abi: ContractABI,
                        functionName: 'buyScratchTicket',
                        chainId: 137,
                        args: []
                        })
                        txHash.value = hash
                        loadingMessage.value = "Waiting for blockchain confirmation"
                        await waitForTransaction({ hash })
                    } catch (e) {
                        console.log(e)
                        // need to ensure this works because sometimes tx falls through even on confirm
                        modalLoading.value = false
                        return 
                    }   
                }
                startTimer()
            }

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
            args: [getAccount().address, activeProduct.value.contractAddress]
            })
            modalLoading.value = false;


            if(data) {

                 let dataString = data.toString()
                 verseAllowance.value= Web3.utils.fromWei(dataString, 'ether')

                //  do not automatically update modal
                if(activeProduct.multibuy) {
                    // if user is on the approval screen, and allowance is accepted, go to final screen
                    if(verseAllowance.value >= activeProduct.value.ticketPrice && buyStep.value == 3) {
                        buyStep.value = 4;
                    }
                } else {
                    // non multibuy
                    // if on approval screen, approval just happened, go to next screen
                    if(verseAllowance.value >= activeProduct.value.ticketPrice && buyStep.value > 2) {
                        buyStep.value = 4
                    }
                }
            } else {
                verseAllowance.value = 0
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
                 getAllowance()
            

                 if(activeProduct.value.multibuy == false && verseBalance.value < activeProduct.value.ticketPrice) {
                    buyStep.value = 1;
                 }
                 else if(verseBalance.value >= activeProduct.value.ticketPrice && buyStep.value < 2) {
                    buyStep.value = 2;    
                 } 
            } else {
                if(activeProduct.value.multibuy == false) {
                    buyStep.value = 1;
                }
            }
            } catch (e) {
                console.log(e)
                modalLoading.value = false;
            }
    }

    watch(activeProduct, newValue => {
        getAllowance()
        purchaseAmount.value = 1

        if(newValue.multibuy == false && verseBalance.value < 3000) {
            buyStep.value = 1;
        } 

        if(newValue.multibuy == true && buyStep.value == 1) {
            buyStep.value = 2;
        }
    })

    watchNetwork((network) => {
        if(network.chain && network.chain.id != 137) {
            correctNetwork.value = false
        } else {
            correctNetwork.value = true
        }
    })
    watchAccount(async (account) => {
        if(!currentAccountAddress.value) {
            currentAccountAddress.value = getAccount().address
        }
        else {
            if(currentAccountAddress.value != getAccount().address) {
                location.reload()
            }
        }

        if(account.isConnected == true) {
            console.log("HOME ACOUNT ACTIVE")
            accountActive.value = true;
            if(buyStep.value < 2) {
                buyStep.value = 2;
            }

            if(reopenAfterConnection.value == true) {
                reopenAfterConnection.value = false;
                toggleModal()
            }
            getBalance();
        } else {
            console.log("HOME ACOUNT NOT ACTIVE")
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

    const blurUpdateAmount = (event) => {
        if(!event.target.value) {
            purchaseAmount.value = 1;
        }
    }

    const updateAmount = (event) => {
        purchaseAmount.value = event.target.value;
    }

    return {
        getBalance,
        connectAndClose,
        account,
        openModal,
        buyStep,
        updateAmount,
        priceUsd,
        modal,
        accountActive,
        correctNetwork,
        approve,
        modalActive,
        purchaseAmount,
        toggleModal,
        modalLoading,
        giftAddress,
        copyDone,
        verseBalance,
        products,
        verseAllowance,
        activeProduct,
        loadingMessage,
        logCtaEvent,
        purchaseTicket,
        giftTicket,
        ticketInputAddress,
        copyText,
        validatedAmount,
        blurUpdateAmount,
        toggleGift,
        onTicketInputChange,
        randomOtherProduct,
        ticketInputValid,
        getAccount,
        showTimer,
        selectedProductId,
        requestNetworkChange,
        ensLoaded,
        giftInputLoad,
        singleTransactionApproval,
        toggleSingleApproval,
        txHash
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
                <a target="_blank" style="color: #0085FF; font-weight: 500;" :href="`https://polygonscan.com/tx/${txHash}`" v-if="txHash && !showTimer">View blockchain transaction</a>
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
                    <p class="subtext short">You need at least <span>{{activeProduct.ticketPrice}} VERSE</span> on Polygon in order to purchase a ticket</p>

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
        <div class="modal" v-if="buyStep == 3 && !modalLoading && correctNetwork">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p50"></div>
            </div>  
            <div class="modal-body">
                <div class="img-approve"></div>
                <h3 class="title">Allow the use of VERSE</h3>
                <p class="subtext">You need to enable the use of at least <span>{{parseInt(activeProduct.ticketPrice) * parseInt(validatedAmount) }} VERSE</span>. This is used to pay for your ticket. </p>
                <div class="gift-toggle-holder">
                            <h3 class="title">Allow for one transaction only</h3>
                            <label class="switch">
                            <input type="checkbox" v-on:change="toggleSingleApproval">
                                <span class="slider round"></span>
                            </label>
                        </div>
                <a class="" target="_blank" @click="approve()"><button class="btn verse-wide">Allow the use of VERSE</button></a>
                <p class="modal-footer">The Polygon network requires that you manually approve the spending  of each token in your wallet. <a target="blank" href="https://revoke.cash/learn/approvals/what-are-token-approvals">learn more here.</a></p>
            </div>
        </div>
        <!-- purchase modal post approval -->
        <div class="modal" v-if="buyStep == 2 && !modalLoading && correctNetwork">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div v-if="!activeProduct.multibuy" class="modal-progress p75"></div>
                <div v-if="activeProduct.multibuy" class="modal-progress p25"></div>
            </div>  
            <div class="modal-body">
                <div class="img-purchase"></div>
                <h3 class="title">Buy Ticket<span v-if="activeProduct.multibuy">s</span></h3>
                <p v-if="activeProduct.multibuy" class="balance-purchase">AVAILABLE BALANCE: {{ verseBalance.toFixed(0) || 0 }} VERSE</p>

                <div class="gift-toggle-holder" v-if="activeProduct.multibuy">
                    <h3 class="title">Total Tickets</h3>
                    <div class="input-holder">
                        <div class="toggler up" @click="purchaseAmount < 50 ? purchaseAmount++ : purchaseAmount">
                            <i class="icn-plus"></i>
                        </div>
                        <input type="number" :value="validatedAmount" @input="updateAmount" @blur="blurUpdateAmount">
                        <div class="toggler down" @click="purchaseAmount > 1 ? purchaseAmount-- : purchaseAmount">
                            <i class="icn-min"></i>
                        </div>
                    </div>
                </div>

                <div class="gift-toggle-holder second" :class="{ opened: giftTicket }">
                    <h3 class="title">Send ticket<span v-if="purchaseAmount > 1">s</span> as a gift?</h3>
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

                <!-- enough balance -->
                <div v-if="verseBalance >= validatedAmount * activeProduct.ticketPrice">
                    <div v-if="!giftTicket">
                        <a class="" target="_blank" @click="purchaseTicket()" >
                            <button v-if="validatedAmount == 1" class="btn verse-wide">Buy a Ticket</button>
                            <button v-if="validatedAmount > 1" class="btn verse-wide">Buy {{validatedAmount }} Tickets</button>
                        </a>
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
                
                 <!-- not enough balance -->
                <div v-if="verseBalance < validatedAmount * activeProduct.ticketPrice">
                    <p class="warning-balance">You do not have the amount required ({{ validatedAmount * activeProduct.ticketPrice }} VERSE) to complete this order. </p>

                    <br>
                    
                    <button v-if="validatedAmount == 1" class="btn verse-wide disabled" style="margin-top: 5px">Buy a Ticket</button>
                    <button v-if="validatedAmount > 1" class="btn verse-wide disabled" style="margin-top: 5px">Buy {{validatedAmount }} Tickets</button>
                </div>

            </div>
        </div>

                <!-- purchase modal post approval -->
        <div class="modal" v-if="buyStep == 4 && !modalLoading && correctNetwork">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="toggleModal()" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p75"></div>
            </div>  
            <div class="modal-body">
                <div class="img-purchase"></div>
                <h3 class="title">Final Step</h3>
                <p class="subtext">You have at least <span>{{activeProduct.ticketPrice * validatedAmount}} VERSE</span> in your wallet, and you've approved spending it. All that's left to do is buy your ticket.</p>

                <table>
                    <tr>
                        <td class="key">Ticket Collection</td>
                        <td class="value">{{ activeProduct.title }}</td>
                    </tr>
                    <tr v-if="activeProduct.multibuy">
                        <td class="key">Ticket Amount</td>
                        <td class="value">{{ validatedAmount }}</td>
                    </tr>
                    <tr>
                        <td class="key">Destination Address</td>
                        <td class="value" v-if="ticketInputAddress">{{ ticketInputAddress.slice(0, 7) }}..</td>
                        <td class="value" v-if="!ticketInputAddress">{{ getAccount().address.slice(0, 7)}}..</td>
                    </tr>
                </table>


                <div v-if="!giftTicket">
                    <a class="" target="_blank" @click="purchaseTicket()" >
                        <button v-if="validatedAmount == 1" class="btn verse-wide">Complete Purchase</button>
                        <button v-if="validatedAmount > 1" class="btn verse-wide">Complete Purchase</button>
                    </a>
                </div>

                <div v-if="giftInputLoad == false && giftTicket">
                    <a class="" target="_blank" @click="purchaseTicket(ticketInputAddress)" v-if="giftTicket && ticketInputValid && ticketInputAddress.length > 0"><button class="btn verse-wide">Buy a Ticket</button></a>
                    <a class="" target="_blank" v-if="ticketInputAddress.length == 0 && giftTicket"><button class="btn verse-wide disabled">Submit an Address</button></a>
                    <a class="" target="_blank" v-if="giftTicket && !ticketInputValid && ticketInputAddress.length > 0"><button class="btn verse-wide disabled">Input Valid Address</button></a>
                </div>
            </div>
        </div>

        <!-- normal finish -->
        <div class="modal" v-if="buyStep == 5 && !modalLoading && correctNetwork">
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
                        <h3 class="title">Ticket<span v-if="validatedAmount > 1">s</span> Purchased & Gifted!</h3>
                        <p class="subtext">The ticket has been sent to the your specified wallet! Share the following link to let them know:</p>

                        <div class="ticketfield">
                            <input class="ticketlink" type="text" :value="`https://scratcher.verse.bitcoin.com/tickets?gift=1&address=${giftAddress}`">
                            <button style="cursor:pointer" v-if="!copyDone" class="btn-copy" @click="() => copyText()">copy</button>
                            <button style="cursor:pointer" v-if="copyDone" class="btn-copy" @click="() => copyText()">copied</button>
                        </div>
                        <a class="" href="/"><button class="btn verse-wide half extraTop extraTopMobile" style="margin-left: 0">Buy More Tickets</button></a>
                        <a class="" href="/tickets"><button class="btn verse-wide half secondary extraTop"  style="margin-right: 0">View your tickets</button></a>
                    </div>
                    <!-- normal ticket delivery -->
                    <div v-if="!giftTicket">
                        <h3 class="title">Ticket<span v-if="validatedAmount > 1">s</span> Purchased!</h3>
                        <p class="subtext short" style="margin-bottom: 0;">Time to scratch your ticket<span style="color: #899BB5" v-if="validatedAmount > 1">s</span> and test your luck!</p>
                        <a class="" href="/tickets"><button class="btn verse-wide">View Your Ticket<span v-if="validatedAmount > 1">s</span></button></a>
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
            <img  :src="activeProduct.cover">
        </div>
        <div class="float-holder clearfix">
            <div class="card-wrapper">
                <div class="card-info">
                    <h2>SCRATCH & WIN</h2>
                    <p class="top-meta">Buy a ticket, scratch the same number 3 times to win VERSE</p>
                    <div class="campaign-title">
                        <i v-if="products.length > 1" class="chev-down"></i>
                        <!-- {{ activeProduct.title }} -->
                        <select v-model="selectedProductId" >
                        <option v-for="product in products" :key="product.id" :value="product.id">
                            {{ product.title.toUpperCase() }}
                        </option>
                        <!-- <option value="1">Selected Collection: Space Expedition</option>
                        <option value="2">Legacy Collection: Christmas 1999</option>
                        <option value="3">2024 Chinese New Year</option> -->
                    </select>
                    </div>
                    <div class="topblock">
                        <p>JACKPOT</p>
                        <h2>{{ activeProduct.jackpotString }} VERSE</h2>
                        <p v-if="priceUsd" class="usd">${{ (priceUsd * activeProduct.jackpot).toFixed(2) }}</p>
                    </div>
                    <div class="splitblock">
                        <div class="block leftblock">
                            <p>PRICE PER TICKET</p>
                            <h2>{{ activeProduct.ticketPriceString}} VERSE</h2>
                            <p v-if="priceUsd" class="usd">${{ (priceUsd * activeProduct.ticketPrice).toFixed(2) }}</p>
                        </div>
                        <div class="block rightblock">
                            <p>OTHER PRIZES</p>
                            <h2>{{activeProduct.lowestPriceString}} - {{ activeProduct.highestPriceString }} VERSE</h2>
                            <p v-if="priceUsd" class="usd">${{ (priceUsd * activeProduct.lowestPrice).toFixed(2) }} - ${{ (priceUsd * activeProduct.highestPrice).toFixed(2) }}</p>
                        </div>
                    </div>
                    <button class="btn verse-wide home" @click="toggleModal(); logCtaEvent('buy ticket')">Buy Ticket</button>
                    <a @click="openModal()" v-if="!accountActive"><button class="btn verse-wide secondary" style="margin-top: 10px!important;">Connect Wallet</button></a>
                    <a href="/tickets" v-if="accountActive"><button class="btn verse-wide secondary" style="margin-top: 10px!important;">View My Tickets</button></a>

                    <p class="terms-link">*Self custodial and verifiably random, powered by smart contracts and Chainlink VRF. <a target="_blank" href="https://support.bitcoin.com/en/articles/8607322-verse-scratcher-faq">Learn More</a></p>
                </div>


                <div class="card-holder">
                    <img class=""  :src="activeProduct.cover">
                </div>
            </div>
        </div>
        <!-- <div class="divider"></div> -->
        <div class="other-products">
            <h1 class="tit">OTHER SCRATCH TICKET COLLECTIONS</h1>
            <a :href="'?campaign=' + randomOtherProduct.campaign">
            <div class="banner">
                <h2 class="tit-ban">{{ randomOtherProduct.title.toUpperCase() }}</h2>
                <div class="card-preview"></div>
                <div class="prizes">
                    <div class="prize-left">
                        <p class="tit-prize">JACKPOT</p>
                        <p>{{ randomOtherProduct.jackpotString }} VERSE</p>
                    </div>
                    <div class="prize-right">
                        <p class="tit-prize">PRICE PER TICKET</p>
                        <p>{{ randomOtherProduct.ticketPriceString}} VERSE</p>
                    </div>
                </div>
                <button class="btn-card">View Collection</button>
            </div>
            </a>
        </div>
        
        <Footer />
    </div>
</template>

<style lang="scss" scoped>
h1, h2, h3 {
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-weight: 800;
}
.warning-balance {
    color: orange!important;
    margin-top: 20px;
    font-weight: 400;
    margin-bottom: 0;
    padding-left: 20px;
    padding-right: 20px;
    @media(max-width: 880px) {
        padding-left: 0;
        padding-right: 0;
    }
}

.balance-purchase {
    color: white;
    font-weight: 500;
    margin-top: 0px;
    font-size: 15px;
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    background-color: #05111c;
    border: 1px solid #273953;
    border-radius: 10px;
    padding: 20px;
}
.divider {
    position: absolute;
    left: 0;
    width: 100%;
    background-color: #0A0A2C;
    border-top: 1px solid #1A2231;
    /* height: 15px; */
    @media(max-width: 880px) {
        position: unset;
    }
}
.other-products {
    background-color: #0A0A2C;
    border-top: 1px solid #1A2231;
    width: 100%;
    @media(min-width: 880px){
        padding: 40px 0 40px;
    }
    .prizes {
        background-color: black;
        width: 300px;
        border-radius: 20px;
        position: absolute;
        left: 647px;
        height: 60px;
        top: 28px;
        border: 10px;
        @media(max-width: 1300px) {
            left: 50px;
            top: 57px;
            height: 75px;
        }
        @media(max-width: 880px) {
            left: 26px;
            width: calc(100% - 52px);
        }
        .tit-prize {
            font-weight: 800;
            font-size: 12px;
            margin-bottom: 4px;
            color: v-bind('randomOtherProduct.jackpotBoxColorOneTitle'); 
            text-shadow: unset;
            margin-top: 10px!important;    
            @media(max-width: 1300px) {
                margin-top: 19px!important;
            }   
        }
        p {
            margin: 0;
            font-size: 16px;
            text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
            font-weight: 800;
        }
        .prize-left {
            text-align: center;
            position: absolute;
            left: 0;
            border-top-left-radius: 20px;
            border-bottom-left-radius: 20px;
            width: calc(50% - 1px);
            background-color:  v-bind('randomOtherProduct.jackpotBoxColorOne');
            color: white;
            border-right: 1px solid black;
            height: 100%;
        }

        .prize-right {
            text-align: center;
            position: absolute;
            border-top-right-radius: 20px;
            border-bottom-right-radius: 20px;
            left: 50%;
            color: white;
            width: 50%;
            background-color:  v-bind('randomOtherProduct.jackpotBoxColorOne');
            height: 100%;
        }
    }
    .tit {
        margin-bottom: 30px;
        text-align: center;
        color: #899BB5;
        font-size: 18px;
        font-weight: 800;
        font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        @media(max-width: 880px) {
            margin-top: 50px;
        }
    }

    .card-preview {
        background-image: v-bind('randomOtherProduct.cardPreviewLarge');
        width: 310px;
        height:  120px;
        background-size: cover;
        bottom: 0;
        position: absolute;
        left: 244px;
        @media(max-width: 1300px) {
            background-image: v-bind('randomOtherProduct.cardPreviewMedium');
            left: 50%;
            width: 50%;
            height: 200px;
        }
        @media(max-width: 880px) {
            display: none;
        }
    }

    .banner {
        border: 1px solid #273953;
        background-image: v-bind('randomOtherProduct.bannerLarge');
        background-repeat: no-repeat;
        background-size: cover;
        width: 88%;
        max-width: 1200px;
        margin: auto;
        height: 118px;
        border-radius: 20px;
        position: relative;
        margin-bottom: 50px;
        @media(max-width: 1300px) {
            height: 200px;
        }
        @media(max-width: 880px) {
            width: calc(100% - 30px);
            margin-left: 15px;
        }
        .tit-ban {
            position: absolute;
            color: white;
            font-size: 18px;
            top: 30px;
            font-weight: 800;
            left: 30px;
            @media(max-width: 1300px) {
                left: 50px;
                top: 10px;
                width: 300px;
                text-align: center;
            }
            @media(max-width: 880px) {
                width: 100%;
                left: 0;
                top: 5px;
                text-align: center;
            }   
        }
        .btn-card {
            width: 120px;
            padding: 0;
            font-weight: 500;
            font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            height: 35px;
            border-radius: 30px;
            color: white;
            position: absolute;
            right: 31px;
            font-size: 14px;
            top: 42px;
            background-color: v-bind('randomOtherProduct.homeLinkColor');
            border: none;
            @media(max-width: 1300px) {
                left: 50px;
                top: 140px;
                width: 300px;
            }
            @media(max-width: 880px) {
                left: 26px;
                width: calc(100% - 52px);
            }
        }
    }
}
i.chev-down {
    background-image: url("../assets/icons/chev-down.png");
    width: 24px;
    height: 24px;
    display: block;
    background-size: cover;
    position: absolute;
    z-index: 0;
    right: 20px;
    pointer-events: none;
    top: 14px;
}

.campaign-title {
    margin-top: 16px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    background-color: v-bind('activeProduct.homeSwitchColor');
    text-align: center;
    position: relative;
    font-size: 18px;
    font-weight: 200!important;
    padding: 5px;
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;

    select {
        cursor: pointer;
        -webkit-appearance: none;
        border: none;
        outline: none;
        text-align: center;
        width: 100%;
        font-size: 18px;
        line-height: 18px;
        font-weight: 600;
        padding: 12px;
        font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        color: white;
        background-color: v-bind('activeProduct.homeSwitchColor');
    }
}
.terms-link {
    font-size: 12px;
    margin-top: 16px;
    font-weight: 400!important;
    text-align: center;
    color: #899BB5;
    a {
        color: v-bind('activeProduct.homeLinkColor');
        cursor: pointer;
        text-decoration: none;
    }
}
p.usd {
    color: white!important;
    font-size: 12px;
}
.jumbo-mob {
    background-image: v-bind('activeProduct.backgroundImage')!important;
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
        width: 50%;
        float: left;
        padding: 12px 0;
        margin-top: 3px;
        text-align: center;
        @media(max-width: 880px) {
            /* width: calc(50% - 26px)!important; */
            margin: 0;
            margin-top: 3px;
            min-height: unset!important;
        }
        @media(max-width: 1185px) {
            min-height: 80px;
        }
        &.leftblock {
            border-bottom-left-radius: 12px;
            background: v-bind('activeProduct.jackpotBoxColorTwo');
            margin-right: 1%!important;
            @media(max-width: 880px) {
                margin-right: 3px!important;
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
                color: v-bind('activeProduct.jackpotBoxColorTwoTitle')
            }
        }
        &.rightblock {
            @media(min-width: 1600px) {
                white-space: nowrap;
            }
            width: calc(50% - 12.5px);
            padding: 12px 4.5px;
            display: flex;
            flex-direction: column;
            text-align: center;
            border-bottom-right-radius: 12px;
            background: v-bind('activeProduct.jackpotBoxColorThree');
            h2 {
                font-size: 17px;
                text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
                @media(max-width: 1100px) {
                 font-size: 17px;
                }
                @media(max-width: 930px) {
                 font-size: 15px;
                 place-self: center;
                }
            }
            p {
                margin-top: 2px;
                margin-bottom: 2px;
                font-size: 12px;
                color: v-bind('activeProduct.jackpotBoxColorThreeTitle')
            }
        }
    }
}

.topblock {
    padding: 12px;
    background: v-bind('activeProduct.jackpotBoxColorOne');
    border-radius: 0;
    p {
        margin: 0.5rem 0 0;
        text-align: center;
        font-weight: 600;
        color: v-bind('activeProduct.jackpotBoxColorOneTitle')
    }
    h2 {
        margin: 0.25rem 0 0 !important;
        font-weight: 800;
        font-size: 32px;
        line-height: 32px;
        text-align: center;
        text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
    }
}
.top-meta {
    padding-left: 40px;
    padding-right: 40px;
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
    font-family: Saeada, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-weight: 800;
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
        font-weight: 800;
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
        font-weight: 800;
        max-width: 80rem;
        margin: 0px auto;
        @media(max-width: 880px) {
            margin-left: 0;
            max-width: 95%;
        }
    }
}

.clearfix {
    background-image: v-bind('activeProduct.backgroundImage');
    background-size: cover;
    background-repeat: no-repeat;
    margin: auto;
    overflow: auto;
    width: 100%;
    @media(max-width: 880px) {
        width: 100%!important;
        position: unset;
        background-image: unset;
    }
}
.float-holder{
    min-height: calc(100vh - 212px);
    min-height: calc(100dvh - 212px);
    @media(max-width: 880px) {
        margin-top: 0!important;
    }
}
.card-wrapper {
    width: 100%;
    max-width: 1600px;
    margin: auto;
    display: flex;
    box-sizing: border-box;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 5%;
    @media(min-width: 880px) {
        margin: 80px auto;
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
    float: left;
    width: 27%;
    max-width: 335px;
    color: white;
    @media(max-width: 880px) {
        width: calc(100% - 30px)!important;
        padding: 15px;
        padding-bottom: 50px;
    }

    h2 {
        margin: 0.25rem 0;
        font-size: 32px;
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
        margin-top: 125px!important;
    }
    float: left;
    max-width: 633px;
    border-radius: 6px;
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
        overflow-x: hidden;
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