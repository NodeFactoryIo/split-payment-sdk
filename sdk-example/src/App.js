import React from 'react';
import './App.css';
import {Requester, SplitWallet} from "split-paymanet-sdk";

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      requester: null,
      splitWallet: new SplitWallet("0xbD9f96663E07a83ff18915c9074d9dc04d8E64c9", 2000)
    }
  }


  requestPaymnet = async () => {
    const addresses = await window.ethereum.enable();
    const requester = new Requester(addresses[0], window.ethereum);
    await requester.init();
    console.log(await requester.request([
      {
        from: "0xbD9f96663E07a83ff18915c9074d9dc04d8E64c9",
        amount: 30,
        currency: "ETH"
      }
      ]));
  };

  getAllPayments = async () => {
    console.log(await SplitWallet.getAllPaymentRequests("0xbD9f96663E07a83ff18915c9074d9dc04d8E64c9"));
  };

  listenOnPayments= () => {
    this.state.splitWallet.onNewPaymentRequest(this.onNewPayment);
    this.state.splitWallet.startPolling();
  };

  stopListening = () => {
    this.state.splitWallet.stopPolling();
  };

  onNewPayment = (payment) => {
    console.log(payment);
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <button onClick={this.requestPaymnet}>Request payment</button>
          <button onClick={this.getAllPayments}>Get payments</button>
          <button onClick={this.listenOnPayments}>Start Listening</button>
          <button onClick={this.stopListening}>Stop listening</button>
        </header>
      </div>
    );
  }

}

export default App;
