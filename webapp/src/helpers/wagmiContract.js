import {
    readContract,
    getBalance,
    writeContract,
  } from "@wagmi/core";
  import core from "../core";
  import globals from "../globals";
  import RouterContractABI from "../abi/router-contract.json";

  export const buyTicketsWithEth = async (contractAddress, ticketCount, price) => {

    try {
      const hash = await writeContract(core.config, {
        address: globals.ROUTER_CONTRACT_ADDRESS,
        abi: RouterContractABI,
        functionName: 'buyTicketsWithETH',
        value: price,
        gas: 350000n,
        args: [
          contractAddress,
          ticketCount,
          '0xedf6066a2b290c185783862c7f4776a2c8077ad1'
        ],
      })
      return hash;
    } catch (e) {
      throw e;
    }
  };

  export const getNativeBalance = async (address, chainId) => {
    try {
      const data = await getBalance(core.config, {
        address,
        chainId,
      });
      return data.formatted ?? 0;
    } catch (e) {
      console.error("Error fetching ethBalance", e);
    }
  };

export const getEthPrice = async (contractAddress, purchaseAmount) => {
    try {
        const data = await readContract(core.config, {
          address: globals.ROUTER_CONTRACT_ADDRESS,
          abi: RouterContractABI,
          functionName: "getETHPriceForTickets",
            args: [contractAddress, purchaseAmount, '0xedf6066a2b290c185783862c7f4776a2c8077ad1']
        });
        return data;
      } catch (e) {
        console.log('Error fetching EthPrice', e);
      }
  }

export const getWeth = async () => {
  try {
    const data = await readContract(core.config, {
      address: globals.ROUTER_CONTRACT_ADDRESS,
      abi: RouterContractABI,
      functionName: "WETH",
      args: []
    });
    if (data) return data;
  } catch (e) {
      console.error('Error fetching WETH:', e.message, e);
  }
}

export const getVerseToken = async () => {
  try {
    const data = await readContract(core.config, {
      address: globals.ROUTER_CONTRACT_ADDRESS,
      abi: RouterContractABI,
      functionName: "VERSE_TOKEN",
      args: []
    });
    if (data) return data;
  } catch (e) {
      console.error('Error fetching Verse token:', e.message, e);
  }
}