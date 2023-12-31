<script>
import { getAccount, waitForTransaction, readContract, disconnect, writeContract, watchAccount, watchNetwork } from '@wagmi/core'
import { ref } from 'vue';
import ERC721ABI from '../abi/ERC721.json'
import Redeem from '../pages/Redeem.vue'
import { useWeb3Modal } from '@web3modal/wagmi/vue'
import ContractABI from '../abi/contract.json'
import ERC721 from '../abi/ERC721.json'
import { useRoute } from 'vue-router'
import GLOBALS from '../globals.js'
import Web3 from 'web3'
import Footer from '../components/Footer.vue'

export default {
    components: {
        Redeem,
        Footer,
    },  
    setup() {
        const route = useRoute()
        const contractAddress = GLOBALS.CONTRACT_ADDRESS
        const nftContract = GLOBALS.NFT_ADDRESS

        let list = []
        let account = getAccount()
        let accountActive = ref(false)
        let loading = ref(false)
        let modal = useWeb3Modal()
        let claimNow = ref(false)

        let winModal = ref(false)
        let giftModal = ref(false)
        let giftAccount = ref("")
        let claimNFT = ref(0)
        let step = ref(0);
        let nfts = ref([])
        let claimActive = ref(false)
        let modalLoading = ref(false)

        let openDetail = ref(false);
        let detailNFT = ref({});


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

        watchAccount(async () => {
            if(getAccount().address &&  getAccount().address.length != undefined) {
                accountActive.value = true;
                getTicketIds()
            } else {
                accountActive.value = false
            }
        })

        async function redeem(nftId) {
            modalLoading.value = true
            const obj = nfts.value.find(obj => obj.id == nftId);

            try {
                const { hash } = await writeContract({
                    address: contractAddress,
                    abi: ContractABI,
                    functionName: 'claimPrize',
                    chainId: 137,
                    args: [obj.id]
                })
                await waitForTransaction({ hash })
                modalLoading.value = false
                const objToUpdate = nfts.value.find(obj => obj.id == nftId);
                objToUpdate.claimed = true
                step.value = 1;
            } catch (e) {
                // modalLoading.value = false;
                console.log(e)
            }

        }

        function toggleModal() {
            openDetail.value = !openDetail.value
        }

        function setScratched(id) {
            localStorage.setItem(id.toString() + '/' + nftContract.toString(), true)
            const objToUpdate = nfts.value.find(obj => obj.id === id);
            if (objToUpdate) {
                objToUpdate.scratched = true;
            }
        }

        function openDetailScreen(id) {
            detailNFT.value = nfts.value.find(obj => obj.id === id);
            openDetail.value = true;
        }

        function closeGiftModal(connect) {
            if(connect) {
                modal.open()
            }
            giftModal.value = false
        }

        async function getClaimed(id) {
            try {
                const data = await readContract({
                address: GLOBALS.NFT_ADDRESS,
                abi: ERC721,
                functionName: 'claimed',
                args: [id]
                })
                
                if(data) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id);
                    if (objToUpdate) {
                        objToUpdate.claimed = data;
                        
                    }
                    return data 
                }
            } catch (e) {
                console.log(e)
            }               
        }

        async function getEdition(id) {
            
            try {
                const data = await readContract({
                address: GLOBALS.NFT_ADDRESS,
                abi: ERC721,
                functionName: 'editions',
                args: [id]
                })
                if(data.toString().length > 0) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id);
                    if (objToUpdate) {
                        objToUpdate.edition = parseInt(data);
                    }
                    return data 
                }
            } catch (e) {
                console.log(e)
            }
        }

        async function getPrizeAmount(id) {
            try {
                const data = await readContract({
                    address: GLOBALS.NFT_ADDRESS,
                    abi: ERC721,
                    functionName: 'prizes',
                    args: [id]
                })
                if(data) {
                    const objToUpdate = nfts.value.find(obj => obj.id == id);
                    if (objToUpdate) {
                        objToUpdate.prize = Web3.utils.fromWei(data, 'ether');
                    }
                    return data 
                }
            } catch (e) {
                console.log(e)
            }
               
        }


        function openClaimDetail(id) {
            detailNFT.value = nfts.value.find(obj => obj.id === id);
            claimNow.value = true
            openDetail.value = true
        }

        async function getRedemptionStatus(id) {
            try {
                const data = await readContract({
                address: nftContract,
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

        function ticketList() {
            return nfts.value.toReversed()
        }

        function closeDetailScreen() {
            openDetail.value = false;
        }
        async function getTicketIds() {
            try {
                loading.value = true;
                const data = await readContract({
                    address: nftContract,
                    abi: ERC721ABI,
                    functionName: 'ownedByAddress',
                    args: [getAccount().address]
                })
      
                if(data) {
                    let promiseArray = []
                    let arr = []
                    data.forEach(dat => {
                        let scratched = false
                        if(localStorage.getItem(dat.toString() + '/' + nftContract.toString()) == 'true') {
                            scratched = true
                        }
                        arr.push({id: parseInt(dat.toString()), scratched, claimed: false })
                        promiseArray.push(getRedemptionStatus(dat.toString()))
                    })
                    nfts.value = arr
                    nfts.value.forEach(nft => {
                        promiseArray.push(promiseArray.push(getClaimed(nft.id)))
                        promiseArray.push(promiseArray.push(getEdition(nft.id)))
                        promiseArray.push(promiseArray.push(getPrizeAmount(nft.id)))
                    })
                    await Promise.all(promiseArray)
                    loading.value = false;
                }
            } catch (e) {
                console.log(e)
                loading.value = false;
            }
        }   

        return {
            list, nfts, account, nftContract, openClaimDetail, claimNow, winModal, closeGiftModal, step, loading, giftModal, giftAccount, claimNFT, claimActive, modalLoading, toggleModal, accountActive, getTicketIds, ticketList, openDetail, openDetailScreen, closeDetailScreen, detailNFT, setScratched, redeem, getRedemptionStatus
        }   
    }
}
</script>

<template>
    <div class="backdrop" v-if="claimActive || giftModal">
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
                <a href="/?purchase-intent=true"><button class="btn verse-wide" href="">Buy Ticket</button></a>
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
            <div class="ticket" v-for="item, index in ticketList()">
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

                <div v-if="item.claimed == false">
                    <img class="mobreset" v-if="item.scratched == false" :src="'/prescratch/' + item.edition + '.png'">
                    <img class="mobreset unclaimed" v-if="item.scratched == true" :src="`https://verse-scratcher-images.s3.amazonaws.com/${item.id}/${nftContract}.jpg`">
                </div>

                <div v-if="item.claimed == true">
                    <img class="mobreset claimed" :src="`https://verse-scratcher-images.s3.amazonaws.com/${item.id}/${nftContract}.jpg`">
                </div>

                <button v-if="item.scratched == false && item.claimed == false" class="btn verse-wide secondary" @click="openDetailScreen(item.id)">Scratch Ticket</button>
                <button v-if="item.scratched == true && item.claimed == false" @click="openClaimDetail(item.id)" class="btn verse-wide" >Claim {{item.prize}} VERSE</button>
                <button v-if="item.claimed == true" class="btn verse-wide secondary disabled claimed" >VERSE Claimed</button>
            </div>
        </div>
        </div>
        <Footer v-if="!loading" />
    </div>
</template>
        


<style lang="scss" scoped>
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
    @media(max-width: 880px) {
        padding: 23px;
        min-height: calc(100vh - 60px);
        min-height: calc(100dvh - 60px);
        overflow: auto;
    }
    max-width: 100%;
    padding-top: 10px;
    overflow: hidden;
    .ticket-holder {
    min-height: 520px;
    background-color: grey;
    width: 9000px;
    overflow-x: auto;
    padding-top: 5px;
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

.tickconnect {
    margin-top: 50px;
    text-align: center;
}
.tickhead {
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
        right: 25px;
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
    &::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 0;
        height: 0;
        display: none!important;
    }
    @media(max-width: 880px) {
        width: 100%;
        padding-top: 16px;
        height: calc(100vh - 100px);
        height: calc(100dvh - 100px);
        margin-top: 0;
    }


    margin-top: 80px;
    height: max-content;
    min-height: calc(100vh - 70px);
    min-height: calc(100dvh - 70px);
    width: 100%;
    padding-top: 0px;


    position: relative;
    height: calc(100vh - 70px);
    height: calc(100dvh - 70px);
    overflow: auto;
}

.clearfix::after {
  content: "";
  clear: both;
  display: table;
}

</style>