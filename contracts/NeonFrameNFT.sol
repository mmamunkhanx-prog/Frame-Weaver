// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeonFrameNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public mintPrice = 0.00005 ether;
    address public withdrawalWallet;

    constructor(address initialOwner, address _withdrawalWallet)
        ERC721("NeonFrame Identity", "NEON")
        Ownable(initialOwner)
    {
        withdrawalWallet = _withdrawalWallet;
    }

    function safeMint(string memory uri) public payable {
        require(msg.value >= mintPrice, "Insufficient ETH sent");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Auto-withdraw to the specified wallet
        payable(withdrawalWallet).transfer(msg.value);
    }

    // Allow owner to update the withdrawal wallet
    function setWithdrawalWallet(address _newWallet) public onlyOwner {
        withdrawalWallet = _newWallet;
    }

    // Allow owner to update mint price
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
