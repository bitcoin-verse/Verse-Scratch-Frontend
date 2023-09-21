<script setup>

import { ref, onMounted, watch } from 'vue';

const props = defineProps(['closeDetailScreen', 'detailNFT', 'setScratched', 'toggleModal'])


let count = ref(8);

watch(count, async (newValue)=> {
    if (newValue == 0) {
        // fireworks
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

        // since particles fall down, start a bit higher than random
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

})

onMounted(() => {
    let scratched = [false, false, false, false, false, false, false, false];
    var options1 = { id: 'scratchcanvas1', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options2 = { id: 'scratchcanvas2', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options3 = { id: 'scratchcanvas3', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options4 = { id: 'scratchcanvas4', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options5 = { id: 'scratchcanvas5', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options6 = { id: 'scratchcanvas6', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options7 = { id: 'scratchcanvas7', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
    var options8 = { id: 'scratchcanvas8', brushSize: 10, lineJoin: 'round', percentRequired: 10, fillColor: '#bdbdbd' };
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
            count.value--;
        }
        if(count.value == 0) {
            props.setScratched(props.detailNFT.id);
        }
    }, false);
    })

})


</script>

<template>
    <div class="page">
        <div class="left">
            <div class="btn-holder">
            <a style="cursor: pointer" @click="closeDetailScreen()"><h5 class="breadcrumb"><i class="fa-solid fa-arrow-left"></i> Return to Ticket Overview</h5></a>
            <h2>Scratch <span>same number 3 times</span> to win</h2>
            <h3>Fields left to scratch: {{ count }}</h3>
            <p>Scratch the tickets by moving your mouse over the scratch fields. Alternatively you can check the prize by clicking on the check prize
                button below.
            </p>
        </div>
        </div>
        <div class="cont">
        <div class="ticketholder" :style="{'background-image': 'url(../src/assets/tickets/' + detailNFT.id + '.png)' } ">
            <canvas id="scratchcanvas1" width="68" height="68"></canvas>
            <canvas id="scratchcanvas2" width="68" height="68"></canvas>
            <canvas id="scratchcanvas3" width="68" height="68"></canvas>
            <canvas id="scratchcanvas4" width="68" height="68"></canvas>
            <canvas id="scratchcanvas5" width="68" height="68"></canvas>
            <canvas id="scratchcanvas6" width="68" height="68"></canvas>
            <canvas id="scratchcanvas7" width="68" height="68"></canvas>
            <canvas id="scratchcanvas8" width="68" height="68"></canvas>
        </div>
        </div>

        <div class="right" v-if="count == 0">
            <h2 class="win">You won a prize!</h2>
         
         <h3 class="win"> {{ detailNFT.prize }} Verse</h3>
         <p class="claim">Congratulations! You can claim your prize instantly</p>
         <button class="btn btn-redeem" style="cursor: pointer" v-if="detailNFT.claimed == false" @click="toggleModal(detailNFT.id)" >Claim Now</button>
         <button href="/tickets" class="btn btn-redeem" style="cursor: pointer" v-if="detailNFT.claimed == true" @click="closeDetailScreen()">Back to overview</button>
        </div>

        
    </div>
</template>


<style lang="scss">
.right {
    padding-top: 130px;
    .claim {
        color: white;
        margin-top: 0;
        margin-bottom: 0;
    }
    padding-left: 50px;
    h2.win {
        color: white!important;
    }
    h3.win {
        color: #fac43b!important;
        margin-bottom: 0;
    }
    float: left;
}
.breadcrumb {
    color: #fac43b;
}
h2.win {
    margin-bottom: 0;
    font-size: 17px;
   
}
h3.win {
    margin-top: 3px;
    color: #ffc700!important;
    font-size: 40px;
}
.left {
    margin-top: 50px;
    width: 32.7%;
    float: left;
    padding: 40px;
}
.btn-holder {
    h2 {
        color: white;
        text-align: left;
    }
    h3 {
        color: white;
    }
    p {
        color: white;
    }
}

.btn-check {
    background-color: #68686861;
    color: white;
    border: none;
    height: 40px;
    margin-right: 20px;
    padding: 10px 20px;
    border-radius: 5px;
    margin-top: 10px;
}

.btn-redeem {
    background: radial-gradient(circle farthest-corner at 10% 20%, rgb(249, 232, 51) 0%, rgb(250, 196, 59) 100.2%);
    color: #333;
    font-size: 15px;
    font-weight: 600;
    border: none;
    height: 40px;
    padding: 10px 20px;
    border-radius: 5px;
    margin-top: 10px;
}

.cont {
    float: left;
    
    padding-top: 25px;
    h2 {
        color: white;
        text-align: center;
    }
}
.ticketholder {
    position: relative;
    margin: 0 auto;
    background-size: contain;
    background-repeat: no-repeat;
    width: 383px;
    height: 720px;
}
#scratchcanvas1 {
    border-radius: 50%;
    position: absolute;
    bottom: 256px;
    left: 22px;
}

#scratchcanvas2 {
    border-radius: 50%;
    position: absolute;
    bottom: 256px;
    left: 109px;
}

#scratchcanvas3 {
    border-radius: 50%;
    position: absolute;
    bottom: 256px;
    left: 196px;
}

#scratchcanvas4 {
    border-radius: 50%;
    position: absolute;
    bottom: 256px;
    left: 284px;
}

#scratchcanvas5 {
    border-radius: 50%;
    position: absolute;
    bottom: 173px;
    left: 22px;
}

#scratchcanvas6 {
    border-radius: 50%;
    position: absolute;
    bottom: 173px;
    left: 109px;
}

#scratchcanvas7 {
    border-radius: 50%;
    position: absolute;
    bottom: 173px;
    left: 196px;
}

#scratchcanvas8 {
    border-radius: 50%;
    position: absolute;
    bottom: 173px;
    left: 284px;
}




.page {
    position: absolute;
    width: 100%;
}
</style>