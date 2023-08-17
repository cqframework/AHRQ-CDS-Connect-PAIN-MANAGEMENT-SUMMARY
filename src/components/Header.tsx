import React, { Component } from "react";
import PropTypes from "prop-types";

export default class Header extends Component {
  static propTypes: any;
  render() {
    return (
      <header className="container">
          <div className="mx-2 d-flex header  justify-content-end">
            <img
              className="header__logo-img"
              src={`${process.env.PUBLIC_URL}/assets/images/Pain_Manager_LOGO.jpg`}
              alt=""
            />
          </div>
      </header>
    );
  }
}

Header.propTypes = {
  patientName: PropTypes.string,
  patientAge: PropTypes.number,
  patientGender: PropTypes.string,
  totalEntries: PropTypes.number,
  numFlaggedEntries: PropTypes.number,
  meetsInclusionCriteria: PropTypes.bool,
};
