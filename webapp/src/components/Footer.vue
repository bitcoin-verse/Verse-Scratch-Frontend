<template>
    <div class="footer-wrap">
        <div class="footer-content">
            <div class="footer-links">
                <a href="https://www.bitcoin.com" target="_blank" rel="noreferrer"><img src="../assets/icons/brand.png" alt="Bitcoin.com" class="footer-brand-link"></a>
                <div class="short-links">
                    <a @click="logclick('user-agreement')" href="https://www.bitcoin.com/legal/user-agreement/" target="_blank" rel="noreferrer" class="short-link">User Agreement</a>
                    <a @click="logclick('cookies')" href="https://www.bitcoin.com/legal/cookies/" target="_blank" rel="noreferrer" class="short-link">Cookie Policy</a>
                    <a @click="logclick('help')" href="https://support.bitcoin.com/en/collections/3413550-verse-dex" target="_blank" rel="noreferrer" class="short-link">Need Help?</a>
                </div>
            </div>
            <div class="company">© 2024 Saint Bitts LLC Bitcoin.com. All rights reserved.</div>
        </div>
    </div>
</template>

<script>
import { logAmplitudeEvent } from "../helpers";
import { getAccount } from '@wagmi/core'
import core from "../core"
export default {
    setup() {

        function logclick(cta) {
            let account = getAccount(core.config)
            logAmplitudeEvent({
                name: 'navigation clicked',
                menu: 'footer',
                cta: cta,
                blockchain: account.chainId
            })
        }
        return {
            logclick
        }
    }
}
</script>


<style lang="scss" scoped>
.footer-wrap {
    position: absolute;
    @media(max-width: 880px) {
        position: static;
    }
    left: 0;
    display: flex;
    justify-content: flex-end;
    box-sizing: border-box;
    width: 100%;
    padding: 1.5rem;
    flex-direction: column;
    flex: 0 1 0%;
    z-index: 1;
    background: #0A0A2C;
    border-top: 1px solid #141F4C;
    @media(min-width: 880px) {
        height: 64px;
    }


    .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        .footer-links {
            display: flex;
            flex-wrap: wrap-reverse;
            align-items: center;
            gap: 1rem;
            .footer-brand-link {
                height: auto;
                object-fit: contain;
                width: 7.5rem;
            }
            .short-links {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 1rem;

                .short-link {
                    text-decoration: none;
                    font-size: 0.75rem;
                    font-weight: 400;
                    color: #8B92AA;
                    @media(max-width:880px) {
                        width: 9.719rem;
                    }
                }
            }
        }
        .company {
            font-size: 0.75rem;
            font-weight: 400;
            color:#434C74;
            ;
        }
    }

}
</style>