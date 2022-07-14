import Markdown from 'markdown-to-jsx';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Collapsible from 'react-collapsible';
import ReactTooltip from 'react-tooltip';
import ReactTable, { Column } from 'react-table';
import ReactModal from 'react-modal';

// import summaryMap from './summary.json';
import summaryMap from './summary.json';
import pkg from '../../package.json'
import * as formatit from '../helpers/formatit';
import * as sortit from '../helpers/sortit';

import InclusionBanner from './InclusionBanner';
// import ExclusionBanner from './ExclusionBanner';
import InfoModal from './InfoModal';
import DevTools from './DevTools';
import Footer from './Footer';

export default class Summary extends Component<any, any> {
    appVersion = pkg.version;
    static propTypes: any;
    subsectionTableProps: { id: string; };
    formatitHelper: any = formatit;
    sortitHelper: any = sortit;
    summaryMapData: any = summaryMap;
    logged: boolean = false;
    constructor(props: any) {
        super(props);
        this.state = {
            showModal: false,
            modalSubSection: null,
            modalRole: null,
            showDevTools: false
        };
        this.subsectionTableProps = { id: 'react_sub-section__table' };
        ReactModal.setAppElement('body');
        console.log(`You are running version ${this.appVersion} of the PainManager Application`);
    }

    componentDidMount() {
        let appConfig = localStorage.getItem('config');

        if (appConfig) {
            appConfig = JSON.parse(appConfig);
            this.setState({ appConfig })
        } else {

            fetch(process.env.PUBLIC_URL + '/config.json')
                .then((response: any) => { return response.json() })
                .then((config: any) => {
                    this.setState({ appConfig: config })
                    localStorage.setItem('config', JSON.stringify(config))
                })
                .catch((err: any) => {
                    console.error('Error: ', err)
                });
        }
    }

    handleOpenModal = (modalSubSection: any, event: any, modalRole?: any) => {
        //only open modal   on 'enter' or click
        if (event.keyCode === 13 || event.type === "click") {
            this.setState({ showModal: true, modalSubSection, modalRole });
        }
    }

    handleCloseModal = () => {
        this.setState({ showModal: false });
    }

