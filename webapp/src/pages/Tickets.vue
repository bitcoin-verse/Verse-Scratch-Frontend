<script>
import { getAccount, waitForTransactionReceipt, readContract, disconnect, writeContract, watchAccount } from '@wagmi/core'
import { ref, computed } from 'vue';
import ERC721ABI from '../abi/ERC721.json'
import Redeem from '../pages/Redeem.vue'
import { useWeb3Modal } from '@web3modal/wagmi/vue'
import ContractABI from '../abi/contract.json'
import ERC721 from '../abi/ERC721.json'
import { useRoute } from 'vue-router'
import Web3 from 'web3'
import Footer from '../components/Footer.vue'
import { store } from '../store.js'
import core from '../core'

export default {
    components: {
        Redeem,
        Footer,
    },  
    setup() {        
        const route = useRoute()
        const contractAddresses = computed(() => store.getProductContractAddresses())
        const products = computed(() => store.getProducts().filter(product => product.active == true));
        let list = []
        let account = getAccount(core.config)
        let accountActive = ref(false)
        let loading = ref(false)
        let modal = useWeb3Modal()
        let claimNow = ref(false)

        let newTicketModal = ref(false)
        let winModal = ref(false)
        let giftModal = ref(false)
        let filterClaimed = ref(localStorage.getItem("filterClaimed") === 'true' ? true : false)
        let giftAccount = ref("")
        let claimNFT = ref(0)
        let step = ref(0);
        let nfts = ref([])
        let claimActive = ref(false)
        let modalLoading = ref(false)

        let selectedFilterOption = ref("")
        let openDetail = ref(false);
        let detailNFT = ref({});


        // entry point to watch account
        if(getAccount(core.config).address &&  getAccount(core.config).address.length != undefined) {
            accountActive.value = true;
            getTicketIds()
        } else {
            accountActive.value = false
        }

        if(route.query.gift && route.query.address && route.query.gift.length > 0 && route.query.address.length > 0) {
            disconnect()
            giftModal.value = true
            giftAccount.value = route.query.address
            const duration = 3 * 1000,
            animationEnd = Date.now() + duration,
            defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti(
                Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                })
            );
            confetti(
                Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                })
            );
            }, 250);
        }
        const unwatch = watchAccount(core.config, {
            async onChange() {
                if(getAccount(core.config).address &&  getAccount(core.config).address.length != undefined) {
                accountActive.value = true;
                getTicketIds()
                } else {
                    accountActive.value = false
                }
            },
        })
        unwatch()


        async function redeem(nftId) {
            modalLoading.value = true
            const obj = nfts.value.find(obj => obj.id == nftId);
            console.log(obj)

            try {
                const { hash } = await writeContract(core.config, {
                    address: contractAddresses.value[0],
                    abi: ContractABI,
                    functionName: 'claimPrize',
                    args: [obj.id]
                })
                await waitForTransactionReceipt(core.config, { hash })
                modalLoading.value = false
                const objToUpdate = nfts.value.find(obj => obj.id == nftId);
                objToUpdate.claimed = true
                step.value = 1;
            } catch (e) {
                console.log(e)
                if(e instanceof TypeError) {
                    modalLoading.value = false
                    const objToUpdate = nfts.value.find(obj => obj.id == nftId);
                    objToUpdate.claimed = true
                    step.value = 1;
                }
                // modalLoading.value = false;
                console.log(e)
            }

        }

        function toggleFilterClaimed() {
            localStorage.setItem("filterClaimed", !filterClaimed.value)
            filterClaimed.value = !filterClaimed.value
        }

        function toggleModal() {
            openDetail.value = !openDetail.value
        }

        function setScratched(id) {
            localStorage.setItem(id.toString() + '/' + contractAddresses.value[0].toString(), true)
            const objToUpdate = nfts.value.find(obj => obj.id === id);
            if (objToUpdate) {
                objToUpdate.scratched = true;
            }
        }

        function openDetailScreen(id, address) {
            detailNFT.value = nfts.value.find(obj => obj.id === id && obj.address === address);
            openDetail.value = true;
        }


        function handleClickItem(item) {
            if(item.scratched == false && item.claimed == false) {
                openDetailScreen(item.id, item.address)
            } 
            else if(item.scratched == true && item.claimed == false) {
                openClaimDetail(item.id, item.address)
            }
        }

        function closeGiftModal(connect) {
            if(connect) {
                modal.open()
            }
            giftModal.value = false
        }

        async function getClaimed(id, address) {
            try {
                const data = await readContract(core.config, {
                address: address,
                abi: ERC721,
                functionName: 'claimed',
                args: [id]
                })
                
                if(data) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id && obj.address == address);
                    if (objToUpdate) {
                        objToUpdate.claimed = data;
                        
                    }
                    return data 
                }
            } catch (e) {
                console.log(e)
            }               
        }

        async function getEdition(id, address) {
            
            try {
                const data = await readContract(core.config, {
                address: address,
                abi: ERC721,
                functionName: 'editions',
                args: [id]
                })
                
                if(data.toString().length > 0) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id && obj.address == address);
                    if (objToUpdate) {
                        objToUpdate.edition = parseInt(data);
                    }
                    return data 
                }
            } catch (e) {
                console.log(e)
            }
        }

        async function getPrizeAmount(id, address) {
            try {
                const data = await readContract(core.config, {
                    address: address,
                    abi: ERC721,
                    functionName: 'prizes',
                    args: [id]
                })
                if(data) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id && obj.address == address);
                    if (objToUpdate) {
                        objToUpdate.prize = Web3.utils.fromWei(data, 'ether');
                    }
                    return data 
                }
            } catch (e) {
                console.log(e)
            }
               
        }


        function openClaimDetail(id, address) {
            detailNFT.value = nfts.value.find(obj => obj.id === id && obj.address === address);
            claimNow.value = true
            openDetail.value = true
        }

        async function getRedemptionStatus(id, address) {
            try {
                const data = await readContract(core.config, {
                address: address,
                abi: ERC721ABI,
                functionName: 'tokenURI',
                args: [id]
                })
                if(data) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id);
                    if(data.includes("/true")) {
                        if (objToUpdate) {
                            objToUpdate.claimed = true;
                        } else {
                            objToUpdate.claimed = false
                        }
                    }
                    return data
                }
            } catch (e) {
                console.log(e)
            }
        }

        const ticketList = computed(() => {

            let arr = nfts.value.map(nft => nft).reverse()

            if(selectedFilterOption.value != "") {
                arr = arr.filter((item) => item.address == selectedFilterOption.value)
            }

            if(filterClaimed.value === true) {
                arr = arr.filter(item => !item.claimed)
            } 
            return arr
        })

        

        function closeDetailScreen() {
            openDetail.value = false;
        }
        async function getTicketIds() {
            try {
                loading.value = true;

                let promiseTicketArray = []
                let contract = []
                let bucketUrls = []
                store.getProducts().forEach(product => {
                    contract.push(product.contractAddress)
                    bucketUrls.push(product.bucketUrl)
                    promiseTicketArray.push(
                        readContract(core.config, {
                            address: product.contractAddress,
                            abi: ERC721ABI,
                            functionName: 'ownedByAddress',
                            args: [getAccount(core.config).address]
                        }))
                })
                const promiseResult = await Promise.all(promiseTicketArray)
                
                let dataConcat = []
                promiseResult.forEach((data, idx) => {
                    data.forEach(item => {

                        dataConcat.push({item, address: contract[idx], bucketUrl: bucketUrls[idx]})
                    })
                })
                

                if(dataConcat) {
                    let promiseArray = []
                    let arr = []
                    dataConcat.forEach((dat)=> {
                        let scratched = false
                        if(localStorage.getItem(dat.item.toString() + '/' + dat.address.toString()) == 'true') {
                            scratched = true
                        }
                        arr.push({id: parseInt(dat.item.toString()), address: dat.address, bucketUrl: dat.bucketUrl, scratched, claimed: false })
                        promiseArray.push(getRedemptionStatus(dat.item.toString(), dat.address.toString()))
                    })
                    nfts.value = arr
                    nfts.value.forEach(nft => {
                        promiseArray.push(promiseArray.push(getClaimed(nft.id, nft.address)))
                        promiseArray.push(promiseArray.push(getEdition(nft.id, nft.address)))
                        promiseArray.push(promiseArray.push(getPrizeAmount(nft.id,nft.address)))
                    })

                    let res = await Promise.all(promiseArray)
                    loading.value = false;
                }
            } catch (e) {
                console.log(e)
                loading.value = false;
            }
        }   

        return {
            list, nfts, account, handleClickItem, newTicketModal, products, selectedFilterOption, toggleFilterClaimed, contractAddresses, filterClaimed, openClaimDetail, claimNow, winModal, closeGiftModal, step, loading, giftModal, giftAccount, claimNFT, claimActive, modalLoading, toggleModal, accountActive, getTicketIds, ticketList, openDetail, openDetailScreen, closeDetailScreen, detailNFT, setScratched, redeem, getRedemptionStatus
        }   
    }
}
</script>

