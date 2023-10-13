import React, { Component, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Column, useTable } from "react-table";
import ReactModal from "react-modal";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";

// import summaryMap from './summary.json';
import summaryMap from "./summary.json";
import pkg from "../../package.json";
import * as formatit from "../helpers/formatit";
import * as sortit from "../helpers/sortit";

import InclusionBanner from "./InclusionBanner";
// import ExclusionBanner from './ExclusionBanner';
import InfoModal from "./InfoModal";
import DevTools from "./DevTools";
import Footer from "./Footer";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { faCopy } from "@fortawesome/free-solid-svg-icons";

//Version 7 ReactTable
function TableWrapper({summary, section, subSection, columns, data }) {
  const tableRef = useRef(null);
  const tableInstance = useTable({ columns, data });
  const {headerGroups, rows, prepareRow } = tableInstance;

  const setColumnWidth = (section, subSection, column) => {
    // Medications table
    let width = "";
    if(section === "CurrentPertinentTreatments"){
      // Date Prescribes and Sig
      if (column.id === "Date Prescribed"){
        width = "175px";
      }
      if (column.id === "Sig"){
        width = `${summary['Use MMECalculator'] === false ? "350px" : "625px"} `; // when mme is dis played sig width is 350px
      }
      // Opioids MME column
      if (subSection.dataKey === "OpioidMedications" && column.id === "MME/Day" && summary['Use MMECalculator'] === false ){
        width = "175px";
      }
      return width
    } else {
      return
    }
  };

  return (
    <>
      <div className="card shadow-sm mb-3 overflow-auto border-0 table-responsive">
        <table className="table table-striped table-borderless mb-0 table-hover" ref={tableRef}>
          <thead className="bg-custom-primary border-custom-bottom">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column ,index )=> (
                  <th className="ps-3" {...column.getHeaderProps()} style={{ width: setColumnWidth(section, subSection,column)}}>
                    {column.render('Header')}
                    </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="overflow-auto">
             {/* No data found */}
            {rows.length === 0 &&
              <tr>
                <td className="ps-3" colSpan={columns.length}>
                {/* pain locations */}
                {(["SharedDecisionMaking", "TreatmentEffectiveness", "GoalsAndBarriers"]).includes(section) &&
                  "No patient data submitted"
                }
                {/* conditions */}
                {
                  subSection.dataKey === "ConditionsAssociatedWithChronicPain" &&
                    "No chronic pain conditions found in problem list or visit diagnoses in past year"
                }
                { subSection.dataKey === "CoMorbidConditionsIncreasingRiskWhenUsingOpioids" &&
                  "No co-morbid conditions found in problem list or visit diagnoses in past year"
                }
                {/* medication */}
                { section === "CurrentPertinentTreatments" &&
                  "No prescription found in active medication list"
                }
                {/* UDS */}
                { section === "UrineDrugScreening" &&
                  "No urine drug screen found in past year"
                }
                </td>
              </tr>
            }
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td className="ps-3" {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
            {/* Additional columns for Total MME. displayed if Use MMECalculator is also true */}
            { subSection.dataKey === 'OpioidMedications' && summary.CurrentPertinentTreatments.CurrentMME[0].Result !== null && summary['Use MMECalculator'] === true &&
            <tr className="border-custom-top">
              <td className="ps-3 text-end fw-bold">Total</td>
              <td className="ps-3 fw-bold" colSpan={columns.length - 1}>{summary.CurrentPertinentTreatments.CurrentMME[0].Result}</td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </>
  );
}

export default class Summary extends Component<any, any> {
  appVersion = pkg.version;
  static propTypes: any;
  subsectionTableProps: { id: string };
  formatitHelper: any = formatit;
  // sortitHelper: any = sortit;
  summaryMapData: any = summaryMap;
  logged: boolean = false;
  opioidWarning: boolean = false;

  constructor(props: any) {
    super(props);
    this.state = {
      showModal: false,
      modalSubSection: null,
      modalRole: null,
      showDevTools: false,
      tooltipText: 'Copy'
    };
    this.copyAllTables = this.copyAllTables.bind(this);
    this.subsectionTableProps = { id: "react_sub-section__table" };
    ReactModal.setAppElement("body");
    console.log(
      `You are running version ${this.appVersion} of the PainManager Application`
    );
  }

// Copy all visible tables
  copyAllTables() {
    const tables = document.querySelectorAll('.tab-pane.active table');
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv); // append the temporary div to the document's body

    tables.forEach(table => {
      tempDiv.appendChild(table.cloneNode(true));
    });

  const range = document.createRange();
  range.selectNode(tempDiv);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('Copy');
    selection.removeAllRanges();
    this.setState({ tooltipText: 'Copied!' });
        setTimeout(() => {
          this.setState({ tooltipText: 'Copy' });
        }, 1000);
  }

  // removes the temporary div after copying
  document.body.removeChild(tempDiv);
}

componentDidMount() {
    let appConfig = localStorage.getItem("config");

    if (appConfig) {
      appConfig = JSON.parse(appConfig);
      this.setState({ appConfig });
    } else {
      fetch(process.env.PUBLIC_URL + "/config.json")
        .then((response: any) => {
          return response.json();
        })
        .then((config: any) => {
          this.setState({ appConfig: config });
          localStorage.setItem("config", JSON.stringify(config));
        })
        .catch((err: any) => {
          console.error("Error: ", err);
        });
    }
  }

  handleOpenModal = (modalSubSection: any, event: any, modalRole?: any) => {
    //only open modal   on 'enter' or click
    if (event.keyCode === 13 || event.type === "click") {
      this.setState({ showModal: true, modalSubSection, modalRole });
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  showTools = (value) => {
    this.setState({ showDevTools: value }, () => {});
  };

  isSectionFlagged(section: any) {
    const { sectionFlags } = this.props;
    const subSections = Object.keys(sectionFlags[section]);

    for (let i = 0; i < subSections.length; ++i) {
      if (this.isSubsectionFlagged(section, subSections[i])) {
        return true;
      }
    }

    return false;
  }

  isSubsectionFlagged(section: any, subSection: any) {
    const { sectionFlags } = this.props;
    if (sectionFlags[section][subSection] === true) {
      return true;
    } else if (sectionFlags[section][subSection] === false) {
      return false;
    } else if (
      sectionFlags[section][subSection] !== undefined &&
      sectionFlags[section][subSection] instanceof Array &&
      sectionFlags[section][subSection].length > 0
    ) {
      return sectionFlags[section][subSection].length > 0;
    } else if (typeof sectionFlags[section][subSection] === "string") {
      return sectionFlags[section][subSection];
    } else {
    }
  }

  // if flagged, returns flag text, else returns false
  isEntryFlagged(section: any, subSection: any, entry: any) {
    const { sectionFlags } = this.props;
    let flagged = false;
    if (sectionFlags[section][subSection]) {
      sectionFlags[section][subSection].forEach((flag: any) => {
        if (flag.entryId === entry._id) {
          flagged = flag.flagText;
        }
      });
    }

    return flagged;
  }

  createSharedDecisionEntries(entries: any) {
    entries.forEach((entry) => {
      let question = this.props.questionText.get(entry.LinkId);

      if (question !== null && question !== undefined) {
        //   entry.Answer = this.props.questionText.get(entry.LinkId) + entry.Answer;
        entry.Question = this.props.questionText.get(entry.LinkId);
      }
      if (
        entry.Location &&
        entry.Location !== null &&
        entry.Location.value !== (null || undefined)
      ) {
        let locationWord = entry.Location.value.match(
          /(\b[A-Z0-9][A-Z0-9]+|\b[A-Z]\b)/g
        );
        if (locationWord !== null) {
          entry.Location = locationWord.join(",");
        }
      }
    });
    return entries;
  }

  renderTable(table: any, entries: any, section: any, subSection: any, index: any, summary: any) {

    // If a filter is provided, only render those things that have the filter field (or don't have it when it's negated)
    let filteredEntries = entries;

    if (section === "SharedDecisionMaking" && entries?.length) {
      filteredEntries = this.createSharedDecisionEntries(entries);
    }

    // Sort conditions a-z
    if(section === "PertinentConditions")
    {
      filteredEntries =  entries.sort((a, b) => (a.Name > b.Name) ? 1 : -1)
    }

    if (table.filter && table.filter.length > 0) {
      // A filter starting with '!' is negated (looking for absence of that field)
      const negated = table.filter[0] === "!";
      const filter = negated ? table.filter.substring(1) : table.filter;
      filteredEntries = entries.filter((e: any) =>
        negated ? e[filter] == null : e[filter] != null
      );
    }

    const headers = Object.keys(table.headers);
    // const sortable = table.sortable;
    const columns: Column[] = [];

    headers.forEach((header) => {
      const headerKey = table.headers[header];
      const column: Column = {
        id: header,
        Header: () => <span className="col-header">
            {header === "Opioids" || header.includes("Benzodiazepines") || header === "Naloxone"?
            <div
            onClick={(event) => this.handleOpenModal(subSection, event, 'info')}
            onKeyDown={(event) => this.handleOpenModal(subSection, event, 'info')}
            role="button"
            tabIndex={0}
            aria-label={subSection.name}>

              {subSection.recommendationText ? <FontAwesomeIcon
                  className='info-icon me-3'
                  icon="info-circle"
                  title={'CDC guidelines for ' + subSection.name}
                  data-tip="more info"
                  role="tooltip"
                  tabIndex={0}
              /> : ''}
              {header}
          </div> :
          header === "MME/Day" && summary["Use MMECalculator"]?
          <div id="opioid-title">
            {subSection.info &&
              <div>
                <a className="nav-link" href="https://fhir.org/guides/cdc/opioid-mme-r4/mme-calculator.html" target="_blank" rel="noopener noreferrer">
                {subSection.recommendationText ? <FontAwesomeIcon
                    className='info-icon me-3'
                    icon="info-circle"
                    title={'CDC guidelines for ' + subSection.name}
                    data-tip="more info"
                    role="tooltip"
                    tabIndex={0}
                /> : ''}
                  {header}</a>
              </div>
            }
          </div> : header
          }
        </span>,

        accessor: (entry: any) => {
          let value = entry[headerKey];
          if (Array.isArray(entry[headerKey])) {
            value = entry[headerKey][0][0].value;
          }
          if (headerKey.formatter) {
            const { result } = this.props;
            let formatterArguments = headerKey.formatterArguments || [];
            value = this.formatitHelper[headerKey.formatter](
              result,
              entry[headerKey.key],
              ...formatterArguments
            );
          }
          return value;
        },
        Cell: ({ value }) => {
          // check section and apply cell formatting accordingly
          if(value === "Very Severe" || value === "Very much"){
            return <strong className="text-danger">{value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}</strong>
          }
          if(value === "Severe" || value === "Quite a bit"){
            return <span className="text-danger">{value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}</span>
          }
          return <span className="">{value}</span>
        },
      };

      if (column.sortable && headerKey.formatter) {
        switch (headerKey.formatter) {
          case "dateFormat":
          case "dateAgeFormat":
            column.sortMethod = sortit.dateCompare;
            break;
          case "datishFormat":
          case "datishAgeFormat":
            column.sortMethod = sortit.datishCompare;
            break;
          case "ageFormat":
            column.sortMethod = sortit.ageCompare;
            break;
          case "quantityFormat":
            column.sortMethod = sortit.quantityCompare;
            break;
          default:
          // do nothing, rely on built-in sort
        }
      }
      columns.push(column);
    });

    //ReactTable needs an ID for aria-describedby
    let tableID = subSection.name.replace(/ /g, "_") + "-table";
    let customProps = { id: tableID };


    //getTheadThProps solution courtesy of:
    //https://spectrum.chat/react-table/general/is-there-a-way-to-activate-sort-via-onkeypress~66656e87-7f5c-4767-8b23-ddf35d73f8af
    return (
      <div
        key={index}
        role="table"
        className={subSection.dataKey+"-table"}
        aria-label={subSection.name}
        aria-describedby={customProps.id}
      >
        <TableWrapper summary={this.props.summary} section={section} subSection={subSection} columns={columns} data={filteredEntries} />
      </div>
    );
  }

  renderSection(section: string) {
    const sectionMap = this.summaryMapData[section];
    return sectionMap.map((subSection: any) => {
      // in here I need to combine the data for naloxone, benzodiazepines, and non-opioids
      const rawData = JSON.stringify(this.props.summary[subSection.dataKeySource][subSection.dataKey]);
      const parsedData = rawData.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/gi, '');
      const data = JSON.parse(parsedData);
      const entries = (Array.isArray(data) ? data : [data]).filter(
        (r) => r != null
      );

      // const hasEntries = entries.length !== 0;
      // const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
      // const flaggedClass = flagged ? "flagged" : "";
      let datatable;

      // Get Recommendations Text
      switch (subSection.dataKey) {
        case "CoMorbidConditionsIncreasingRiskWhenUsingOpioids":
          subSection.recommendationText = this.props.summary.PertinentConditions.Recommendation8Text;
          break;
        case "UrineDrugScreens":
          subSection.recommendationText = this.props.summary.UrineDrugScreening.Recommendation10Text || null;
          break;
        case "OpioidMedications":
          subSection.recommendationText = this.props.summary.CurrentPertinentTreatments.Recommendation3Text || null;
          if (this.props.summary.CurrentPertinentTreatments.Recommendation5Text) {
            subSection.warningText = this.props.summary.CurrentPertinentTreatments.Recommendation5Text;
            this.opioidWarning = true;
          }
          break;
        case "BenzodiazepineMedications":
          subSection.recommendationText = this.props.summary.CurrentPertinentTreatments.Recommendation11Text || null;
          break;
        case "NaloxoneMedications":
          subSection.recommendationText = this.props.summary.CurrentPertinentTreatments.Recommendation8Text || null;
          break;
        default:
          break;
      }

      return (
        <div className="row" key={subSection.dataKey}>
          <div className=" col-12 sub-section h3-wrapper">
            {/* Not really being used here- remove datatable if needed */}
            {datatable}
            {
              // hasEntries &&
              subSection.tables.map((table: any, index: any) =>
                this.renderTable(table, entries, section, subSection, index, this.props.summary)
              )
            }
          </div>
        </div>
      );
    });
  }

  // this function handles the rendering of information and warnings above the tables
  renderInfo(section){
    const sectionMap = this.summaryMapData[section];
    let data;
    if (
      section === "UrineDrugScreening"
    ) {
      data = (
        <div>
          {sectionMap.map((subSection: any) => {
            return (
              subSection.dataKey === "UrineDrugScreens" && (
                <div key={subSection.dataKey}>
                  <p>
                  Where is this data from? Lab results from the past 12 months (does not include scanned document formats).
                  </p>
                  {this.props.summary["UrineDrugScreening"]?.UrineDrugScreens?.length === 0 &&
                  <div
                    className="alert alert-info shadow-sm border-0"
                    role="alert"
                  >
                    <div
                      onClick={(event) =>
                        this.handleOpenModal(subSection, event, "info")
                      }
                      onKeyDown={(event) =>
                        this.handleOpenModal(subSection, event, "info")
                      }
                      role="button"
                      tabIndex={0}
                      aria-label={subSection.name}
                    >
                      <FontAwesomeIcon
                          className='info-icon me-3'
                          icon="info-circle"
                          title={'CDC guidelines for urine drug screening'}
                          data-tip="more info"
                          role="tooltip"
                          tabIndex={0}
                      />
                      <span className="px-3">No urine drug screen found in past year.</span>
                    </div>
                  </div>
                }
                </div>
              )
            );
          })}
        </div>
      );
    }

    if(section === 'SharedDecisionMaking' ){
      return (<h5 className="py-3">Pain & Gaols</h5>)
    }

    if(section === 'TreatmentEffectiveness' ){
      return (<h5 className="py-3">Treatment Effectiveness</h5>)
    }

    if(section === 'PertinentConditions')
    {
     data = (
       <div>
         <p>
           Where is this data from? Problem list entries & visit diagnoses over
           past 12 months (may cause duplicates).
         </p>
       </div>
     );
    }

    if (section === "CurrentPertinentTreatments") {
      data = (
        <div>
          <p>
            
          Where is this data from? Pain related medications from active medication list.
          </p>
          {sectionMap.map((subSection: any) => {
            // Only displays mme recommendations if 'Use MMECalculator' flag is set to true
            if(this.props.summary['Use MMECalculator']){
            return (
              subSection.dataKey === "OpioidMedications" &&
              subSection.info &&
              subSection.warningText && 
              (
                <div
                  className="alert alert-danger shadow-sm border-0"
                  role="alert"
                  key={subSection.dataKey}
                >
                  <div
                    onClick={(event) =>
                      this.handleOpenModal(subSection, event, "warning")
                    }
                    onKeyDown={(event) =>
                      this.handleOpenModal(subSection, event, "warning")
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={subSection.name}
                  >
                    <div>
                      <FontAwesomeIcon
                        className="warning-icon"
                        icon={faExclamationTriangle}
                        title={"warning: " + subSection.name}
                        data-tip="warning"
                        role="tooltip"
                        tabIndex={0}
                      />
                      <span className="px-3">
                        {subSection.name}: MME &#8807; 50
                      </span>
                    </div>
                  </div>
                </div>
              )
            );
                  }
          })}

          <div className="">
            <h4 className="mb-0">Active Pain-Related Medications</h4>
          </div>
        </div>
      );
    }
    return data;
  }

  renderSectionHeader(section: string) {
    let title = "";
    if (section === "PertinentConditions") {
      title = "Conditions";
    } else if (section === "CurrentPertinentTreatments") {
      title = "Medications";
    } else if (section === "UrineDrugScreening") {
      title = "Urine Drug Screen";
    } else if (section === "SharedDecisionMaking") {
      title = `Pain & Goals`;
    } else if (section === "TreatmentEffectiveness") {
      title = "Treatment Effectiveness";
    }

    return (
      <div id={section} className="section__header">
          <span>{title}</span>
      </div>
    );
  }

  render() {
    const { tooltipText } = this.state;
    const tooltip = <Tooltip id="copy-tooltip" >{tooltipText}</Tooltip>;

    const {
      summary,
      collector,
      qrCollector,
      result,
      cdsCollector,
      questionText,
    } = this.props;
    let sharedDecisionSection = this.props.summary["SharedDecisionMaking"];
    let submitDate;
    if (
      sharedDecisionSection.MyPAINSubmitDate &&
      sharedDecisionSection.MyPAINSubmitDate.length > 0
    ) {
      submitDate = this.formatitHelper.dateFormat(
        "datishFormat ",
        sharedDecisionSection.MyPAINSubmitDate.toString()
      );
    } else {
      submitDate = "";
    }
    if (!summary) {
      return null;
    }

    return (
      <div className="summary container">
        <div className="summary__display" id="maincontent">
            <div className="row m-0">
              <div className="col-12">
                <div className="card border-0 m-5x">
                  <nav className="sections">
                    <div
                      className="row nav nav-tabs border-bottom-0"
                      id="nav-tab"
                      role="tablist"
                    >
                      <div className="col-12 col-md-6">
                        <div className="row patient my-3">
                          <div className="col-12">
                            <p>
                              <strong>FROM PATIENT</strong> VIA MYPAIN{" "}
                              {submitDate && "(" + submitDate + ")"}
                            </p>
                          </div>
                          <div className="col-12">
                            <div className="d-flex card-header px-1 pt-2 pb-0 border-bottom-0">
                              <button
                                className={"nav-link" + (submitDate ? " active" : "")} //remove the active class. conditional rendering condition is submiteddate
                                style={{ isolation: "isolate" }}
                                id="nav-pain-goals-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#nav-pain-goals"
                                type="button"
                                role="tab"
                                aria-controls="nav-pain-goals"
                                aria-selected={(submitDate ? "true" : "false")} //toggle true to false condition is submiteddate
                              >
                                {this.renderSectionHeader(
                                  "SharedDecisionMaking"
                                )}
                              </button>
                              <button
                                className="nav-link"
                                style={{ isolation: "isolate" }}
                                id="nav-treatment-effectiveness-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#nav-treatment-effectiveness"
                                type="button"
                                role="tab"
                                aria-controls="nav-treatment-effectiveness"
                                aria-selected="false"
                              >
                                {this.renderSectionHeader(
                                  "TreatmentEffectiveness"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="row treatment my-1 my-md-3">
                          <div className="col-12">
                            <p>
                              <strong>FROM HEALTH RECORD</strong>
                            </p>
                          </div>
                          <div className="col-12">
                            <div className="d-flex card-header px-1 pt-2 pb-0 border-bottom-0 ">
                              <button
                                className="nav-link"
                                id="nav-pertinent-conditions-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#nav-pertinent-conditions"
                                type="button"
                                role="tab"
                                aria-controls="nav-pertinent-conditions"
                                aria-selected="false"
                              >
                                {this.renderSectionHeader(
                                  "PertinentConditions"
                                )}{" "}
                              </button>
                              <button
                                className="nav-link"
                                id="nav-medications-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#nav-medications"
                                type="button"
                                role="tab"
                                aria-controls="nav-medications"
                                aria-selected="false"
                              >
                                {this.renderSectionHeader(
                                  "CurrentPertinentTreatments"
                                )}
                              </button>
                              <button
                              className={"nav-link" + (!submitDate ? " active" : "")} //remove the active class. conditional rendering condition is submiteddate
                                id="nav-urine-drug-screening-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#nav-urine-drug-screening"
                                type="button"
                                role="tab"
                                aria-controls="nav-urine-drug-screening"
                                aria-selected={(!submitDate ? "true" : "false")} //toggle true to false condition is submiteddate
                              >
                                {this.renderSectionHeader("UrineDrugScreening")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </nav>
                  <div className="card-body">
                    <div className="tab-content" id="nav-tabContent">
                      <div
                        className={"tab-pane fade" + (submitDate ? " show active" : "")}
                        id="nav-pain-goals"
                        role="tabpanel"
                        aria-labelledby="nav-pain-goals-tab"
                      >
                        <div className="text-end">
                          <OverlayTrigger placement="left" overlay={tooltip}>
                            <button
                              onClick={this.copyAllTables}
                              className="btn btn-custom-outline-primary btn-sm mb-2 btn-circle"
                            >
                              <FontAwesomeIcon icon={faCopy} size={"sm"} />
                            </button>
                          </OverlayTrigger>
                        </div>
                        <div className="row mb-5-x">
                          <div className="col-12 col-md-7 mb-md-3">
                            <div className="shared-decision-making-section">
                              {this.renderSection("SharedDecisionMaking")}
                            </div>
                          </div>
                          <div className="col">
                            <div className="shared-top-section">
                              {this.renderSection("GoalsAndBarriers")}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="nav-treatment-effectiveness"
                        role="tabpanel"
                        aria-labelledby="nav-treatment-effectiveness-tab"
                      >
                        <div className="text-end">
                          <OverlayTrigger placement="left" overlay={tooltip}>
                            <button
                              onClick={this.copyAllTables}
                              className="btn btn-custom-outline-primary btn-sm mb-2 btn-circle"
                            >
                              <FontAwesomeIcon icon={faCopy} size={"sm"} />
                            </button>
                          </OverlayTrigger>
                        </div>
                        {this.renderSection("TreatmentEffectiveness")}
                      </div>
                      <div
                        className="tab-pane fade"
                        id="nav-pertinent-conditions"
                        role="tabpanel"
                        aria-labelledby="nav-pertinent-conditions-tab"
                      >
                        {this.renderInfo("PertinentConditions")}
                        <div className="text-end">
                          <OverlayTrigger placement="left" overlay={tooltip}>
                            <button
                              onClick={this.copyAllTables}
                              className="btn btn-custom-outline-primary btn-sm mb-2 btn-circle"
                            >
                              <FontAwesomeIcon icon={faCopy} size={"sm"} />
                            </button>
                          </OverlayTrigger>
                        </div>
                        {this.renderSection("PertinentConditions")}
                      </div>
                      <div
                        className="tab-pane fade"
                        id="nav-medications"
                        role="tabpanel"
                        aria-labelledby="nav-medications-tab"
                      >
                        {this.renderInfo("CurrentPertinentTreatments")}
                        <div className="text-end">
                          <OverlayTrigger placement="left" overlay={tooltip}>
                            <button
                              onClick={this.copyAllTables}
                              className="btn btn-custom-outline-primary btn-sm mb-2 btn-circle"
                            >
                              <FontAwesomeIcon icon={faCopy} size={"sm"} />
                            </button>
                          </OverlayTrigger>
                        </div>
                        {this.renderSection("CurrentPertinentTreatments")}
                      </div>
                      <div
                        className={"tab-pane fade" + (!submitDate ? " show active" : "")}
                        id="nav-urine-drug-screening"
                        role="tabpanel"
                        aria-labelledby="nav-urine-drug-screening-tab"
                      >
                        {this.renderInfo("UrineDrugScreening")}
                        <div className="text-end">
                          <OverlayTrigger placement="left" overlay={tooltip}>
                            <button
                              onClick={this.copyAllTables}
                              className="btn btn-custom-outline-primary btn-sm mb-2 btn-circle"
                            >
                              <FontAwesomeIcon icon={faCopy} size={"sm"} />
                            </button>
                          </OverlayTrigger>
                        </div>
                        {this.renderSection("UrineDrugScreening")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="row m-0">
            <div className="col-12">
              <Modal
                size={"lg"}
                show={this.state.showModal}
                onHide={this.handleCloseModal}
              >
                <InfoModal
                  closeModal={this.handleCloseModal}
                  subSection={this.state.modalSubSection}
                  modalRole={this.state.modalRole}
                />
              </Modal>

              {this.state.appConfig ? (
                <Footer
                  key={this.state.appConfig}
                  receiveTools={this.showTools}
                >
                  {this.state.appConfig}
                </Footer>
              ) : (
                <Footer
                  key={this.state.appConfig}
                  receiveTools={this.showTools}
                ></Footer>
              )}

              {this.state.showDevTools ? (
                <DevTools
                  collector={collector}
                  qrCollector={qrCollector}
                  result={result}
                  cdsCollector={cdsCollector}
                  questionText={questionText}
                />
              ) : (
                ""
              )}

              <div
                className="alert alert-secondary shadow-sm border-0 mt-3"
                role="alert"
              >
                <FontAwesomeIcon icon={faExclamationCircle} />
                <span className="px-3">
                  {" "}
                  Pain Manager is not for patients undergoing end-of-life care
                  or active cancer treatment.{" "}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Summary.propTypes = {
  summary: PropTypes.object.isRequired,
  sectionFlags: PropTypes.object.isRequired,
  collector: PropTypes.array.isRequired,
  cdsCollector: PropTypes.array,
  qrCollector: PropTypes.array.isRequired,
  result: PropTypes.object.isRequired,
  numMedicalHistoryEntries: PropTypes.number.isRequired,
  numPainEntries: PropTypes.number.isRequired,
  numTreatmentsEntries: PropTypes.number.isRequired,
  numRiskEntries: PropTypes.number.isRequired,
};
