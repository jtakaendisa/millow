import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, escrow, onClose, account }) => {
  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [lender, setLender] = useState(null);

  const [hasBought, setHasBought] = useState(false);
  const [hasSold, setHasSold] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasLended, setHasLended] = useState(false);

  const [owner, setOwner] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      // Buyer
      const buyer = await escrow.buyer(home.id);
      setBuyer(buyer);

      const hasBought = await escrow.approval(home.id, buyer);
      setHasBought(hasBought);

      // Seller
      const seller = await escrow.seller();
      setSeller(seller);

      const hasSold = await escrow.approval(home.id, seller);
      setHasSold(hasSold);

      // Inspector
      const inspector = await escrow.inspector();
      setInspector(inspector);

      const hasInspected = await escrow.approval(home.id, inspector);
      setHasInspected(hasInspected);

      // Lender
      const lender = await escrow.lender();
      setLender(lender);

      const hasLended = await escrow.approval(home.id, lender);
      setHasLended(hasLended);
    };

    fetchDetails();
  }, [escrow, home.id]);

  useEffect(() => {
    const fetchOwner = async () => {
      if (await escrow.isListed(home.id)) return;

      const owner = await escrow.buyer(home.id);
      setOwner(owner);
    };

    fetchOwner();
  }, [hasSold, escrow, home.id]);

  const handlePurchase = async () => {
    const escrowAmount = await escrow.escrowAmount(home.id);
    const signer = await provider.getSigner();

    // Buyer deposits earnest funds into contract
    let transaction = await escrow
      .connect(signer)
      .depositEarnest(home.id, { value: escrowAmount });
    await transaction.wait();

    // Buyer approves transaction
    transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    setHasBought(true);
  };

  const handleSale = async () => {
    const signer = await provider.getSigner();

    // Seller approves transaction
    let transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    // Seller finalizes the sale
    transaction = await escrow.connect(signer).finalizeSale(home.id);
    await transaction.wait();

    setHasSold(true);
  };

  const handleInspection = async () => {
    const signer = await provider.getSigner();

    // Inspector updates status
    const transaction = await escrow
      .connect(signer)
      .updateInspectionStatus(home.id, true);
    await transaction.wait();

    setHasInspected(true);
  };

  const handleLend = async () => {
    const signer = await provider.getSigner();

    // Lender approves transaction
    const transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    // Lender sends funds to contract
    const lendAmount =
      (await escrow.purchasePrice(home.id)) - (await escrow.escrowAmount(home.id));
    await signer.sendTransaction({
      to: escrow.address,
      value: lendAmount.toString(),
      gasLimit: 60000,
    });

    setHasLended(true);
  };

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt={home.name} />
        </div>
        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |{' '}
            <strong>{home.attributes[3].value}</strong> ba |{' '}
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>
          <div>
            {owner && (
              <div className="home__owned">
                Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
              </div>
            )}
            <div>
              {account && account === inspector && (
                <button
                  className="home__buy"
                  onClick={handleInspection}
                  disabled={hasInspected}
                >
                  Approve Inspection
                </button>
              )}
              {account && account === lender && (
                <button className="home__buy" onClick={handleLend} disabled={hasLended}>
                  Approve & Lend
                </button>
              )}
              {account && account === seller && (
                <button className="home__buy" onClick={handleSale} disabled={hasSold}>
                  Approve & Sell
                </button>
              )}
              {account !== inspector && account !== lender && account !== seller && (
                <button
                  className="home__buy"
                  onClick={handlePurchase}
                  disabled={hasBought}
                >
                  Buy
                </button>
              )}
              <button className="home__contact" onClick={() => {}} disabled={false}>
                Contact Agent
              </button>
            </div>
            <hr />
            <h2>Overview</h2>
            <p>{home.description}</p>
            <hr />
            <h2>Facts and Features</h2>
            <ul>
              {home.attributes.map((attribute) => (
                <li key={attribute.trait_type}>
                  <strong>{attribute.trait_type}</strong> : {attribute.value}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={onClose} className="home__close">
            <img src={close} alt="Close" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