<template>
    <div class="backdrop" v-if="claimActive || giftModal || newTicketModal">
                
        <div class="modal" v-if="newTicketModal">
            <div class="modal-head">
                <h3 class="title">Buy Ticket</h3>
                <p class="iholder"><i @click="newTicketModal = false" class="close-btn" ></i></p>
            </div>
            <div class="modal-divider">
                <div class="modal-progress p25"></div>
            </div>  
            <div class="modal-body collection">
                <h3 class="title">Choose a collection</h3>
                <div class="collection-picker">
                    <div class="collection" v-for="item in products.reverse()" :style="`background-image: ${item.bannerLarge}`">
                        <h2>{{ item.title.toUpperCase() }}</h2>
                        <div class="overview">
                            <div class="left" :style="`background-color: ${item.jackpotBoxColorOne}`">
                                <h3 :style="`color: ${item.jackpotBoxColorOneTitle}`">JACKPOT</h3>
                                <h5>{{ item.jackpotString }} VERSE</h5>
                            </div>
                            <div class="right" :style="`background-color: ${item.jackpotBoxColorOne}`">
                                <h3 :style="`color: ${item.jackpotBoxColorOneTitle}`">PRICE PER TICKET</h3>
                                <h5>{{ item.ticketPriceString }} VERSE</h5>
                            </div>
                        </div>
                        <a :href="`/?campaign=${item.campaign}&purchase-intent=true`"><button class="btn-select-col" :style="`background-color: ${item.homeLinkColor}`">Buy From This Collection</button></a>
                    </div>
                </div>
            </div>
        </div>
        <!-- gift-->
        <div class="modal" v-if="giftModal">
            <div class="modal-head">
                <p class="iholder"><i @click="closeGiftModal(false)" class="close-btn" ></i></p>
            </div>
            <div class="modal-body short">
                <div class="img-gift"></div>
                <h3 class="title">Gift Ticket Received!</h3>
                <p class="subtext">Somebody has sent a scratch ticket to you. Your ticket has a chance to win <span>1.000.000 Verse!</span>
                <br><br>No transaction is required to scratch. Connect your account (<span> {{ giftAccount.slice(0, 7) }}..</span>) to redeem the ticket.
                </p>
                <a @click="closeGiftModal(true)" v-if="accountActive == false"><button class="btn verse-wide fixBottomMobile">Connect and Redeem</button></a>
                <a @click="closeGiftModal(false)" v-if="accountActive == true"><button class="btn verse-wide fixBottomMobile">Redeem</button></a>
                <img url="/gift.png">
            </div>
        </div>
    </div>

    <Redeem v-if="openDetail" :claim="claimNow" :toggleModal="toggleModal" :closeDetailScreen="closeDetailScreen" :detailNFT="detailNFT" :setScratched="setScratched"/>
   

    <div class="page" v-if="!openDetail">
        <div class="head">
            <h2 class="tickhead">My Tickets
                <div class="ticket-check clearfix">
                    <p>
                    <label class="switch">
                    <input type="checkbox" :checked="filterClaimed" v-on:change="toggleFilterClaimed">
                        <span class="slider round"></span>
                    </label>Hide Claimed Tickets</p>

                    <div class="filter">
                        <select v-model="selectedFilterOption">
                            <option value="">All Collections</option>
                            <option v-for="item in products" :value="item.contractAddress">{{ item.title }}</option>
                        </select>
                        <i class="chev-down"></i>
                    </div>
                </div>  
                <a @click="newTicketModal= true" ><button class="btn verse-wide" >Buy Ticket</button></a>
            </h2>

            <div class="tickconnect" v-if="!accountActive">Connect your wallet to view your tickets. </div>
        </div>
        <div class="ticket-wrapper">
    
        <div class="spin" v-if="accountActive && loading">
            <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        </div>
        
        <div class="tickets clearfix" v-if="accountActive && !loading">
            <div v-if="nfts.length == 0" class="warn-no-tickets">
                <h5>No tickets found in connected wallet</h5>
            </div>
            <div class="ticket" v-for="item, index in ticketList">
                <h3 class="title">Ticket {{item.id}} </h3>

                <p class="status" v-if="item.claimed == false && item.scratched == true">
                    Claimable Ticket
                </p>
                <p class="status" v-if="item.claimed == false && item.scratched == false">
                    Unscratched Ticket
                </p>
                <p class="status" v-if="item.claimed == true">
                    Claimed Ticket
                </p>


                <div v-if="item.claimed == false" @click="handleClickItem(item)" style="cursor: pointer">
                    <img class="mobreset" v-if="item.scratched == false" :src="'/templates/' + item.address + '/' + item.edition + '.png'">
                    <img class="mobreset unclaimed" v-if="item.scratched == true" :src="`https://${item.bucketUrl}.s3.amazonaws.com/${item.id}/${item.address}.jpg`">
                </div>

                <div v-if="item.claimed == true">
                    <img class="mobreset claimed" :src="`https://${item.bucketUrl}.s3.amazonaws.com/${item.id}/${item.address}.jpg`">
                </div>

                <button v-if="item.scratched == false && item.claimed == false" class="btn verse-wide secondary" @click="openDetailScreen(item.id, item.address)">Scratch Ticket</button>
                <button v-if="item.scratched == true && item.claimed == false" @click="openClaimDetail(item.id, item.address)" class="btn verse-wide" >Claim {{item.prize}} VERSE</button>
                <button v-if="item.claimed == true" class="btn verse-wide secondary disabled claimed" >{{item.prize}} VERSE Claimed</button>
            </div>
        </div>

        </div>
        <div class="filter-mobile" v-if="!loading">
                <select v-model="selectedFilterOption">
                    <option value="">All Collections</option>
                    <option v-for="item in products" :value="item.contractAddress">{{ item.title }}</option>
                </select>
                <i class="chev-down"></i>
            </div>
        <div class="hide-mobile">
        <Footer v-if="!loading" />
        </div>            
    </div>
