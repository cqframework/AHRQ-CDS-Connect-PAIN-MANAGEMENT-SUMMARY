import FHIR from 'fhirclient';
import cql from 'cql-execution';
import cqlfhir from '../helpers/cql-exec-fhir';
import extractResourcesFromELM from './extractResourcesFromELM';
import dstu2FactorsELM from '../cql/dstu2/Factors_to_Consider_in_Managing_Chronic_Pain.json'
import dstu2CommonsELM from '../cql/dstu2/CDS_Connect_Commons_for_FHIRv102.json';
import dstu2HelpersELM from '../cql/dstu2/FHIRHelpers.json';
import r4CommonsELM from '../cql/r4/CDS_Connect_Commons_for_FHIRv400.json';
import r4HelpersELM from '../cql/r4/FHIRHelpers.json';
import r4ConversionFactorsELM from '../cql/r4/ConversionFactors.json';
import r4MMECalculatorELM from '../cql/r4/MMECalculator.json';
import r4OMTKDataELM from '../cql/r4/OMTKData.json';
import r4OMTKLogicELM from '../cql/r4/OMTKLogic.json';
import r4PainManagerELM from '../cql/r4/PainManagerAll.json';

// eslint-disable-next-line
import valueSetDB from '../cql/valueset-db.json';
import medicationReferenceSolver from "./medicationReferenceSolver";

var Promise = require('es6-promise').Promise;
// var cqlResults = require('../helpers/cqlResults.json');
var defaultMMEConversion = require('../helpers/codesystem-DefaultMMEConversionFactors.json');

let cqlFhirModule: any = cqlfhir;

function executeELM(collector: any) {
    let client: any, release: any, library: any;
    return new Promise((resolve: any) => {
        // First get our authorized client and send the FHIR release to the next step
        const results = FHIR.oauth2.ready().then((clientArg) => {
            client = clientArg;
            return client.getFhirRelease();
        }, (error) => {
            console.log('Error: ', error);
        })
            // then remember the release for later and get the release-specific library
            .then((releaseNum) => {
                release = releaseNum;
                library = getLibrary(release);
            }, (error) => {
                console.error('Error: ', error);
            })
            // then query the FHIR server for the patient, sending it to the next step
            .then(() => {
                return client.patient.read();
            }, (error) => {
                console.error('Error: ', error);
            })
            // then gather all the patient's relevant resource instances and send them in a bundle to the next step
            .then((pt: any) => {
                collector.push({data: pt, url: 'Patient/' + pt.id});
                let isFromOpiodRec = false;
                const requests = extractResourcesFromELM(library, isFromOpiodRec).map((name) => {
                    if (name === 'Patient') {
                        return [pt];
                    }
                    return doSearch(client, release, name, collector);
                });
                // Don't return until all the requests have been resolved
                return Promise.all(requests).then((requestResults: any) => {
                    const resources: any[] = [];
                    requestResults.forEach((result) => {
                        resources.push(...result)
                    });
                    resources.push(defaultMMEConversion);
                    return {
                        resourceType: "Bundle",
                        entry: resources.map(r => ({resource: r}))
                    };
                });
            }, (error) => {
                console.error('Patient error:', error);
            })
            // then execute the library and return the results (wrapped in a Promise)
            .then((bundle) => {
                const patientSource = getPatientSource(release);
                const codeService = new cql.CodeService(valueSetDB);
                const executor = new cql.Executor(library, codeService);
                patientSource.loadBundles([bundle]);
                const results = executor.exec(patientSource);
                return results.patientResults[Object.keys(results.patientResults)[0]];
                // return cqlResults[Object.keys(cqlResults)[0]];
            }, (error) => {
                console.error('Bundle Error: ', error);
            });
        resolve(results);
    });
}

function getLibrary(release) {
    switch (release) {
        case 2:
            return new cql.Library(dstu2FactorsELM, new cql.Repository({
                CDS_Connect_Commons_for_FHIRv102: dstu2CommonsELM,
                FHIRHelpers: dstu2HelpersELM
            }));
        case 4:
            return new cql.Library(r4PainManagerELM, new cql.Repository({
                CDS_Connect_Commons_for_FHIRv400: r4CommonsELM,
                FHIRHelpers: r4HelpersELM,
                ConversionFactors: r4ConversionFactorsELM,
                MMECalculator: r4MMECalculatorELM,
                OMTKLogic: r4OMTKLogicELM,
                OMTKData: r4OMTKDataELM
            }));
        default:
            throw new Error('Only FHIR DSTU2 and FHIR R4 servers are supported');
    }
}

