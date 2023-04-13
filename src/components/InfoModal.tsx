import Markdown from 'markdown-to-jsx';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal } from "react-bootstrap";

export default class InfoModal extends Component<any, any> {
  elementsTableProps: { id: string };
  referencesTableProps: { id: string };
  static propTypes: {
    subSection: PropTypes.Requireable<object>;
    closeModal: PropTypes.Validator<(...args: any[]) => any>;
    modalRole: PropTypes.Requireable<string>;
  };

  constructor(props: any) {
    super(props);
    this.elementsTableProps = { id: "react__elements__table" };
    this.referencesTableProps = { id: "react__references__table" };
  }

  renderElements = (elements: any) => {
    if (
      this.props.subSection.dataKey === "OpioidMedications" ||
      this.props.subSection.dataKey === "BenzodiazepineMedications" ||
      this.props.subSection.dataKey === "NaloxoneMedications"
    ) {
      if (
        this.props.subSection.warningText &&
        this.props.modalRole === "warning"
      ) {
        return (
          <div
            className="element"
            role="table"
            aria-label={elements.description}
            aria-describedby={this.elementsTableProps.id}
          >
            <Markdown>{this.props.subSection.warningText}</Markdown>
          </div>
        );
      } else if (this.props.subSection.recommendationText) {
        return (
          <div
            className="element"
            role="table"
            aria-label={elements.description}
            aria-describedby={this.elementsTableProps.id}
          >
            <p>
              <Markdown>{this.props.subSection.recommendationText}</Markdown>
            </p>
          </div>
        );
      }
    }
    if (
      this.props.subSection.dataKey ===
      "CoMorbidConditionsIncreasingRiskWhenUsingOpioids"
    ) {
      if (this.props.subSection.recommendationText) {
        return (
          <div
            className="element"
            role="table"
            aria-label={elements.description}
            aria-describedby={this.elementsTableProps.id}
          >
            <p>
              <Markdown>{this.props.subSection.recommendationText}</Markdown>
            </p>
          </div>
        );
      }
    }

    if (this.props.subSection.dataKey === "UrineDrugScreens") {
      if (this.props.subSection.recommendationText) {
        return (
          <div
            className="element"
            role="table"
            aria-label={elements.description}
            aria-describedby={this.elementsTableProps.id}
          >
            <p>
              <Markdown>{this.props.subSection.recommendationText}</Markdown>
            </p>
          </div>
        );
      }
    }
  };

  render() {
    const { subSection, closeModal, modalRole } = this.props;
    const elements = subSection.info.find((el: any) => el.type === "elements");
    
    return (
      <div className={`${modalRole}-modal`}>
        <Modal.Header
          closeButton
          closeVariant="white"
          className="info-modal__header"
        >
          <Modal.Title>More Information for {subSection.name}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="info-modal__body">
          {elements != null && (
            <div className="elements">{this.renderElements(elements)}</div>
          )}
        </Modal.Body>
      </div>
    );
  }
}

InfoModal.propTypes = {
  subSection: PropTypes.object,
  closeModal: PropTypes.func.isRequired,
  modalRole: PropTypes.string
};