</template>
        



<style lang="scss" scoped>
.hide-mobile {
    @media(max-width: 880px) {
        display: none;
    }
}
.collection-picker {
    padding: 10px;
    .collection {
        .btn-select-col {
            position: absolute;
            bottom: 20px;
            width: 68%;
            border: none;
            height: 36px;
            cursor: pointer;
            border-radius: 20px;
            color: white;
            left: 0;
            font-weight: 500;
            font-family: 'Barlow';
            margin-left: 16%;
            font-size: 14px;
        }
        .overview {
            width: 100%;
            position: absolute;
            top: 50px;
            .left {
                @media(max-width: 880px) {
                    width: 45%;
                    margin-left: 5%;
                }
                border-top-left-radius: 10px;
                border-bottom-left-radius: 10px;
                float: left;
                margin-left: 15%;
                width: 34%;
                margin-right: 2px;
                height: 70px;
                h3 {
                    margin-top: 16px;
                    margin-bottom: 0;
                    font-size: 12px;
                    text-align: center;
                }
                h5 {
                    margin-top: 3px;
                    color: white;
                    font-size: 16px;
                    text-align: center;
                    text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
                }

            }
            .right {
                @media(max-width: 880px) {
                    width: 45%;
                }
                border-top-right-radius: 10px;
                border-bottom-right-radius: 10px;
                float: left;
                width: 34%;
                height: 70px;
                h3 {
                    margin-top: 16px;
                    margin-bottom: 0;
                    font-size: 12px;
                    text-align: center;
                }
                h5 {
                    margin-top: 3px;
                    color: white;
                    font-size: 16px;
                    text-align: center;
                    text-shadow: 3px 3px 0px #030420, 2px 2px 0px #030420, 1px 1px 0px #030420;
                }
            }
        }
        width: 100%;
        margin-top: 15px;
        height: 190px;
        border-radius: 10px;
        position: relative;
        background-size: cover;
        background-repeat: no-repeat;
        background-position-y: -10px;
        border: 1px solid #273953;
        
        h2 {
            color: white;
            position: absolute;
            top: 3px;
            width: 100%;
            font-size: 18px;
            text-align: center;
            font-weight: 600;
        }
    }
}
.filter-mobile {
    left: 13px;
    height: 50px;
    width: calc(100% - 20px);
    position: fixed;
    bottom: 0;
    display: none;

    @media(max-width: 880px) {
     display: block;
    }

    select {
        padding-left: 12px;
        font-size: 13px;
        padding-top: 0px;
        width: 100%;
        height: 35px;
        text-align: left;
        background-color: #0f1823;
        border: 1px solid #23303c;
        color: white;
        outline: none;
        border-radius: 20px;
        -webkit-appearance: none;
        -moz-appearance: none;

    }
    select::-ms-expand {
        display: none;
    }
    i.chev-down {
        background-image: url("../assets/icons/chev-down.png");
        width: 12px;
        height: 12px;
        display: block;
        background-size: cover;
        position: absolute;
        z-index: 0;
        z-index: 2;
        right: 100px;
        pointer-events: none;
        top: 12px;
        @media(max-width: 880px) {
            right: 15px;
        }
    }

}
.filter {
    margin-top: 20px;
    float: right;
    position: relative;
    @media(max-width: 880px) {
        display: none;
    }
    select {
        padding-left: 12px;
        font-size: 13px;
        padding-top: 0px;
        width: 160px;
        height: 35px;
        text-align: left;
        margin-right: 82px;
        background-color: #0f1823;
        border: 1px solid #23303c;
        color: white;
        outline: none;
        border-radius: 20px;
        -webkit-appearance: none;
        -moz-appearance: none;
        @media(max-width: 880px) {
            margin-right: 21px;
        }

    }
    select::-ms-expand {
        display: none;
    }
    i.chev-down {
        background-image: url("../assets/icons/chev-down.png");
        width: 12px;
        height: 12px;
        display: block;
        background-size: cover;
        position: absolute;
        z-index: 0;
        z-index: 2;
        right: 100px;
        pointer-events: none;
        top: 14px;
        @media(max-width: 880px) {
            right: 35px;
        }
    }

}
@keyframes pulse {
  0% {
    box-shadow: 0px -1px 10px 0px #0AADF5;
  }
  50% {
    box-shadow: 0px -1px 15px 3px #0AADF5;
  }
  100% {
    box-shadow: 0px -1px 10px 0px #0AADF5;
  }
}

