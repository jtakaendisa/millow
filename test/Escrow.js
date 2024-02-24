const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe('Escrow', () => {
  let realEstate;
  let escrow;
  let buyer, seller, inspector, lender;

  beforeEach(async () => {
    // Setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy Real Estate
    const RealEstate = await ethers.getContractFactory('RealEstate');
    realEstate = await RealEstate.deploy();

    // Mint
    const transaction = await realEstate
      .connect(seller)
      .mint('https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS');
    await transaction.wait();

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory('Escrow');
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    );
  });

  describe('Deployment', () => {
    it('returns NFT address', async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(realEstate.address);
    });

    it('returns seller address', async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it('returns inspector address', async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it('returns lender address', async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });
});
