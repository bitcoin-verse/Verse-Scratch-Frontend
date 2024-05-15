<script setup>
import { waitForTransactionReceipt, writeContract} from '@wagmi/core'
import { ref, onMounted, watch, computed } from 'vue';
import ContractABI from '../abi/contract.json'
import { store } from '../store.js'
import core from '../core'

const props = defineProps(['closeDetailScreen', 'claim', 'detailNFT', 'setScratched', 'toggleModal'])
const activeProduct = computed(() => store.getProduct())

let count = ref(0);
let imageLoaded = ref(false)
let modalTutorial = ref(true)
let showTutorial = ref(true)
let winModal = ref(false)
let modalLoading = ref(false)
let modalLoadingText = ref("")
let txHash = ref("")
let modalFinish = ref(false)

if(props.claim == true) {
    winModal.value = true
    count.value = 8
}

const disableTutorial = () => {
    modalTutorial.value = false
}

const toggleShow = () => {
    showTutorial.value = !showTutorial.value
    localStorage.setItem('showTutorial', showTutorial.value)
}

const redeem = async (address) => {
    txHash.value = ""

    console.log("redeem", address)
    winModal.value = false
    modalLoading.value = true;
    modalLoadingText.value = "Please confirm the claim in your connected wallet"
    try {
        const hash = await writeContract(core.config, {
            address: address,
            abi: ContractABI,
            functionName: 'claimPrize',
            gas: 130000,
            args: [props.detailNFT.id]
        })
        modalLoadingText.value = "Waiting for transaction to confirm"
        txHash.value = hash
        let normalHash = { hash }
        await waitForTransactionReceipt(core.config, { normalHash })
        winModal.value = false
        modalLoading.value = false
        modalFinish.value = true
    } catch (e) {
        if(e instanceof TypeError) {
            modalLoading.value = false
            modalFinish.value = true
        } else {
            winModal.value = true
            modalLoading.value = false;
        }
    }
}



watch(count, async (newValue)=> {
    if (newValue == 8) { 
        
        localStorage.setItem(props.detailNFT.id.toString() + '/' + props.detailNFT.address.toString(), true)

        const finalizeTicket = () => {
            winModal.value = true

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

            if(sessionStorage.getItem('isWallet') === "false") {
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
                )
            }
                
            }, 200)
        }

        setTimeout(() => {
            finalizeTicket()
        }, 2000)
    }

})

