import React, { Component } from 'react';
import Header from '../components/Header';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <Header></Header>
        {this.props.children}
      </div>
    );
  }
}
