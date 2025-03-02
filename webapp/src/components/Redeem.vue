<script setup>
import { waitForTransactionReceipt, writeContract} from '@wagmi/core'
import { ref, onMounted, watch } from 'vue';
import ContractABI from '../abi/contract.json'
import { changeLocation } from '../helpers'
import core from '../core.js';
import { polygon } from '@reown/appkit/networks';
import Sparkles from './Sparkles.vue';

const props = defineProps(['closeDetailScreen', 'claim', 'detailNFT', 'setScratched', 'toggleModal'])

const count = ref(0);
const imageLoaded = ref(false)
const modalTutorial = ref(true)
const showTutorial = ref(true)
const winModal = ref(false)
const modalLoading = ref(false)
const modalLoadingText = ref("")
const txHash = ref("")
const modalFinish = ref(false)
const autoScratch = ref(undefined)

if(props.claim == true) {
    winModal.value = true
}

const disableTutorial = () => {
    modalTutorial.value = false
}

const toggleShow = () => {
    showTutorial.value = !showTutorial.value
    localStorage.setItem('showTutorial', showTutorial.value)
}

const goTo = (href) => {
    changeLocation(href ?? '/tickets');
}

const redeem = async (address) => {
    txHash.value = ""

    winModal.value = false
    modalLoading.value = true;
    modalLoadingText.value = "Please confirm the claim in your connected wallet"
    try {
        const hash = await writeContract(core.config, {
            address: address,
            abi: ContractABI,
            functionName: 'claimPrize',
            chainId: 137,
            args: [props.detailNFT.id]
        })
        modalLoadingText.value = "Waiting for transaction to confirm"
        txHash.value = hash
        await waitForTransactionReceipt(core.config, { hash })
        modalLoading.value = false
        modalFinish.value = true
    } catch (e) {
        console.log(e)
        winModal.value = true
        modalLoading.value = false;

    }
}

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

const startScratch = () => {
    autoScratch.value = true;
    finalizeTicket();
}

watch(count, async (newValue)=> {
    if (newValue > 0) {
       autoScratch.value = false     
    }
    if (newValue === 8) { 
        
        localStorage.setItem(props.detailNFT.id.toString() + '/' + props.detailNFT.address.toString(), true)

        setTimeout(() => {
            finalizeTicket()
        }, 2000)
    }

})

watch(autoScratch, async (newValue)=> {
    if (newValue === true) { 
        
        localStorage.setItem(props.detailNFT.id.toString() + '/' + props.detailNFT.address.toString(), true)

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
                        <button @click="disableTutorial()" class="btn verse-wide">Start Scratching</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal" v-if="winModal">
            <div class="modal-body no-min-height ">
                <div>
                    <div class="img-purchase"></div>
                    <div>
                        <h3 class="title">You have won<br/>{{ Number(detailNFT.prize).toLocaleString()}} VERSE</h3>
                        <p class="subtext short" style="margin-bottom: 0;">Congratulations! Claim your prize instantly, or save it for later.</p>
                        <button class="btn verse-wide" @click="redeem(detailNFT.address)">Claim Now</button>
                        <button class="btn verse-wide secondary" @click="goTo()">View My Tickets</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal" v-if="modalFinish">
            <div class="modal-body no-min-height">
                <div>
                    <div class="img-purchase"></div>
                    <div>
                        <h3 class="title">{{ Number(detailNFT.prize).toLocaleString()}} VERSE<br/>secured!</h3>
                        <p class="subtext short" style="margin-bottom: 0;">Thank you for playing, and congrats on your win!</p>
                        <button class="btn verse-wide" @click="goTo()">View My Tickets</button>
                        <button class="btn verse-wide secondary" @click="goTo(`${polygon.blockExplorers.default.url}/tx/${txHash}`)">View Transaction</button>              
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
                        <button
                            class="btn verse-wide secondary"
                            @click="goTo(`${polygon.blockExplorers.default.url}/tx/${txHash}`)"
                            v-if="txHash && polygon"
                        >
                            View blockchain transaction
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="background"></div>
    <div class="page">
        <div class="cont" id="conthandler">
            <div class="progress" v-if="autoScratch === false || claim">
                <span>{{ claim ? '8' : count }} / 8 SCRATCHED </span>
            </div>
            <div class="auto" v-else-if="autoScratch === undefined || autoScratch === true" @click="startScratch()">
                <Sparkles />
                <span> Auto Scratch </span>
            </div>
            <a @click="closeDetailScreen()"><div class="close-scratch"></div></a>
            <div v-if="!imageLoaded" style="padding: 100px;">
                <div style="text-align: center;">
                    <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                </div>
            </div>
            <div class="ticketholder animate__animated animate__backInDown " v-show="imageLoaded" :style="{'background-image': `url(https://${detailNFT.bucketUrl}.s3.amazonaws.com/${detailNFT.id}/${detailNFT.address}.jpg)` } ">
                <span v-if="!autoScratch">
                    <canvas id="scratchcanvas1" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas2" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas3" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas4" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas5" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas6" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas7" width="69" height="69"></canvas>
                    <canvas id="scratchcanvas8" width="69" height="69"></canvas>
                </span>
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
    font-weight: 800;
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
    span {
        color: #C5CEDB;
        font-size: 14px;
        font-weight: 600;
        margin: 0;
    }
}
.auto {
    @media(max-width: 880px) {
        margin-top: 20px;
        margin-bottom: 21px;
    }
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #0F518F;
    border-radius: 24px;
    text-align: center;
    padding: 9px;
    width: 138px;
    margin: 0 auto 60px;
    user-select: none; 
    span {
        color: #C5CEDB;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 0 8px;
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
    width: 100%;
    margin: auto;
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