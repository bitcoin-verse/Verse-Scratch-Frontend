import {
    readContract,
  } from "@wagmi/core";
  import core from "../core";
  import globals from "../globals";
  import RouterContractABI from "../abi/router-contract.json";
  import { formatEther } from "viem";

export const getEthPrice = async (contractAddress, purchaseAmount) => {
    try {
        if (!!contractAddress || !!purchaseAmount) return;
        const data = await readContract(core.config, {
          address: globals.ROUTER_CONTRACT_ADDRESS,
          abi: RouterContractABI,
          functionName: "getETHPriceForTickets",
            args: [contractAddress, purchaseAmount, '0xedf6066a2b290c185783862c7f4776a2c8077ad1']
        });
        if (data) {
        console.log('data', formatEther(data));
        }
      } catch (e) {
        console.log(e);
      }
  }