.warn-no-tickets {
    text-align: center;
    width: 100%;
    h5 {
        color: white;
        font-size: 16px;
        font-weight: 300;
    }
}
.claimed {
    opacity: 0.6;
}
.unclaimed {
    animation: pulse 2s infinite;
}

.desktop {
    display: block;
    @media(max-width: 880px) {
        display: none;
    }
}
.mobile {
    display: none;
    @media(max-width: 880px) {
        display: block;
    }
}
.ticket-wrapper {
      &::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 0;
        height: 0;
        display: none!important;
    }
    @media(max-width: 880px) {
        padding: 13px;
        min-height: calc(100vh - 60px);
        min-height: calc(100dvh - 60px);
        overflow: auto;
    }
    min-height: calc(100vh - 263px);
    max-width: 100%;
    overflow: hidden;
    .ticket-holder {
    min-height: 520px;
    background-color: grey;
    width: 9000px;
    overflow-x: auto;
    margin-top: 5px;
    .ticket-item {
        height: 326px;
        width: 180px;
        margin-right: 10px;
        float: left;
        margin-top: 5px;
        background-color: white;
    }
}
}
.mobreset {
    @media(max-width: 880px) {
        height: 326px!important;
        width: 180px!important;
    }
}
.spin {
    width: 50px;
    padding-left: calc(50% - 50px);
    @media(max-width: 880px) {
        text-align: center!important;
    }
}
.title {
    margin-bottom: 0;
    font-size: 18px;
    font-weight: 600;
}
.status {
    font-size: 12px;
    font-weight: 600;
    color: #899BB5;
    margin-top: 0;
}
.btn-action {
    cursor: pointer;
    margin-top: 10px;
    border-radius: 5px;
    background-color: white;
    color: black;
    border: none;
    margin-right: 5px;
    font-weight: 500;
    font-size: 15px;
    padding: 13px 25px;
    font-weight: 600;

    &.main {
        width: 100%;
        color: #333;
        font-weight: 600;
        background-image: radial-gradient(circle farthest-corner at 10% 20%, rgb(51 249 238) 0%, rgb(19 255 179) 100.2%);
        background: radial-gradient(circle farthest-corner at 10% 20%, rgb(249, 232, 51) 0%, rgb(250, 196, 59) 100.2%);
    }
    &.dis {
        background-color: #353535;
        background-image: none;
        color: white;
    }
}