    showTools = (value) => {
        this.setState({ showDevTools: value }, () => {
        })
    }

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
        } else if (sectionFlags[section][subSection] !== undefined && (sectionFlags[section][subSection] instanceof Array) && sectionFlags[section][subSection].length > 0) {
            return sectionFlags[section][subSection].length > 0;
        } else if (typeof sectionFlags[section][subSection] === 'string') {
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

    renderNoEntries(section: any, subSection: any) {
        const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
        const flaggedClass = flagged ? 'flagged' : '';
        const flagText = this.props.sectionFlags[section][subSection.dataKey];
        const tooltip = flagged ? flagText : '';
        if (section === 'UrineDrugScreening' && (this.props.summary['UrineDrugScreening'].UrineDrugScreens.length === 0)) {
            return (
                <div className="no-entries">
                    <FontAwesomeIcon
                        icon="exclamation-circle"
                        // title={'flag:' + tooltip}
                        // data-tip={tooltip}
                        size="2x"
                        tabIndex={0}
                    />
                    <Markdown>{this.props.summary['UrineDrugScreening'].Recommendation10Text}</Markdown>
                </div>
            );
        }

        return (
            <div className="table">
                <div className="no-entries">
                    <FontAwesomeIcon
                        className={'flag flag-no-entry ' + flaggedClass}
                        icon="exclamation-circle"
                        title={'flag:' + tooltip}
                        data-tip={tooltip}
                        data-role="tooltip"
                        tabIndex={0}
                    />
                    no entries found
                </div>
            </div>
        );
    }

    createSharedDecisionEntries(entries: any) {
        entries.forEach((entry) => {
            let question = this.props.questionText.get(entry.LinkId);
            if (question !== null && question !== undefined) {
                //   entry.Answer = this.props.questionText.get(entry.LinkId) + entry.Answer;
                entry.Question = this.props.questionText.get(entry.LinkId);
            }
            if (entry.Location && (entry.Location !== null) && (entry.Location.value !== (null || undefined))) {
                let locationWord = entry.Location.value.match(/(\b[A-Z0-9][A-Z0-9]+|\b[A-Z]\b)/g);
                if (locationWord !== null) {
                    entry.Location = locationWord.join(',');
                }
            }
            if (entry.PainYesNo && (entry.PainYesNo !== null) && (entry.PainYesNo === true)) {
                entry.PainYesNo = 'Y'
            }
        })
        return entries;
    }



    renderTable(table: any, entries: any, section: any, subSection: any, index: any) {
        // If a filter is provided, only render those things that have the filter field (or don't have it when it's negated)
        let filteredEntries = entries;
        if ((section === 'SharedDecisionMaking') && entries !== null && entries !== undefined && entries.length > 0) {
            filteredEntries = this.createSharedDecisionEntries(entries);
        }
        if (table.filter && table.filter.length > 0) {
            // A filter starting with '!' is negated (looking for absence of that field)
            const negated = table.filter[0] === '!';
            const filter = negated ? table.filter.substring(1) : table.filter;
            filteredEntries = entries.filter((e: any) => negated ? e[filter] == null : e[filter] != null);
        }
        if (filteredEntries.length === 0) return null;

        const headers = Object.keys(table.headers);
        const sortable = table.sortable ;
        const columns: Column[] = [];
        headers.forEach((header) => {
            const headerKey = table.headers[header];

            const column: Column = {
                id: header,
                Header: () => <span className="col-header">{header}</span>,
                accessor: (entry: any) => {
                    let value = entry[headerKey];
                    if (Array.isArray(entry[headerKey])) {
                        value = entry[headerKey][0][0].value;
                    }
                    if (headerKey.formatter) {
                        const { result } = this.props;
                        let formatterArguments = headerKey.formatterArguments || [];
                        value = this.formatitHelper[headerKey.formatter](result, entry[headerKey.key], ...formatterArguments);
                    }

                    return value;
                },
                minWidth: 150,
                sortable: sortable
            };

            if (column.sortable && headerKey.formatter) {
                switch (headerKey.formatter) {
                    case 'dateFormat':
                    case 'dateAgeFormat':
                        column.sortMethod = sortit.dateCompare;
                        break;
                    case 'datishFormat':
                    case 'datishAgeFormat':
                        column.sortMethod = sortit.datishCompare;
                        break;
                    case 'ageFormat':
                        column.sortMethod = sortit.ageCompare;
                        break;
                    case 'quantityFormat':
                        column.sortMethod = sortit.quantityCompare;
                        break;
                    default:
                    // do nothing, rely on built-in sort
                }
            }

            if (headerKey.minWidth != null) {
                column.minWidth = headerKey.minWidth;
            }

            if (headerKey.maxWidth != null) {
                column.maxWidth = headerKey.maxWidth;
            }
            columns.push(column);
        });

        //ReactTable needs an ID for aria-describedby
        let tableID = subSection.name.replace(/ /g, "_") + "-table";
        let customProps = { id: tableID };
        //getTheadThProps solution courtesy of:
        //https://spectrum.chat/react-table/general/is-there-a-way-to-activate-sort-via-onkeypress~66656e87-7f5c-4767-8b23-ddf35d73f8af
        return (
            <div key={index} className="table" role="table"
                aria-label={subSection.name} aria-describedby={customProps.id}>
                <ReactTable
                    className="sub-section__table"
                    columns={columns}
                    data={filteredEntries}
                    minRows={1}
                    showPagination={false}
                    defaultPageSize={filteredEntries.length}
                    resizable={false}
                    getProps={() => customProps}
                    defaultSorted={ section === 'UrineDrugScreening' ? [
                        {
                            id: 'Result',
                            desc: true
                        }
                    ] : [

                    ]}
                    getTheadThProps={(state, rowInfo, column, instance) => {


                        return {
                            tabIndex: 0,
                            onKeyPress: (e: { which: number; stopPropagation: () => void; }, handleOriginal: any) => {
                                if (e.which === 13) {
                                    instance.sortColumn(column);
                                    e.stopPropagation();
                                }
                            }
                        };

                    }}
                />
            </div>
        );
        


    }

    renderSection(section: string) {
        const sectionMap = this.summaryMapData[section];


        return sectionMap.map((subSection: any) => {
            // in here I need to combine the data for naloxone, benzodiazepines, and non-opioids
            const data = this.props.summary[subSection.dataKeySource][subSection.dataKey];
            const entries = (Array.isArray(data) ? data : [data]).filter(r => r != null);
            const hasEntries = entries.length !== 0;

            const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
            const flaggedClass = flagged ? 'flagged' : '';
            let datatable;
            if (subSection.dataKey === "CoMorbidConditionsIncreasingRiskWhenUsingOpioids") {
                subSection.recommendationText = this.props.summary.PertinentConditions.Recommendation8Text;
            }
            if (subSection.dataKey === 'OpioidMedications') {
                subSection.recommendationText = (this.props.summary.CurrentPertinentTreatments.Recommendation3Text || null);
                if (this.props.summary.CurrentPertinentTreatments.Recommendation5Text) {
                    subSection.warningText = this.props.summary.CurrentPertinentTreatments.Recommendation5Text;
                }

                datatable = (
                    <div id={subSection.dataKey} className="sub-section__header">
                        <FontAwesomeIcon
                            className={'flag flag-nav ' + flaggedClass}
                            icon={flagged ? 'exclamation-circle' : 'circle'}
                            title="flag"
                            tabIndex={0}
                        />
                        <div id="opioid-title">
                            <h3 className="opioid-name">{subSection.name}
                                {subSection.info &&
                                    <div
                                        onClick={(event) => this.handleOpenModal(subSection, event, 'info')}
                                        onKeyDown={(event) => this.handleOpenModal(subSection, event, 'info')}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={subSection.name}>
                                        {subSection.recommendationText ? <FontAwesomeIcon
                                            className='info-icon'
                                            icon="info-circle"
                                            title={'more info: ' + subSection.name}
                                            data-tip="more info"
                                            role="tooltip"
                                            tabIndex={0}
                                        /> : ''}
                                    </div>
                                }
                            </h3>
                            <div className="total-mme-link">
                                <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/url?q=http://build.fhir.org/ig/cqframework/opioid-mme-r4/Library-MMECalculator.html&sa=D&ust=1603413553690000&usg=AFQjCNHoWmeK3G7VrDkxD7MeJI6A3syYYA"> Total MME/Day: </a>
                                {subSection.info ? (<div
                                    onClick={(event) => this.handleOpenModal(subSection, event, 'warning')}
                                    onKeyDown={(event) => this.handleOpenModal(subSection, event, 'warning')}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={subSection.name}>
                                    {subSection.warningText ? <FontAwesomeIcon
                                        className='warning-icon'
                                        icon="exclamation-circle"
                                        title={'warning: ' + subSection.name}
                                        data-tip="warning"
                                        role="tooltip"
                                        tabIndex={0}
                                    /> : ''}
                                </div>) : ('')}
                                <span>{this.props.summary.CurrentPertinentTreatments.CurrentMME[0].Result !== null ? this.props.summary.CurrentPertinentTreatments.CurrentMME[0].Result : "N/A"}</span>
                            </div>
                        </div>


                    </div>)
            } else if (subSection.dataKey === 'NonOpioidMedications') {
                subSection.recommendationText = (this.props.summary.CurrentPertinentTreatments.Recommendation11Text || null);

                datatable = (
                    <>
                        <div>
                            *Self-reported medications are listed below when patients have provided this information via
                            MyPAIN.
                        <br />
                            *Active prescriptions do not include locally compounded medications.
                        <br />
                            <h3> ACTIVE PRESCRIPTIONS</h3>
                        </div>
                        <div id={subSection.dataKey} className="sub-section__header">
                            <FontAwesomeIcon
                                className={'flag flag-nav ' + flaggedClass}
                                icon={flagged ? 'exclamation-circle' : 'circle'}
                                title="flag"
                                tabIndex={0} />
                            <div id="opioid-title">
                                <h3 className="opioid-name">{subSection.name}
                                    {subSection.info ? (<div
                                        onClick={(event) => this.handleOpenModal(subSection, event, 'warning')}
                                        onKeyDown={(event) => this.handleOpenModal(subSection, event, 'warning')}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={subSection.name}>
                                        {subSection.recommendationText ? <FontAwesomeIcon
                                            className='warning-icon'
                                            icon="exclamation-circle"
                                            title={'warning: ' + subSection.name}
                                            data-tip="warning"
                                            role="tooltip"
                                            tabIndex={0} /> : ''}
                                    </div>) : ('')}
                                </h3>
                            </div>


                        </div>
                    </>)
            } else {
                datatable = (<div id={subSection.dataKey} className="sub-section__header">
                    <FontAwesomeIcon
                        className={'flag flag-nav ' + flaggedClass}
                        icon={flagged ? 'exclamation-circle' : 'circle'}
                        title="flag"
                        tabIndex={0}
                    />
                    <h3>{subSection.name}</h3>

                    {subSection.info &&
                        <div
                            onClick={(event) => this.handleOpenModal(subSection, event, 'info')}
                            onKeyDown={(event) => this.handleOpenModal(subSection, event, 'info')}
                            role="button"
                            tabIndex={0}
                            aria-label={subSection.name}>
                            {subSection.recommendationText ? <FontAwesomeIcon
                                className='info-icon'
                                icon="info-circle"
                                title={'more info: ' + subSection.name}
                                data-tip="more info"
                                role="tooltip"
                                tabIndex={0}
                            /> : ''}
                        </div>
                    }
                </div>)
            }

            return (
                <div key={subSection.dataKey} className="sub-section h3-wrapper">
                    {datatable}

                    {!hasEntries && this.renderNoEntries(section, subSection)}
                    {hasEntries && subSection.tables.map((table: any, index: any) =>
                        this.renderTable(table, entries, section, subSection, index))
                    }
                </div>
            );
        });
    }

    renderSectionHeader(section: any) {

        let title = '';
        if (section === 'PertinentConditions') {
            title = 'Pertinent Conditions';
        } else if (section === 'CurrentPertinentTreatments') {
            title = 'Current Pertinent Treatments*';
        } else if (section === 'UrineDrugScreening') {
            title = 'Urine Drug Screening';
        } else if (section === 'SharedDecisionMaking') {
            title = `Shared Decision Making`;
        }

        return (
            <h2 id={section} className="section__header">
                <div className="section__header-title">

                    <span className="span-class">
                        {title}
                    </span>
                </div>

                <FontAwesomeIcon className="caret" icon="caret-right" title="expand/collapse" />
            </h2>
        );
    };

    render() {
        const { summary, collector, qrCollector, result, cdsCollector, questionText } = this.props;
        const meetsInclusionCriteria = summary.Patient.MeetsInclusionCriteria;
        let sharedDecisionSection = this.props.summary["SharedDecisionMaking"];
        let submitDate;
        if (sharedDecisionSection.MyPAINSubmitDate && sharedDecisionSection.MyPAINSubmitDate.length > 0) {
            submitDate = this.formatitHelper.dateFormat('datishFormat ', sharedDecisionSection.MyPAINSubmitDate.toString());
            // submitDate = moment.parseZone(sharedDecisionSection.MyPAINSubmitDate.toString()).format('YYYY-MM-DD')

        } else {
            submitDate = '';
        }
        if (!summary) {
            return null;
        }

        return (
            <div className="summary">

                <div className="summary__display" id="maincontent">
                    <div className="summary__display-title">
                        Factors to Consider in Managing Chronic Pain
                    </div>

                    {!meetsInclusionCriteria && <InclusionBanner dismissible={meetsInclusionCriteria} />}

                    {meetsInclusionCriteria &&
                        <div className="sections">
                            <Collapsible tabIndex={0} trigger={this.renderSectionHeader("PertinentConditions")}
                                open={false}>
                                {this.renderSection("PertinentConditions")}
                            </Collapsible>

                            <Collapsible tabIndex={0} trigger={this.renderSectionHeader("CurrentPertinentTreatments")}
                                open={false}>
                                {this.renderSection("CurrentPertinentTreatments")}
                            </Collapsible>

                            <Collapsible tabIndex={0} trigger={this.renderSectionHeader("UrineDrugScreening")} open={summary.UrineDrugScreening.Recommendation10Text ? true : false}>
                                {this.renderSection("UrineDrugScreening")}
                            </Collapsible>
                            {/* If there is Shared Decision Making data, default below to open, else Pertinent Medical History is open on launch */}
                            <Collapsible tabIndex={0} trigger={this.renderSectionHeader("SharedDecisionMaking")} open={true}>
                                {((sharedDecisionSection.ActivityGoals && sharedDecisionSection.ActivityGoals.length === 0) &&
                                    (sharedDecisionSection.ActivityBarriers && sharedDecisionSection.ActivityBarriers.length === 0) &&
                                    (sharedDecisionSection.MyPAINSubmitDate && sharedDecisionSection.MyPAINSubmitDate.length === 0) &&
                                    (sharedDecisionSection.PainLocations && sharedDecisionSection.PainLocations.length === 0) &&
                                    (sharedDecisionSection.PainIntensityAndInterference && sharedDecisionSection.PainIntensityAndInterference.length === 0)) ?
                                    // (<div className="no-mypain-shared">The patient has no data from MyPAIN to display here.</div>)
                                    (<div className="no-mypain-shared">The patient has no data from MyPAIN to display here.</div>)
                                    : (<div>

                                        <div className="shared-top-section">
                                            {submitDate.length > 0 ? <p className='submit-date-text'>The information below was provided by the patient on <strong>{submitDate}</strong> using the MyPAIN application</p> : ''}

                                            <div className="activity-section">
                                                <div className="activity-goals">
                                                    <h3>ACTIVITY GOALS</h3>
                                                    {(sharedDecisionSection.ActivityGoals[Object.keys(sharedDecisionSection.ActivityGoals)[0]] && sharedDecisionSection.ActivityGoals[Object.keys(sharedDecisionSection.ActivityGoals)[0]].value !== null) ? <div>
                                                        <div>{sharedDecisionSection.ActivityGoals[Object.keys(sharedDecisionSection.ActivityGoals)[0]].value}</div>
                                                    </div> : "No activity goals submitted"}
                                                </div>
                                                <div className="activity-barriers">
                                                    <h3>ACTIVITY BARRIERS</h3>
                                                    {(sharedDecisionSection.ActivityBarriers[Object.keys(sharedDecisionSection.ActivityBarriers)[0]] && sharedDecisionSection.ActivityBarriers[Object.keys(sharedDecisionSection.ActivityBarriers)[0]].value !== null) ? <div>
                                                        <div>{sharedDecisionSection.ActivityBarriers[Object.keys(sharedDecisionSection.ActivityBarriers)[0]].value}</div>
                                                    </div> : "No activity barriers submitted"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shared-decision-making-section">
                                            {this.renderSection("SharedDecisionMaking")}
                                        </div>
                                     </div>
                                    )}
                            </Collapsible>
                        </div>
                    }

                    {this.state.appConfig ? (<div className="redcap-link">
                        <p>To provide comments on this release of PainManager, please complete the <a
                            href={this.state.appConfig.redcapSurveyLink}
                            data-alt="CDC Guideline for Prescribing Opioids for Chronic Pain"
                            target="_blank"
                            rel="noopener noreferrer">
                            REDCap survey
                        </a>.</p>
                    </div>) : ('')}

                    {this.state.appConfig ? (<Footer key={this.state.appConfig} receiveTools={this.showTools}>{this.state.appConfig}</Footer>) : (
                        <Footer key={this.state.appConfig} receiveTools={this.showTools}></Footer>
                    )}


                    {this.state.showDevTools ? <DevTools
                        collector={collector}
                        qrCollector={qrCollector}
                        result={result}
                        cdsCollector={cdsCollector}
                        questionText={questionText}
                    /> : ''}

                    <ReactTooltip className="summary-tooltip" />

                    <ReactModal
                        className="modal"
                        overlayClassName="overlay"
                        isOpen={this.state.showModal}
                        onRequestClose={this.handleCloseModal}
                        contentLabel="More Info">
                        <InfoModal
                            closeModal={this.handleCloseModal}
                            subSection={this.state.modalSubSection}
                            modalRole={this.state.modalRole} />
                    </ReactModal>
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
    numRiskEntries: PropTypes.number.isRequired
};