// eslint-disable-next-line
function getPatientSource(release) {
    switch (release) {
        case 2:
            return cqlFhirModule.PatientSource.FHIRv102();
        case 4:
            return cqlFhirModule.PatientSource.FHIRv401();
        default:
            throw new Error('Only FHIR DSTU2 and FHIR R4 servers are supported');
    }
}

function doSearch(client, release, type, collector) {
    const params = new URLSearchParams();
    updateSearchParams(params, release, type);

    const resources: any[] = [];
    let uri = type + '?' + params;
    if (type === 'MedicationRequest') {
        uri = type + '?_include=MedicationRequest:medication';
    }
    if (type === 'MedicationStatement') {
        uri = type + '?_include=MedicationStatement:medication';
    }
    return new Promise((resolve) => {
        if(type === 'Questionnaire') {
            const qResults = client.request("Questionnaire/mypain-questionnaire-ufl")
            .then((questionnaire) => {
                if (questionnaire) {
                    resources.push(questionnaire);
                    collector.push({url: uri, data: questionnaire});
                    return resources;
                }
            });
            resolve(qResults);
        }else{
            const results = client.patient.request(uri, {
                pageLimit: 0, // unlimited pages
                onPage: processPage(uri, collector, resources)
            }).then(() => {
                return resources;
            }).catch((error) => {
                collector.push({error: error, url: uri, type: type, data: error});
                // don't return the error as we want partial results if available
                // (and we don't want to halt the Promis.all that wraps this)
                return resources;
            });
            resolve(results);
        }
    });
}

function processPage(uri, collector, resources) {
    return (bundle) => {
        // Add to the collector
        let url = uri;
        if (bundle && bundle.link && bundle.link.some(l => l.relation === 'self' && l.url != null)) {
            url = bundle.link.find(l => l.relation === 'self').url;
        }
        if (uri.startsWith('Condition')){
            bundle.entry.forEach((conditionEntry) => {
                conditionEntry.resource.code.coding.forEach((codeEntry)=> {
                    if (codeEntry.system.startsWith('urn:oid')) {
                        codeEntry.system = getUrlFromOid(codeEntry.system.substring(codeEntry.system.lastIndexOf(':') + 1));
                    }
                });
            });
        }
        if (uri.startsWith('MedicationRequest') ||
            uri.startsWith('MedicationStatement')) {
            bundle.entry.forEach((medReqEntry) => {
                if (((medReqEntry.resource.resourceType === 'MedicationRequest')
                    || (medReqEntry.resource.resourceType === 'MedicationStatement'))
                    && (medReqEntry.resource.medicationReference !== null)
                    && (medReqEntry.resource.medicationReference !== undefined)) {
                    let reference = medReqEntry.resource.medicationReference.reference;
                    let referenceFound = false;
                    for (let medRefEntry of bundle.entry) {
                        if (medRefEntry.resource.resourceType === 'Medication'
                            && reference.endsWith('Medication/' + medRefEntry.resource.id)) {
                            medReqEntry.resource.medicationReference = null;
                            medReqEntry.resource.medicationCodeableConcept = medRefEntry.resource.code;
                            referenceFound = true;
                        }
                    }
                    if (!referenceFound) {
                        medicationReferenceSolver(medReqEntry.resource.medicationReference.reference)
                            .then((code) => {
                                medReqEntry.resource.medicationReference = null;
                                return medReqEntry.resource.medicationCodeableConcept = code[0];
                            });
                    }
                }
                if(medReqEntry.resource.medicationCodeableConcept !== null
                    && medReqEntry.resource.medicationCodeableConcept !== undefined
                    && medReqEntry.resource.medicationCodeableConcept.coding !== null
                    && medReqEntry.resource.medicationCodeableConcept.coding !== undefined) {
                    medReqEntry.resource.medicationCodeableConcept.coding.forEach((codeEntry) => {
                        if (codeEntry.system.startsWith('urn:oid')) {
                            codeEntry.system = getUrlFromOid(codeEntry.system.substring(codeEntry.system.lastIndexOf(':') + 1));
                        }
                    });
                }
            });
        }
        collector.push({url: url, data: bundle});
        // Add to the resources
        if (bundle.entry) {
            bundle.entry.forEach(e => resources.push(e.resource));
        }
    }
}