.ticket-check {
    p {
        font-size: 13px;
        font-weight: 200;
        margin-top: 30px;
        width: 50%;
        float: left;
        @media(max-width: 880px) {
            width: 100%;
        }
        label.switch {
            padding-top: -50px;
            margin-right: 12px;
            color: #E7E7E7;
            top: -3px;
            span.slider {
                background-color: #20344b
            }
            input:checked + .slider {
                background-color: #0085FF;
            }
        }
    }
}

.tickconnect {
    margin-top: 50px;
    text-align: center;
}
.tickhead {
    margin-top: 30px;
    font-weight: 600!important;
    font-size: 24px;
    margin-bottom: 5px;
    position: relative;
    @media(max-width: 880px) {
        text-align: left;
        padding-left: 23px;
    }
    button {
        position: absolute;
        right: 85px;
        font-size: 14px;
        top: -20px;
        width: 115px;
        height: 36px;
        @media(max-width: 880px) {
            top: -25px;
            right: 24px;
        }
    }
    
}
.btn-modal {
    cursor: pointer;
    margin-top: 10px;
    border-radius: 5px;
    background-color: white;
    color: black;
    border: none;
    margin-right: 5px;
    font-weight: 500;
    font-size: 15px;
    padding: 13px 25px;
    font-weight: 600;

    &.x {
        background-color: #222;
        color: white;
        height: 47px;
        margin-left: 5px;
    }

    &.verse {
        color: #333;
        font-weight: 600;
        background-image: radial-gradient(circle farthest-corner at 10% 20%, rgb(51 249 238) 0%, rgb(19 255 179) 100.2%);
        background: radial-gradient(circle farthest-corner at 10% 20%, rgb(249, 232, 51) 0%, rgb(250, 196, 59) 100.2%);
    }
    
    &.uniswap {
        background-color: white!important;
        color: #1c1b22;
    }
}
div.tickets {
    display: inline-block;
    margin-bottom: 100px;
    padding-left: 50px;
    @media(max-width: 880px) {
        width: max-content;
        display: inline-block;
        padding-left: 10px;
        padding-top: 20px;
        margin-bottom: 50px!important;

    }
    h3 {
        font-weight: 400;
        color: white;
    }
    .ticket {
        @media(max-width: 880px) {
            width: 180px;
        }
        float: left;
        position: static;
        color: white;
        width: 280px;

        margin-right: 10px;
        button {
            font-size: 14px;
            margin-top: 5px;
            height: 36px;
        }
        img {
            width: 100%;
            height: 515px;
            border-radius: 7px;
        }
    }
}
.head {
    @media(max-width: 880px) {
       text-align : center;
       padding-left: 0;
    }
    padding-left: 50px;
    color: white;
    
}
.page {
    margin-top: 70px!important;
    z-index: 0;
    overflow: hidden;
    &::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 0;
        height: 0;
        display: none!important;
    }
    @media(max-width: 880px) {
        margin-top: 20px!important;
        width: 100%;
        padding-top: 16px;
        height: calc(100vh - 100px);
        height: calc(100dvh - 100px);
        margin-top: 0;
    }

    min-height: calc(100vh - 80px);
    margin-top: 0px;
    height: max-content;
    width: 100%;

    position: unset;
    overflow: auto;
}

.clearfix::after {
  content: "";
  clear: both;
  display: table;
}

</style>