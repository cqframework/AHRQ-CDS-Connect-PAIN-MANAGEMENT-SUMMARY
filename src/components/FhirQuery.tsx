import React, { Component } from 'react';
import PropTypes, { number } from 'prop-types';

export default class FhirQuery extends Component<any, any> {
  static propTypes: { idx: PropTypes.Validator<number>, data: PropTypes.Validator<object>; url: PropTypes.Validator<string>; };
  constructor(props: any) {
    super(props);
    this.state = {
      displayed: false
    };
  }



  toggleShowHide = (event: any) => {
    event.preventDefault();
    this.setState({ displayed: !this.state.displayed });
  }

  render() {
    const { idx, data, url } = this.props;
    if (!data) { return null; }
    // console.log(idx);
    return (

      <div className="accordion-item">
          <h2 className="accordion-header" id={"heading" + idx}>
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={"#collapse"+idx} aria-expanded="false" aria-controls={"collapse"+idx}>
              {url}
            </button>
          </h2>
        <div id={"collapse"+idx} className="accordion-collapse collapse" aria-labelledby={"heading" + idx} data-bs-parent="#accordionFHIRQueries">
            <div className="accordion-body">
              <div className="accordion-body">
                <pre><code className="language-json copy-to-clipboard">{JSON.stringify(data, null, 2)}</code></pre>
              </div>   
          </div>
        </div> 

      </div>


      // <div className="fhir-query">
      //   <b>{url}</b> <button onClick={this.toggleShowHide}>[show/hide]</button>
      //   <pre style={{display: this.state.displayed ? 'block' : 'none'}}>{JSON.stringify(data, null, 2)}</pre>
      // </div>
    );
  }
}

FhirQuery.propTypes = {
  data: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  idx: PropTypes.number.isRequired
};
