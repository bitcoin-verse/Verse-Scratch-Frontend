// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ScratchNFT3.sol";

contract VerseVRF is Ownable, VRFConsumerBaseV2 {
    using SafeERC20 for IERC20;

    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    ScratchNFT nftContract;

    uint64 constant SUBSCRIPTION_ID = 951;
    uint16 constant CONFIRMATIONS_NEEDED = 3;
    uint32 constant CALLBACK_MAX_GAS = 2000000;
    bytes32 constant GAS_KEYHASH = 0xcc294a196eeeb44da2888d17c0625cc88d70d9760a69d58d853ba6581a9ab0cd; 
    address constant TOKEN_ADDRESS = 0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc; 

    uint256 currentTokenId;
    uint256 public ticketCost;

    struct Drawing {
        uint256 drawId;
        address ticketReceiver;
    }

    struct PrizeTier {
        uint256 start;
        uint256 end;
        uint256 prizeAmount;
    }

    uint256[] private _randomNumbers;
    
    mapping(uint256 => uint256) public drawIdToRequestId;
    mapping(uint256 => Drawing) public requestIdToDrawing;

    PrizeTier[] public prizeTiers;

    uint public drawId = 0;
 
    /// @notice initialize contract and set the VRF Coordinator address
    /// @param _vrfCoordinatorV2Address The address of the Chainlink VRF Coordinator v2.
    /// @param _ticketCost cost of ticket in currency (cost in ethers, not wei)
    constructor(address _vrfCoordinatorV2Address, uint _ticketCost) 
    VRFConsumerBaseV2(_vrfCoordinatorV2Address)
    {
        nftContract = new ScratchNFT("SKRCH", "ST2");
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2Address);
        ticketCost = _ticketCost;

        // init prize tiers, VRF supplies rng
        // rng between 1 and 1000
        // number 1 wins jackpot
        // eg if number is either 2 and 3 pay 100k etc
        prizeTiers.push(PrizeTier(1, 1, 1_000_000)); 
        prizeTiers.push(PrizeTier(2, 3, 100_000));
        prizeTiers.push(PrizeTier(4, 9, 50_000)); 
        prizeTiers.push(PrizeTier(10, 49, 10_000)); 
        prizeTiers.push(PrizeTier(50, 149, 5_000)); 
        prizeTiers.push(PrizeTier(150, 349, 1_000)); 
        prizeTiers.push(PrizeTier(350, 649, 5_00)); 
        prizeTiers.push(PrizeTier(650, 1000, 1_00)); 
    }

    function getPrizeTier(uint256 number) internal view returns (uint256) {
        uint256 prize = 0;
        for (uint256 i = 0; i < prizeTiers.length; i++) {
            if (number >= prizeTiers[i].start && number <= prizeTiers[i].end) {
                prize = prizeTiers[i].prizeAmount;
                return prize;
            }
        }
        return prize;
    }

    /// @notice callback function for chainlink's VRF
    /// @dev amount of gas this function is allowed to spent is set on vrfCoordinator.requestRandomWords 
    /// @param _requestId id of the vrf request
    /// @param _randomWords array with random numbers generated by VRF
   function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords)
        internal
        override
    {
        Drawing storage currentDraw = requestIdToDrawing[_requestId];

        uint32 randomNumber = uint32((_randomWords[0] % 1000 + 1)); // 1 to 1000
        uint32 randomEdition = uint32((_randomWords[1] % 10 + 1)); // 1 to 10
        uint256 prize = getPrizeTier(randomNumber);

        ++currentTokenId;

        nftContract.mint(currentTokenId, randomEdition, prize, currentDraw.ticketReceiver);

        emit requestFulfilled(currentDraw.drawId, _requestId, randomNumber);
    }
 
    function bulkSend(address[] memory receivers) public onlyOwner {
        for(uint i; i < receivers.length; i++) {
            uint256 requestId = vrfCoordinator.requestRandomWords(
                GAS_KEYHASH, // gas keyhash (sepoila 30 gwei)
                SUBSCRIPTION_ID, // subscription id
                CONFIRMATIONS_NEEDED, // conf needed
                CALLBACK_MAX_GAS, // callback gas 
                2
            );
    
            Drawing memory newDrawing = Drawing({
                drawId: drawId,
                ticketReceiver: receivers[i]
            });

            ++drawId;

            requestIdToDrawing[requestId] = newDrawing;
            drawIdToRequestId[drawId] = requestId;
            emit DrawRequest(drawId, requestId, msg.sender);
        }
    }
 
    /// @notice request to purchase scratch ticket
    /// @param receiver address that receives NFT

    function buyScratchTicket(address receiver) public {
        // DISABLED FOR TESTING
        // IERC20(TOKEN_ADDRESS).safeTransferFrom( msg.sender, address(this), ticketCost * 1 ether);

        uint256 requestId = vrfCoordinator.requestRandomWords(
            GAS_KEYHASH, // gas keyhash (sepoila 30 gwei)
            SUBSCRIPTION_ID, // subscription id
            CONFIRMATIONS_NEEDED, // conf needed
            CALLBACK_MAX_GAS, // callback gas 
            2 // amount of numbers, first one is ticket number, second is collection
        );
        
        address _ticketReceiver = msg.sender;
        if(receiver != address(0)) _ticketReceiver = receiver;

        Drawing memory newDrawing = Drawing({
            drawId: drawId,
            ticketReceiver: _ticketReceiver
        });

        ++drawId;

        requestIdToDrawing[requestId] = newDrawing;
        drawIdToRequestId[drawId] = requestId;
        emit DrawRequest(drawId, requestId, msg.sender);
    }

    function claimPrize(uint tokenId ) public {

        require(nftContract.ownerOf(tokenId) == address(msg.sender), "only NFT owner can claim prize");
        require(nftContract.claimed(tokenId) != true, "prize has been claimed already");

        uint256 prize = nftContract.prizes(tokenId);
        uint256 prizeWei = prize * 1 ether;
        uint256 balance = IERC20(TOKEN_ADDRESS).balanceOf(address(this));
        require(balance >= prizeWei, "contract does not have enough funds to payout");
        
        nftContract.setClaimed(tokenId);
        IERC20(TOKEN_ADDRESS).safeTransfer(msg.sender, prizeWei);
    }

    // withdraw tokens from smart contract
    function withdraw() public onlyOwner {
        uint256 balance = IERC20(TOKEN_ADDRESS).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(TOKEN_ADDRESS).safeTransfer(owner(), balance);
    }

    event DrawRequest(
        uint256 indexed drawId,
        uint256 indexed requestId,
        address indexed ticketReceiver
    );

    event requestFulfilled(
        uint256 indexed drawId,
        uint256 indexed requestId,
        uint32 result
    );

}