function updateSearchParams(params, release, type) {
    // If this is for Epic, there are some specific modifications needed for the queries to work properly
    if (process.env.REACT_APP_EPIC_SUPPORTED_QUERIES
        && process.env.REACT_APP_EPIC_SUPPORTED_QUERIES.toLowerCase() === 'true') {
        if (release === 2) {
            switch (type) {
                case 'Observation':
                    // Epic requires you to specify a category or code search parameter, so search on all categories
                    params.set('category', [
                        'social-history', 'vital-signs', 'imaging', 'laboratory', 'procedure', 'survey', 'exam', 'therapy'
                    ].join(','));
                    break;
                case 'MedicationOrder':
                    // Epic returns only active meds by default, so we need to specifically ask for other types
                    // NOTE: purposefully omitting entered-in-error
                    params.set('status', ['active', 'on-hold', 'completed', 'stopped', 'draft'].join(','));
                    break;
                case 'MedicationStatement':
                    // Epic returns only active meds by default, so we need to specifically ask for other types
                    // NOTE: purposefully omitting entered-in-error
                    params.set('status', ['active', 'completed', 'intended'].join(','));
                    break;
                default:
                //nothing
            }
        } else if (release === 4) {
            // NOTE: Epic doesn't currently support R4, but assuming R4 versions of Epic would need this
            switch (type) {
                case 'Observation':
                    // Epic requires you to specify a category or code search parameter, so search on all categories
                    params.set('category', [
                        'social-history', 'vital-signs', 'imaging', 'laboratory', 'procedure', 'survey', 'exam', 'therapy',
                        'activity'
                    ].join(','));
                    break;
                case 'MedicationRequest':
                    // Epic returns only active meds by default, so we need to specifically ask for other types
                    // NOTE: purposefully omitting entered-in-error
                    params.set('status', [
                        'active', 'on-hold', 'cancelled', 'completed', 'stopped', 'draft', 'unknown'
                    ].join(','));
                    break;
                case 'MedicationStatement':
                    // Epic returns only active meds by default, so we need to specifically ask for other types
                    // NOTE: purposefully omitting entered-in-error and not-taken
                    params.set('status', [
                        'active', 'completed', 'intended', 'stopped', 'on-hold', 'unknown'
                    ].join(','));
                    break;
                default:
                //nothing
            }
        }
    }
}

    /* The following is base on
    based on the 1.0.0 publication of the terminology: https://terminology.hl7.org/1.0.0/
     */
