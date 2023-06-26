import { useEffect, useState } from "react";
import { address, abiFactory } from "../config";
import web3modal from "web3modal";
import { ethers } from "ethers";
import axios from "axios";

export function ActiveEvents(props) {
    const [activeEvents, setActiveEvents] = useState([]);
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        fetchActiveEvents();
    }, []);

    async function getContract() {
        const modal = new web3modal();
        const connection = await modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(address, abiFactory, signer);
        return contract
    }

    async function fetchActiveEvents() {
        const contract = await getContract()
        const data = await contract.fetchActiveEventsCall(props.username);
        const items = await Promise.all(
            data.map(async (i) => {
                const tokenUri = await contract.uriCall(props.username, i.ticketId.toString());
                console.log(tokenUri)
                const meta = await axios.get(tokenUri);
                let price = ethers.utils.formatEther(i.price);
                let item = {
                    ticketId: i.ticketId.toString(),
                    name: meta.data.name,
                    venue: meta.data.venue,
                    date: meta.data.name,
                    supply: i.supply.toNumber(),
                    price,
                    NftURI: tokenUri,
                    // cover: meta.data.cover
                };
                return item;
            })
        );
        console.log(items);
        setActiveEvents(items);
        setLoaded(true)
    }

    function NFTCard(prop) {
        async function pauseEvent(ticketId) {
            const contract = await getContract()
            const tx = await contract.pauseActiveEventCall(ticketId)
            await tx.wait()
        }
        // async function runEvent(ticketId) {
        //     const contract = await getContract()
        //     const tx = await contract.runPausedEventCall(ticketId)
        //     await tx.wait()
        //     location.reload()
        // }

        return (
            <div className="text-black mb-5 mt-5">
                <p>Nft card</p>
                <p>Name: {prop.name}</p>
                <p>Venue: {prop.venue}</p>
                <p>Date: {prop.date}</p>
                <p>Supply: {prop.supply}</p>
                <p>Price: {prop.price}</p>
                {/* <p>NftURI: {prop.NftUri}</p> */}
                <button onClick={() => pauseEvent(prop.ticketId)}>Pause</button>
                {/* <button onClick={() => runEvent(prop.tokenId)}>Run</button> */}
            </div>
        );
    }

    if (loaded == true && activeEvents.length == 0) return (
        <div>ACTIVE EVENTS <br /> No Tickets</div>
    )

    return (
        <div>
            ACTIVE EVENTS
            <div>
                {activeEvents.map((nft, i) => {
                    return (
                        <NFTCard
                            key={i}
                            ticketId={nft.ticketId}
                            name={nft.name}
                            venue={nft.venue}
                            date={nft.date}
                            supply={nft.supply}
                            price={nft.price}
                            // NftURI={nft.NftURI}
                        />
                    );
                })}
            </div>
        </div>
    );
}
