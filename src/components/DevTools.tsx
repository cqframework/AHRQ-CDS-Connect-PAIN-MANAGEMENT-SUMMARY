import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FhirQuery from './FhirQuery';
import Prism from "prismjs";
import "prismjs/themes/prism-coy.css";
import "prismjs/plugins/toolbar/prism-toolbar.min.css";
import "prismjs/plugins/toolbar/prism-toolbar.min";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min";

// This component is responsible for the rendering data in the devtools toolbar
export default class DevTools extends Component<any, any> {
  static propTypes: { collector: PropTypes.Requireable<any[]>; result: PropTypes.Requireable<object>; qrCollector: PropTypes.Requireable<any[]>; };
  constructor(props: any) {
    super(props);
    this.state = {
      displayDevTools: true,
      displayFhirQueries: false,
      displayCQLResults: false,
      displayQRObsResults: false
    };
    this.errorMessage = this.errorMessage.bind(this)
  }

  componentDidMount() {
    Prism.highlightAll()
  }


  toggleDevTools = (event: any) => {
    event.preventDefault();
    this.setState({ displayDevTools: !this.state.displayDevTools });
  }

  toggleFhirQueries = (event: any) => {
    event.preventDefault();
    this.setState({ displayFhirQueries: !this.state.displayFhirQueries });
  }

  toggleCQLResults = (event: any) => {
    event.preventDefault();
    this.setState({ displayCQLResults: !this.state.displayCQLResults });
  }

  toggleQRObsResults = (event: any) => {
      event.preventDefault();
      this.setState({ displayQRObsResults: !this.state.displayQRObsResults });
  }

  errorMessage(er: any, i: any) {
    return (
      <tr key={i}>
        <td>{er.type}</td>
        <td>{er.error.message || er.error.statusText || 'No error message provided'}</td>
      </tr>
    );
  }

  renderErrors() {
    const errResponses = this.props.collector.filter( (i:any) => {
        return i.error;
      });

    if (errResponses.length) {
      return (
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingError">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseError" aria-expanded="false" aria-controls="collapseError">
              Errors ({errResponses.length})
            </button>
        </h2>
        <div id="collapseError" className="accordion-collapse collapse" aria-labelledby="headingError" data-bs-parent="#accordionDevTools">
        <div className="accordion-body">
        <table className="table" id="cql-errors" data-border="1" data-width="100%">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {errResponses.map((er:any, i:any) => { 
              return this.errorMessage(er, i);
            })}
          </tbody>
        </table>
        </div>
        </div>
      </div>
      );
    }
    return <div></div>;
  }

  renderFHIRQueries() {
    return (
      <div className="accordion-item">
          <h2 className="accordion-header" id="headingFHIRQueries">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFHIRQueries" aria-expanded="false" aria-controls="collapseFHIRQueries">
            FHIR Queries 
            </button>
        </h2>
        <div id="collapseFHIRQueries" className="accordion-collapse collapse" aria-labelledby="headingFHIRQueries" data-bs-parent="#accordionDevTools">
        <div className="accordion-body">
          <div className="accordion" id="accordionFHIRQueries">
            {this.props.collector.map( (item: any, i: any) => {
                  const url = i === 0 ? item.url : item.url.slice(item.url.lastIndexOf('/') + 1);
                  return (
                    <FhirQuery key={i} url={url} data={item.data} idx={i} />
                  );
              })}
            </div>
        </div>
        </div>
      </div>
    );
  }

  renderCQLResults() {
    return (
      <div className="accordion-item">
          <h2 className="accordion-header" id="headingCQLResults">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCQLResults" aria-expanded="false" aria-controls="collapseCQLResults">
              CQL Results 
            </button>
        </h2>
        <div id="collapseCQLResults" className="accordion-collapse collapse" aria-labelledby="headingCQLResults" data-bs-parent="#accordionDevTools">
        <div className="accordion-body">
          <pre><code className="language-json copy-to-clipboard">{JSON.stringify(this.props.result, null, 2)}</code></pre>
        </div>
        </div>
      </div>
    );
  }

    renderQRObsResults() {
        return (
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingQRObsResults">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseQRObsResults" aria-expanded="false" aria-controls="collapseQRObsResults">
                MyPAIN Results
              </button>
            </h2>
            <div id="collapseQRObsResults" className="accordion-collapse collapse" aria-labelledby="headingQRObsResults" data-bs-parent="#accordionDevTools">
              <div className="accordion-body">
                <pre><code className="language-json copy-to-clipboard">{JSON.stringify(this.props.result, null, 2)}</code></pre>
              </div>
            </div>
        </div>
      );
    }

  render() {
    if (!this.props.collector) { return null; }

    return (
    <div className="accordion accordion-flush mb-3 dev-tools" id="accordionDevTools">
      {this.renderErrors()}
      {this.renderFHIRQueries()}
      {this.renderCQLResults()}
      {this.renderQRObsResults()}      
    </div>
    );
  }
}

DevTools.propTypes = {
  collector: PropTypes.array,
  result: PropTypes.object,
  qrCollector: PropTypes.array
};