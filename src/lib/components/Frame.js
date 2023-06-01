import React, { useEffect } from "react";
import { HashConnect } from "hashconnect";
import {
  AccountId,
  TransferTransaction,
  PublicKey,
  TokenAssociateTransaction,
  HbarUnit,
  Hbar,
} from "@hashgraph/sdk";

const Frame = (props) => {
  let hashConnect = new HashConnect(); //variable to hold an instance of Hashconnect
  useEffect(() => {
    const hbarShopHederaiFrame = document.getElementById(
      "hbar-shop-hedera-iframe"
    );

    window.onmessage = async function (e) {
      console.log(e.data);
      try {
        const parsedData = JSON.parse(e.data);
        if (parsedData.platform === "hbar-shop") {
          if (parsedData.method === "connect") {
            const appMetadata = {
              name: "Hbar Shop",
              description: "Shop the look using HBAR",
              icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/4642.png",
            };
            const initData = await hashConnect.init(
              appMetadata,
              `testnet`,
              false
            );
            hashConnect.foundExtensionEvent.once((walletMetadata) => {
              hashConnect.connectToLocalWallet(
                initData.pairingString,
                walletMetadata
              );
            });
            let walletAccountID = "";
            hashConnect.pairingEvent.once((pairingData) => {
              pairingData.accountIds.forEach((id) => {
                walletAccountID = id;
              });
              const walletConnectMessage = {
                method: "connect",
                platform: "hbar-shop",
                status: "success",
                data: {
                  topic: pairingData.topic,
                  accountId: walletAccountID,
                  network: pairingData.network,
                },
              };
              hbarShopHederaiFrame.contentWindow.postMessage(
                JSON.stringify(walletConnectMessage),
                "*"
              );
            });
          } else if (parsedData.method === "transfer") {
            const {
              topic,
              accountId,
              network,
              lookHbarPrice,
              shop,
              walletAddress,
            } = parsedData.data;

            const provider = hashConnect.getProvider(network, topic, accountId);
            const signer = hashConnect.getSigner(provider);

            const accountInfo = await fetch(
              // `${process.env.REACT_APP_HEDERA_ACCOUNT_VERIFY}api/v1/accounts?account.id=${accountId}`
              `https://testnet.mirrornode.hedera.com/api/v1/accounts?account.id=${accountId}`
            );
            const accountResponse = await accountInfo.json();

            console.log(accountResponse);
            console.log(accountResponse.accounts[0].key.key);

            const key = PublicKey.fromString(
              accountResponse.accounts[0].key.key
            );
            console.log("Key: ", key);

            const trans = await new TransferTransaction()
              .addHbarTransfer(
                AccountId.fromString(accountId),
                Hbar.from(-lookHbarPrice, HbarUnit.TINYBAR)
              )
              .addHbarTransfer(
                AccountId.fromString(walletAddress.data.walletAddress),
                Hbar.from(lookHbarPrice, HbarUnit.TINYBAR)
              )

              .freezeWithSigner(signer);

            console.log("Transfer tx receipt: ", trans);
            const resp = await trans.executeWithSigner(signer);
            const walletTransferMessage = {
              method: "transfer",
              platform: "hbar-shop",
              status: "success",
              data: resp,
            };
            hbarShopHederaiFrame.contentWindow.postMessage(
              JSON.stringify(walletTransferMessage),
              "*"
            );
          }
        }
      } catch (e) {}
    };
  }, []);

  return (
    <iframe
      id="hbar-shop-hedera-iframe"
      src="http://localhost:3001/embed?shop=jithendra-test-store.myshopify.com"
      height={props.height || "672px"}
      width={props.width || "100%"}
      style={{ border: "none" }}
    />
  );
};

export default Frame;