onMounted(() => {
    if(Boolean(localStorage.getItem('showTutorial')) == true) {
        modalTutorial.value = false
    }
    const img = new Image();
    img.src = `https://${props.detailNFT.bucketUrl}.s3.amazonaws.com/${props.detailNFT.id}/${props.detailNFT.address}.jpg`
    img.onload = () => {
        setTimeout(() => {
            if(props.claim == false) {
            setupScratch()
            }
            imageLoaded.value = true;    
        }, 800)   
    };

    function setupScratch() {
        let scratched = [false, false, false, false, false, false, false, false];
        var options1 = { id: 'scratchcanvas1', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options2 = { id: 'scratchcanvas2', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options3 = { id: 'scratchcanvas3', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options4 = { id: 'scratchcanvas4', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options5 = { id: 'scratchcanvas5', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options6 = { id: 'scratchcanvas6', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options7 = { id: 'scratchcanvas7', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        var options8 = { id: 'scratchcanvas8', brushSize: 15, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
        let one = new window.ScratchCard(options1);
        let two = new window.ScratchCard(options2);
        let three = new window.ScratchCard(options3);
        let four = new window.ScratchCard(options4);
        let five = new window.ScratchCard(options5);
        let six = new window.ScratchCard(options6);
        let seven = new window.ScratchCard(options7);
        let eight = new window.ScratchCard(options8);

        let arr = [one, two, three, four, five, six, seven, eight]
        arr.forEach((item, idx) => {
            item.addEventListener('success', function (e) {
                if(scratched[idx] == false) {
                    scratched[idx] = true
                    count.value++;
                }
                if(count.value == 8) {
                    props.setScratched(props.detailNFT.id);
                }
            }, false);
        })
    }
})
</script>

<template>
    <div class="backdrop" v-if="modalTutorial || winModal || modalLoading || modalFinish">
        <div class="modal" v-if="modalTutorial && !winModal && !modalFinish && !modalLoading">
            <div class="modal-body no-min-height">
                <div>
                    <div class="img-purchase"></div>
                    <div>
                        <h3 class="title">3 is the magic number</h3>
                        <p class="subtext short desktop-text" style="margin-bottom: 0;">Reveal the numbers by dragging your mouse over the silver moons.<br/>Unearth three matching numbers and you've hit a cosmic jackpot!</p>
                        <p class="subtext short mobile-text" style="margin-bottom: 0;">Reveal the numbers by dragging your finger over the silver moons.<br/>Unearth three matching numbers and you've hit a cosmic jackpot!</p>
                        <div class="gift-toggle-holder">
                            <h3 class="title">Don't show again</h3>
                            <label class="switch">
                            <input type="checkbox" v-on:change="toggleShow">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <a @click="disableTutorial()"><button class="btn verse-wide">Start Scratching</button></a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal" v-if="winModal">
            <div class="modal-body no-min-height ">
                <div>
                    <div class="img-purchase"></div>
                    <div>
                        <h3 class="title">You have won<br/>{{ detailNFT.prize}} VERSE</h3>
                        <p class="subtext short" style="margin-bottom: 0;">Congratulations! Claim your prize instantly, or save it for later.</p>
                        <a @click="redeem(detailNFT.address)"><button class="btn verse-wide">Claim Now</button></a>
                        <a href="/tickets"><button class="btn verse-wide secondary">View My Tickets</button></a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal" v-if="modalFinish">
            <div class="modal-body no-min-height">
                <div>
                    <div class="img-purchase"></div>
                    <div>
                        <h3 class="title">{{ detailNFT.prize}} VERSE<br/>secured!</h3>
                        <p class="subtext short" style="margin-bottom: 0;">Thank you for playing, and congrats on your win!</p>
                        <a href="/tickets"><button class="btn verse-wide">View My Tickets</button></a>                    
                    </div>
                </div>
            </div>
        </div>
        <div class="modal" v-if="modalLoading">
            <div class="modal-body no-min-height">
                <div>
                    <div>
                        <div class="img-spinner" style="margin-top: 25px"></div>
                        <h3 class="title-loading">{{ modalLoadingText }}</h3>
                        <a target="_blank" style="color: #0085FF; font-weight: 600;" :href="`https://polygonscan.com/tx/${txHash}`" v-if="txHash && !showTimer">View blockchain transaction</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="background"></div>
    <div class="page">
        <div class="cont" id="conthandler">
            <div class="progress">
                <h3>FIELDS SCRATCHED {{ count }} / 8</h3>
            </div>
            <a @click="closeDetailScreen()"><div class="close-scratch"></div></a>
            <div v-if="!imageLoaded" style="padding: 100px;">
                <div style="text-align: center;">
                    <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                </div>
            </div>
            <div class="ticketholder animate__animated animate__backInDown " v-show="imageLoaded" :style="{'background-image': `url(https://${detailNFT.bucketUrl}.s3.amazonaws.com/${detailNFT.id}/${detailNFT.address}.jpg)` } ">
                <canvas id="scratchcanvas1" width="69" height="69"></canvas>
                <canvas id="scratchcanvas2" width="69" height="69"></canvas>
                <canvas id="scratchcanvas3" width="69" height="69"></canvas>
                <canvas id="scratchcanvas4" width="69" height="69"></canvas>
                <canvas id="scratchcanvas5" width="69" height="69"></canvas>
                <canvas id="scratchcanvas6" width="69" height="69"></canvas>
                <canvas id="scratchcanvas7" width="69" height="69"></canvas>
                <canvas id="scratchcanvas8" width="69" height="69"></canvas>
            </div>
        </div>
    </div>
</template>



<style lang="scss" scoped>

.desktop-text {
    display: unset;
    @media (max-width: 880px) {
        display: none!important;
    }
}

.mobile-text {
 display: none; 
 @media (max-width: 880px) {
    display: unset!important;
 }
}
.title-loading {
    font-size: 18px;
    color: white;
    font-weight: 600;
    margin-top: 16px!important;
}
.backdrop {
    z-index: 5!important;
}

.modal {
    z-index: 6!important;
    width: 340px;
    top: 25vh;
    left: calc(50% - 170px);
    height: unset!important;
    @media(max-width: 880px) {
        left: 37px;
        top: 22vh;
        border-radius: 24px;
        width: calc(100% - 74px);
        height: unset;
        min-height: unset
    }
    .modal-body {
        height: unset;
        padding: 24px;

        .title {
            margin-bottom: 0;
        }
        .subtext.short {
            width: 290px;
            margin-left: calc(50% - 175px);
            margin-top: 8px;
            color: #C5CEDB;
            @media(max-width: 880px) {
                width: 90%;
                margin-left: 5%;
                padding: 0;
            }
        }
        .verse-wide {
            font-size: 14px!important;
            height: 36px;
            margin-top: 16px;
            &.secondary {
                margin-top: 8px;
            }
        }

        .gift-toggle-holder {
            height: 40px;
            margin-top: 16px;
            .switch {
                top: 8px;
                right: 8px;
            }
            h3.title {
                margin-top: 10px;
                font-size: 14px!important;
                left: 16px;
            }
        }
    }
}
.close-scratch {
    cursor: pointer;
    width: 34px;
    height: 34px;
    background-image: url("../assets/icons/icn-close-circle.png");
    background-size: cover;
    position: absolute;
    top: 21px;
    right: 16px;
}
.progress {
    @media(max-width: 880px) {
        margin-top: 20px;
        margin-bottom: 21px;
    }
    background-color: #030C14;
    border-radius: 24px;
    text-align: center;
    padding: 9px;
    width: 204px;
    margin-left: calc(50% - 110px);
    margin-bottom: 60px;
    user-select: none; 
    h3 {
        color: #C5CEDB;
        font-size: 14px;
        font-weight: 600;
        margin: 0;
    }
}
.background {
    // background-image: v-bind('activeProduct.backgroundImage')!important;
    background: linear-gradient(180deg, #152334 0%, #030C14 100%);
    left: 0;
    top: 0;
    background-size: 100%;
    position: fixed;
    background-repeat: no-repeat;
    width: 110%;
    height: calc(100vh + 10%);
    filter: blur(5px);
    overflow: hidden;
    margin: -5%;
    z-index: 0;
}
.blur {
    filter: blur(8px);
    z-index: 1;
    position: absolute;
    width: 100%;
    height: 100vh;
    left: 0;
    top: 0;
}
.page { 
    margin-top: 70px;
    z-index: 1;
    left: 0;
    width: 100%;
    min-height: calc(100vh - 70px)!important;
    position: absolute!important;
    top: 0;
    overflow: auto;
    @media(max-width: 880px) {
        margin-top: 20px;
    }
}
.cont {
    width: 350px;
    margin-left: calc(50% - 175px);
    @media(max-width: 880px) {
        padding-top: 0;
        padding-left: 0;
        padding-bottom: 200px;
        margin-left: 0;
        width: 100%;
        overflow: auto;
    }
    padding-top: 20px;
    h2 {
        color: white;
        text-align: center;
    }
}
.ticketholder {
    position: absolute;
    margin: 0 auto;
    background-size: contain;
    background-repeat: no-repeat;
    width: 356px;
    height: 720px;
    @media(max-width: 880px) {
        margin-left: calc(50% - 178px);
    }

}
#scratchcanvas1 {
    border-radius: 50%;
    position: absolute;
    bottom: 286px;
    left: 22px;
}

#scratchcanvas2 {
    border-radius: 50%;
    position: absolute;
    bottom: 286px;
    left: 103px;
}

#scratchcanvas3 {
    border-radius: 50%;
    position: absolute;
    bottom: 286px;
    left: 184px;
}

#scratchcanvas4 {
    border-radius: 50%;
    position: absolute;
    bottom: 286px;
    left: 264px;
}

#scratchcanvas5 {
    border-radius: 50%;
    position: absolute;
    bottom: 207px;
    left: 22px;
}

#scratchcanvas6 {
    border-radius: 50%;
    position: absolute;
    bottom: 207px;
    left: 103px;
}

#scratchcanvas7 {
    border-radius: 50%;
    position: absolute;
    bottom: 207px;
    left: 184px;
}

#scratchcanvas8 {
    border-radius: 50%;
    position: absolute;
    bottom: 207px;
    left: 264px;
}
</style>