function getUrlFromOid(oid:string) {
    switch (oid) {
        case "2.16.840.1.113883.5.4": return "http://terminology.hl7.org/CodeSystem/v3-ActCode";
        case "2.16.840.1.113883.5.1001": return "http://terminology.hl7.org/CodeSystem/v3-ActMood";
        case "2.16.840.1.113883.5.7": return "http://terminology.hl7.org/CodeSystem/v3-ActPriority";
        case "2.16.840.1.113883.5.8": return "http://terminology.hl7.org/CodeSystem/v3-ActReason";
        case "2.16.840.1.113883.5.1002": return "http://terminology.hl7.org/CodeSystem/v3-ActRelationshipType";
        case "2.16.840.1.113883.5.14": return "http://terminology.hl7.org/CodeSystem/v3-ActStatus";
        case "2.16.840.1.113883.5.1119": return "http://terminology.hl7.org/CodeSystem/v3-AddressUse";
        case "2.16.840.1.113883.5.1": return "http://terminology.hl7.org/CodeSystem/v3-AdministrativeGender";
        case "2.16.840.1.113883.18.2": return "http://terminology.hl7.org/CodeSystem/v2-0001";
        case "2.16.840.1.113883.6.12": return "http://www.ama-assn.org/go/cpt";
        case "2.16.840.1.113883.12.292": return "http://hl7.org/fhir/sid/cvx";
        case "2.16.840.1.113883.5.25": return "http://terminology.hl7.org/CodeSystem/v3-Confidentiality";
        case "2.16.840.1.113883.12.112": return "urn:oid:2.16.840.1.113883.12.112";
        case "2.16.840.1.113883.4.642.1.1093": return "http://terminology.hl7.org/CodeSystem/discharge-disposition";
        case "2.16.840.1.113883.5.43": return "http://terminology.hl7.org/CodeSystem/v3-EntityNamePartQualifier";
        case "2.16.840.1.113883.5.45": return "http://terminology.hl7.org/CodeSystem/v3-EntityNameUse";
        case "2.16.840.1.113883.6.14": return "http://terminology.hl7.org/CodeSystem/HCPCS";
        case "2.16.840.1.113883.6.285": return "urn:oid:2.16.840.1.113883.6.285";
        case "2.16.840.1.113883.6.3": return "http://terminology.hl7.org/CodeSystem/icd10";
        case "2.16.840.1.113883.6.4": return "http://www.cms.gov/Medicare/Coding/ICD10";
        case "2.16.840.1.113883.6.90": return "http://hl7.org/fhir/sid/icd-10-cm";
        case "2.16.840.1.113883.6.42": return "http://terminology.hl7.org/CodeSystem/icd9";
        case "2.16.840.1.113883.6.2": return "http://terminology.hl7.org/CodeSystem/icd9cm";
        case "2.16.840.1.113883.6.104": return "urn:oid:2.16.840.1.113883.6.104";
        case "2.16.840.1.113883.6.1": return "http://loinc.org";
        case "2.16.840.1.113883.5.60": return "http://terminology.hl7.org/CodeSystem/v3-LanguageAbilityMode";
        case "2.16.840.1.113883.5.61": return "http://terminology.hl7.org/CodeSystem/v3-LanguageAbilityProficiency";
        case "2.16.840.1.113883.5.63": return "http://terminology.hl7.org/CodeSystem/v3-LivingArrangement";
        case "2.16.840.1.113883.5.2": return "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus";
        case "2.16.840.1.113883.3.26.1.1": return "http://ncithesaurus-stage.nci.nih.gov";
        case "2.16.840.1.113883.3.26.1.5": return "http://terminology.hl7.org/CodeSystem/nciVersionOfNDF-RT";
        case "2.16.840.1.113883.6.101": return "http://nucc.org/provider-taxonomy";
        case "2.16.840.1.113883.5.1008": return "http://terminology.hl7.org/CodeSystem/v3-NullFlavor";
        case "2.16.840.1.113883.5.83": return "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";
        case "2.16.840.1.113883.5.1063": return "http://terminology.hl7.org/CodeSystem/v3-ObservationValue";
        case "2.16.840.1.113883.5.88": return "http://terminology.hl7.org/CodeSystem/v3-ParticipationFunction";
        case "2.16.840.1.113883.5.1064": return "http://terminology.hl7.org/CodeSystem/v3-ParticipationMode";
        case "2.16.840.1.113883.5.90": return "http://terminology.hl7.org/CodeSystem/v3-ParticipationType";
        case "2.16.840.1.113883.6.88": return "http://www.nlm.nih.gov/research/umls/rxnorm";
        case "2.16.840.1.113883.5.1076": return "http://terminology.hl7.org/CodeSystem/v3-ReligiousAffiliation";
        case "2.16.840.1.113883.5.110": return "http://terminology.hl7.org/CodeSystem/v3-RoleClass";
        case "2.16.840.1.113883.5.111": return "http://terminology.hl7.org/CodeSystem/v3-RoleCode";
        case "2.16.840.1.113883.5.1068": return "http://terminology.hl7.org/CodeSystem/v3-RoleStatus";
        case "2.16.840.1.113883.6.96": return "http://snomed.info/sct";
        case "2.16.840.1.113883.6.21": return "http://terminology.hl7.org/CodeSystem/nubc-UB92";
        case "2.16.840.1.113883.6.301.3": return "http://terminology.hl7.org/CodeSystem/v2-0456";
        case "2.16.840.1.113883.6.50": return "http://terminology.hl7.org/CodeSystem/POS";
        case "2.16.840.1.113883.6.238": return "http://terminology.hl7.org/CodeSystem/PHRaceAndEthnicityCDC";
        case "2.16.840.1.113883.6.13": return "http://terminology.hl7.org/CodeSystem/CD2";
        case "2.16.840.1.113883.5.79": return "http://terminology.hl7.org/CodeSystem/v3-mediatypes";
        case "2.16.840.1.113883.3.221.5": return "urn:oid:2.16.840.1.113883.3.221.5";
        case "1.3.6.1.4.1.12009.10.3.1": return "urn:oid:1.3.6.1.4.1.12009.10.3.1";
        case "2.16.840.1.113883.6.8": return "http://unitsofmeasure.org";
        case "2.16.840.1.113883.6.86": return "http://terminology.hl7.org/CodeSystem/umls";
        default: return "urn:oid:" + oid;
    }
}

export default executeELM;
