import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import React, { Component } from "react";

// import summaryMap from './summary.json';
import pkg from "../../package.json";

export default class Footer extends Component<any, any> {
  devToolState: string = "Enable";
  appConfig: any = {};
  showTools: boolean = this.props.showTools;
  handleDevTools = () => {
    this.showTools = !this.showTools;
    this.props.receiveTools(this.showTools);
  };
  appVersion = pkg.version;

  componentDidMount() {
    this.appConfig = this.props.children;
  }

  render() {
    return (
      <>
        <div>
          <footer className=" rounded px-4 py-3 d-flex justify-content-between align-items-center w-100">
            <p className="m-0">PainManager v{this.appVersion}</p>
            <FontAwesomeIcon
              icon={this.showTools ? faMinus : faPlus}
              size="lg"
              title="toggle"
              className="dev-tools-icon"
              onClick={this.handleDevTools}
            />
          </footer>
        </div>
      </>
    );
  }
}
