import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class ExclusionBanner extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      displayed: true
    };
  }

  handleClose = () => {
    this.setState({ displayed: false });
  }

  // When enabled (criteria is met) display's the exclusion banner
  render() {
    return (
      <div
        className="exclusion-banner banner"
        style={{display: this.state.displayed ? 'block' : 'none'}}
        role="banner">
        <FontAwesomeIcon className="close-button" icon="times" title="close" onClick={this.handleClose} />

        <div className="exclusion-banner__description">
          <strong><FontAwesomeIcon icon="exclamation-circle" title="notice" /> TAKE NOTICE:</strong> This summary is not
          intended for patients who are undergoing <b>end-of-life care</b> (hospice or palliative) or <b>active cancer
          treatment</b>.
        </div>
      </div>
    );
  }
}
