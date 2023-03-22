import Markdown from 'markdown-to-jsx';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactTable from 'react-table';
import { Modal, Button } from "react-bootstrap";

export default class InfoModal extends Component<any, any> {
  elementsTableProps: { id: string; };
  referencesTableProps: { id: string; };
  static propTypes: { subSection: PropTypes.Requireable<object>; closeModal: PropTypes.Validator<(...args: any[]) => any>; modalRole: PropTypes.Requireable<string>};

  constructor(props: any) {
    super(props);

    this.elementsTableProps = { id: 'react__elements__table' };
    this.referencesTableProps = { id: 'react__references__table' };
  }

  renderElements = (elements: any) => {
    // debugger;
    // const tableElements = elements.elements;
    // const columns = [{
    //   Header: () => { return <span className="col-header">Name</span> },
    //   accessor: 'name',
    //   minWidth: 225
    // }, {
    //   Header: () => { return <span className="col-header">Status</span> },
    //   accessor: 'status'
    // }, {
    //   Header: () => { return <span className="col-header">Lookback</span> },
    //   accessor: 'lookback'
    // }];
    if (this.props.subSection.dataKey === "OpioidMedications" || this.props.subSection.dataKey === "NonOpioidMedications") {
      if (this.props.subSection.warningText && this.props.modalRole === 'warning') {
        return (
          <div className="element" role="table"
            aria-label={elements.description} aria-describedby={this.elementsTableProps.id}>
            <Markdown>{this.props.subSection.warningText}</Markdown>

          </div>
        );
      } else if (this.props.subSection.recommendationText) {
        return (
          <div className="element" role="table"
            aria-label={elements.description} aria-describedby={this.elementsTableProps.id}>
            <p><Markdown>{this.props.subSection.recommendationText}</Markdown></p>

          </div>
        );
      }
    }
    if (this.props.subSection.dataKey === "CoMorbidConditionsIncreasingRiskWhenUsingOpioids") {
      if (this.props.subSection.recommendationText) {
        return (
          <div className="element" role="table"
            aria-label={elements.description} aria-describedby={this.elementsTableProps.id}>
            <p><Markdown>{this.props.subSection.recommendationText}</Markdown></p>

          </div>
        );
      }
    }
    // return (
    //   <div className="element" role="table"
    //     aria-label={elements.description} aria-describedby={this.elementsTableProps.id}>
    //     <h4>{elements.description}</h4>
    //     <ReactTable
    //       className="elements__table"
    //       columns={columns}
    //       data={tableElements}
    //       minRows={1}
    //       showPagination={false}
    //       resizable={false}
    //       getProps={() => { return this.elementsTableProps }}
    //     />
    //   </div>
    // );
  }

  // renderReferences = (references: any) => {
  //   const columns = [{
  //     Header: () => { return <span className="col-header">Link</span> },
  //     accessor: 'urlLink',
  //     maxWidth: 50,
  //     sortable: false
  //   }, {
  //     Header: () => { return <span className="col-header">Title</span> },
  //     accessor: 'title'
  //   }, {
  //     Header: () => { return <span className="col-header">Details</span> },
  //     accessor: 'details'
  //   }];

  //   let data = references;
  //   data.forEach((reference: any) => {
  //     reference.urlLink = (
  //       <a href={reference.url} data-src={reference.title} target="_blank"
  //         rel="noopener noreferrer"><FontAwesomeIcon icon="link" title="link" /></a>
  //     );
  //   });

  //   return (
  //     <div className="reference" role="table"
  //       aria-label="References" aria-describedby={this.referencesTableProps.id}>
  //       <ReactTable
  //         className="elements__table"
  //         columns={columns}
  //         data={data}
  //         minRows={1}
  //         showPagination={false}
  //         resizable={false}
  //         getProps={() => {
  //           return this.referencesTableProps;
  //         }}
  //       />
  //     </div>
  //   );
  // }

  render() {
    const { subSection, closeModal, modalRole } = this.props;
    const elements = subSection.info.find((el: any) => el.type === "elements");
    const references = subSection.info.filter((el: any) => el.type === "reference");

    return (
        


      <div className={`${modalRole}-modal`}>

        <Modal.Header closeButton closeVariant='white' className="info-modal__header">
          <Modal.Title>More Information for {subSection.name}</Modal.Title>
        </Modal.Header>
        {/* <div className="info-modal__header">
          More Information for {subSection.name}
          <FontAwesomeIcon icon="times" title="close" className="close-icon" onClick={closeModal} />
        </div> */}

<Modal.Body className="info-modal__body">
  
{elements != null &&
            <div className="elements">
              {this.renderElements(elements)}
            </div>
          }
  
  </Modal.Body>

        {/* <div className="info-modal__body">
          {elements != null &&
            <div className="elements">
              {this.renderElements(elements)}
            </div>
          }

          {references.length > 0 &&
            <div className="references">
              <h4>References:</h4>
              {this.renderReferences(references)}
            </div>
          }
        </div> */}
      </div>
    );
  }
}

InfoModal.propTypes = {
  subSection: PropTypes.object,
  closeModal: PropTypes.func.isRequired,
  modalRole: PropTypes.string
};
