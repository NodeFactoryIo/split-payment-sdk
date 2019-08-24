import React, {Button} from 'react';
import logo from './logo.svg';
import './App.css';
import {Requester} from "split-paymanet-sdk";

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      requester: null
    }
  }


  requestPaymnet = async () => {
    const addresses = await window.ethereum.enable();
    const requester = new Requester(addresses[0], window.ethereum);
    await requester.init();
    await requester.request([
      {
        from: "0x28545bFBE27C18236B58Eb39B4D4416877e826c0",
        amount: 30,
        currency: "ETH"
      }
      ]);
    this.setState({requester});
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <button onClick={this.requestPaymnet}>Request payment</button>
        </header>
      </div>
    );
  }

}

export default App;
