import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faExclamationCircle,
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
            {/* {this.props.children !== undefined ? (<div className="info-box">
                <p>This SGL version of PainManager does not support linking out from the application. If you need more information about the CDC Opioid Guideline referenced here, please visit: [<span>{this.appConfig.CDCLink}</span>].</p>
                <p> To provide comments on this release or PainManager, please complete this REDCap survey: [<span>{this.appConfig.redcapSurveyLink}</span>].</p>
            </div>) : (
                    <div className="info-box">
                        <p>This SGL version of PainManager does not support linking out from the application. If you need more information about the CDC Opioid Guideline referenced here, please visit: [<span>https://www.cdc.gov/drugoverdose/prescribing/guidance.html</span>].</p>
                        <p> To provide comments on this release or PainManager, please complete this REDCap survey: [<span>Contract your administrator for link</span>].</p>
                    </div>
                )} */}
            {/* // <div className="info-box">
                //     <p>This SGL version of PainManager does not support linking out from the application. If you need more information about the CDC Opioid Guideline referenced here, please visit: [<span>{this.appConfig.CDCLink}</span>].</p>
            //     <p> To provide comments on this release or PainManager, please complete this REDCap survey: [<span>{this.appConfig.redcapSurveyLink}</span>].</p>
            // </div> */}
            {/* <div className="form-check form-switch m-0">
            <label className="form-check-label dev-tool-label" htmlFor="devToolsSwitch">{this.devToolState} DevTools</label>
                <input className="form-check-input" type="checkbox" role="switch" id="devToolsSwitch" onChange={this.handleDevTools}/>
                
            </div> */}
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
