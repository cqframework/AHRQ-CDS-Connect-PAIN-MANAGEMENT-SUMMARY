'use strict'; // eslint-disable-line

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var cql = require('cql-execution');
var load = require('./load');
var FHIRv102XML = require('./modelInfos/fhir-modelinfo-1.0.2.xml.js');
var FHIRv300XML = require('./modelInfos/fhir-modelinfo-3.0.0.xml.js');
var FHIRv400XML = require('./modelInfos/fhir-modelinfo-4.0.0.xml.js');
var FHIRv401XML = require('./modelInfos/fhir-modelinfo-4.0.1.xml.js');

var FHIRWrapper = function () {
  function FHIRWrapper(filePathOrXML) {
    _classCallCheck(this, FHIRWrapper);

    this._modelInfo = load(filePathOrXML);
  }

  _createClass(FHIRWrapper, [{
    key: 'wrap',
    value: function wrap(fhirJson) {
      var fhirResourceType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var targetClassName = fhirResourceType || fhirJson.resourceType;
      var targetClass = this._modelInfo.findClass(targetClassName);

      // If the FHIR resource specifies a type and a target type is specified, verify they are compatible
      if (fhirResourceType && fhirJson.resourceType) {
        var currentClass = this._modelInfo.findClass(fhirJson.resourceType);
        if (!this._typeCastIsAllowed(currentClass, targetClass)) throw 'Incompatible types: FHIR resourceType is ' + fhirJson.resourceType + ' which cannot be cast as ' + fhirResourceType; // eslint-disable-line no-throw-literal
      }

      return new FHIRObject(fhirJson, targetClass, this._modelInfo);
    }
  }, {
    key: '_typeCastIsAllowed',
    value: function _typeCastIsAllowed(currentClass, targetClass) {
      return targetClass === currentClass || currentClass.parentClasses().includes(targetClass) || // upcasting, safe
        targetClass.parentClasses().includes(currentClass); // downcasting, unsafe but allowed
    }
  }], [{
    key: 'FHIRv102',
    value: function FHIRv102() {
      return new FHIRWrapper(FHIRv102XML);
    }
  }, {
    key: 'FHIRv300',
    value: function FHIRv300() {
      return new FHIRWrapper(FHIRv300XML);
    }
  }, {
    key: 'FHIRv400',
    value: function FHIRv400() {
      return new FHIRWrapper(FHIRv400XML);
    }
  }, {
    key: 'FHIRv401',
    value: function FHIRv401() {
      return new FHIRWrapper(FHIRv401XML);
    }
  }]);

  return FHIRWrapper;
}();

var PatientSource = function () {
  function PatientSource(filePathOrXML) {
    _classCallCheck(this, PatientSource);

    this._index = 0;
    this._bundles = [];
    this._modelInfo = load(filePathOrXML);
  }

  // Convenience factory method for getting a FHIR 1.0.2 (DSTU2) Patient Source


  _createClass(PatientSource, [{
    key: 'loadBundles',
    value: function loadBundles(bundles) {
      this._bundles = this._bundles.concat(bundles);
    }
  }, {
    key: 'currentPatient',
    value: function currentPatient() {
      if (this._index < this._bundles.length) {
        return new Patient(this._bundles[this._index], this._modelInfo);
      }
    }
  }, {
    key: 'nextPatient',
    value: function nextPatient() {
      // Advance the index to go to the next patient, allowing to advance one beyond the length (but no more)
      if (this._index < this._bundles.length) {
        this._index++;
      }
      return this.currentPatient();
    }
  }, {
    key: 'reset',
    value: function reset() {
      this._index = 0;
      this._bundles = [];
    }
  }, {
    key: 'version',
    get: function get() {
      return this._modelInfo.version;
    }
  }], [{
    key: 'FHIRv102',
    value: function FHIRv102() {
      return new PatientSource(FHIRv102XML);
    }

    // Convenience factory method for getting a FHIR 3.0.0 (STU3) Patient Source

  }, {
    key: 'FHIRv300',
    value: function FHIRv300() {
      return new PatientSource(FHIRv300XML);
    }

    // Convenience factory method for getting a FHIR 4.0.0 (R4) Patient Source

  }, {
    key: 'FHIRv400',
    value: function FHIRv400() {
      return new PatientSource(FHIRv400XML);
    }

    // Convenience factory method for getting a FHIR 4.0.1 (R4) Patient Source

  }, {
    key: 'FHIRv401',
    value: function FHIRv401() {
      return new PatientSource(FHIRv401XML);
    }
  }]);

  return PatientSource;
}();

var FHIRObject = function () {
  function FHIRObject(json, typeInfo, modelInfo) {
    var _this = this;

    _classCallCheck(this, FHIRObject);

    // Define "private" un-enumerable properties to hold internal data
    Object.defineProperties(this, {
      _json: { value: json, enumerable: false },
      _typeInfo: { value: typeInfo, enumerable: false },
      _modelInfo: { value: modelInfo, enumerable: false }
    });
    if (typeInfo == null) {
      console.error('Failed to locate typeInfo for ' + json);
      return;
    }

    var elementNames = new Set();
    for (var currentInfo = typeInfo; currentInfo != null;) {
      currentInfo.elements.forEach(function (e) {
        return elementNames.add(e.name);
      });
      if (currentInfo.baseTypeSpecifier != null) {
        currentInfo = modelInfo.findClass(currentInfo.baseTypeSpecifier.fqn);
      } else {
        currentInfo = null;
      }
    }

    var _loop = function _loop(name) {
      Object.defineProperty(_this, name, {
        get: function get() {
          return this.get(name);
        },
        enumerable: true
      });
    };

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = elementNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var name = _step.value;

        _loop(name);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  // Required by cql-execution API


  _createClass(FHIRObject, [{
    key: 'get',
    value: function get(field) {
      if (this._json == null) {
        // preserve distinction between null or undefined
        return this._json;
      }

      var parts = field.split('.');
      var root = parts[0];
      var suffix = parts.length > 1 ? parts.splice(1).join('.') : undefined;
      var element = this._typeInfo.findElement(root, true); // true: support explicit choices
      if (typeof element === 'undefined') {
        // console.error('Failed to locate element for ' + this._typeInfo.name + '.' + root);
        return;
      }

      var choicePropertyName = function choicePropertyName(element, choice) {
        if (choice.name === 'SimpleQuantity') {
          return '' + element.name + 'Quantity';
        }else {
          return '' + element.name + choice.name[0].toUpperCase() + choice.name.slice(1);
        }
      };

      var property = void 0,
        typeSpecifier = void 0;
      if (root !== element.name && element.typeSpecifier.isChoice) {
        // This only happens when the root was explicit (e.g., medicationCodeableConcept) but the
        // property is a choice (e.g., medication). In this case we need to find the matchin choice
        // and use it. We don't want other choices, even if they're in the data.
        property = root; // keep the explicit name
        typeSpecifier = element.typeSpecifier.choices.find(function (c) {
          return property === choicePropertyName(element, c);
        });
      } else {
        property = element.name;
        typeSpecifier = element.typeSpecifier;
        if (typeSpecifier.isChoice) {
          // Special handling for choices to find the right value in the FHIR data (e.g., the property
          // might be 'value', but in JSON, it's spelled out as 'valueDateTime').
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = typeSpecifier.choices[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var choice = _step2.value;

              if (choice.isNamed) {
                var choiceProperty = choicePropertyName(element, choice);
                if (this._json[choiceProperty] != null || this._json['_' + choiceProperty] != null) {
                  property = choiceProperty;
                  typeSpecifier = choice;
                  break;
                }
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      }

      if (typeSpecifier.namespace === 'System') {
        // TODO: If there is a suffix, we need to drill into the CQL system type!
        if (suffix != null) {
          console.error('Traversing into CQL system types isn\'t supported: ' + this._typeInfo.name + '.' + root + '.' + suffix + '.');
          return;
        }
        return toSystemObject(this._json[property], typeSpecifier.name);
      }

      var data = getPropertyFromJSON(this._json, property, typeSpecifier, this._modelInfo);
      if (data == null) {
        // preserve distinction between null or undefined
        return data;
      }

      return toFHIRObject(data, typeSpecifier, this._modelInfo, suffix);
    }

    // Required by cql-execution API (starting w/ 1.2.1)

  }, {
    key: 'getId',
    value: function getId() {
      return this._json.id;
    }

    // Required by cql-execution API

  }, {
    key: 'getCode',
    value: function getCode(field) {
      var code = this.get(field);
      if (!(code instanceof cql.Code)) {
        code = toCode(code);
      }
      return code;
    }

    // Required by cql-execution API (but not currently used in FHIR data model)

  }, {
    key: 'getDate',
    value: function getDate(field) {
      var date = this.get(field);
      if (!(date instanceof cql.DateTime) && date && date.value) {
        date = date.value;
      }
      return date;
    }

    // Required by cql-execution API (but not currently used in FHIR data model)

  }, {
    key: 'getInterval',
    value: function getInterval(field) {
      var ivl = this.get(field);
      if (!(ivl instanceof cql.Interval) && ivl && ivl.value) {
        ivl = ivl.value;
      }
      return ivl;
    }

    // Required by cql-execution API (but not currently used in FHIR data model)

  }, {
    key: 'getDateOrInterval',
    value: function getDateOrInterval(field) {
      var dateOrIvl = this.get(field);
      if (!(dateOrIvl instanceof cql.DateTime) && !(dateOrIvl instanceof cql.Interval) && dateOrIvl && dateOrIvl.value) {
        dateOrIvl = dateOrIvl.value;
      }
      return dateOrIvl;
    }
  }, {
    key: 'getTypeInfo',
    value: function getTypeInfo() {
      return this._typeInfo;
    }
  }]);

  return FHIRObject;
}();

var Patient = function (_FHIRObject) {
  _inherits(Patient, _FHIRObject);

  function Patient(bundle, modelInfo) {
    _classCallCheck(this, Patient);

    var patientClass = modelInfo.patientClassIdentifier ? modelInfo.patientClassIdentifier : modelInfo.patientClassName;
    var resourceType = modelInfo.patientClassName.replace(/^FHIR\./, '');
    var ptEntry = bundle.entry.find(function (e) {
      return e.resource && e.resource.resourceType === resourceType;
    });
    var ptClass = modelInfo.findClass(patientClass);

    // Define a "private" un-enumerable property to hold the bundle
    var _this2 = _possibleConstructorReturn(this, (Patient.__proto__ || Object.getPrototypeOf(Patient)).call(this, ptEntry.resource, ptClass, modelInfo));

    Object.defineProperty(_this2, '_bundle', { value: bundle, enumerable: false });
    return _this2;
  }

  _createClass(Patient, [{
    key: 'findRecord',
    value: function findRecord(profile) {
      var records = this.findRecords(profile);
      if (records.length > 0) {
        return records[0];
      }
    }
  }, {
    key: 'findRecords',
    value: function findRecords(profile) {
      var _this3 = this;

      var classInfo = this._modelInfo.findClass(profile);
      if (classInfo == null) {
        console.error('Failed to find type info for ' + profile);
        return [];
      }
      var resourceType = classInfo.name.replace(/^FHIR\./, '');
      var records = this._bundle.entry.filter(function (e) {
        return e.resource && e.resource.resourceType === resourceType;
      }).map(function (e) {
        return new FHIRObject(e.resource, classInfo, _this3._modelInfo);
      });
      return records;
    }
  }]);

  return Patient;
}(FHIRObject);

/**
 * Extracts a property from the JSON, with special support for handling FHIR primitives that
 * may be spread out over two properties (`${property}` and `_${property}`).
 * @see http://hl7.org/fhir/STU3/json.html#primitive
 * @param {Object} json - the JSON representation from which to extract the property
 * @param {string} property - the property name to extract
 * @param {Object} typeSpecifier - the element information for the property being retrieved
 * @param {Object} modelInfo - the ModelInfo from which the element came
 * @returns {Object}
 */


function getPropertyFromJSON(json, property, typeSpecifier, modelInfo) {
  var value = json[property];
  var extra = json['_' + property];
  if (value == null && extra == null) {
    return json[property];
  }

  // Special handling for FHIR ids and extensions on primitives.
  if (isFHIRPrimitiveOrListOfFHIRPrimitives(typeSpecifier, modelInfo)) {
    // Normalize (or copy) to arrays to better share code between lists and non-lists
    var valueArr = typeSpecifier.isList && Array.isArray(value) ? [].concat(_toConsumableArray(value)) : [value];
    var extraArr = typeSpecifier.isList && Array.isArray(extra) ? [].concat(_toConsumableArray(extra)) : [extra];
    // Make sure arrays are of same length for easier processing
    while (valueArr.length > extraArr.length) {
      extraArr.push(undefined);
    }
    while (extraArr.length > valueArr.length) {
      valueArr.push(undefined);
    }

    var data = [];
    for (var i = 0; i < valueArr.length; i++) {
      var item = {};
      if (typeof valueArr[i] !== 'undefined') {
        item.value = valueArr[i];
      }
      if (extraArr[i] != null) {
        Object.assign(item, extraArr[i]);
      }
      if (valueArr[i] == null && extraArr[i] == null) {
        // preserve undefined/null nature of value if neither value nor extra were found
        item = valueArr[i];
      }
      data.push(item);
    }
    return typeSpecifier.isList ? data : data[0];
  }

  return json[property];
}

function isFHIRPrimitiveOrListOfFHIRPrimitives(typeSpecifier, modelInfo) {
  if (typeSpecifier.isNamed) {
    // If its namespace is FHIR and its name starts w/ a lowercase letter, it's a FHIR primitive
    if (typeSpecifier.namespace === 'FHIR' && typeSpecifier.name[0].toLowerCase() === typeSpecifier.name[0]) {
      return true;
    }
    // The FHIR modelinfo represents code elements as a unique class type with a single string 'value'.
    // e.g., Goal's 'status' element has type 'GoalStatus', which just has a string value element.
    var typeInfo = modelInfo.findClass(typeSpecifier.fqn);
    if (typeInfo && typeInfo.baseTypeSpecifier && typeInfo.baseTypeSpecifier.fqn === 'FHIR.Element' && typeInfo.elements.length === 1) {
      var property = typeInfo.findElement('value');
      return property && property.typeSpecifier.fqn === 'System.String';
    }
    return false;
  } else if (typeSpecifier.isList) {
    return isFHIRPrimitiveOrListOfFHIRPrimitives(typeSpecifier.elementType, modelInfo);
  }
  return false;
}

/**
 * Converts JSON data to the proper CQL System Type as necessary.
 * @param {Object} data - the data to convert to the proper CQL System type
 * @param {string} name - the name of the CQL System Type (e.g., 'Boolean')
 * @returns {Object}
 */
function toSystemObject(data, name) {
  if (data == null) {
    // preserve distinction between null or undefined
    return data;
  }

  switch (name) { // eslint-disable-line
    case 'Boolean':
    case 'Decimal':
    case 'Integer':
    case 'String':
      return data;
    case 'Code':
    case 'Concept':
    case 'Quantity':
      // Currently, these aren't used as leaf nodes in the FHIR model infos!
      return;
    case 'DateTime':
      // CQL DateTime doesn't support 'Z' right now, so account for that.
      return cql.DateTime.parse(data.replace('Z', '+00:00'));
    case 'Date':
      // cql-execution v1.3.2 currently doesn't export the new Date class, so we need to use this workaround
      return cql.DateTime.parse(data) != null ? cql.DateTime.parse(data).getDate() : undefined;
    case 'Time':
      // CQL DateTime doesn't support 'Z' right now, so account for that.
      // NOTE: Current CQL execution treats time as a DateTime w/ date fixed to 0000-01-01.
      return cql.DateTime.parse('0000-01-01T' + data.replace('Z', '+00:00'));
  }
}

/**
 * Converts data to a FHIRObject class instance
 * @param {Object} data - the JSON data to populate the FHIR object with
 * @param {Object} typeSpecifier - the TypeSpecifier describing the data
 * @param {ModelInfo} modelInfo - the overall ModelInfo from which this class comes
 * @param {string} suffix - the trailing part of the path to get (e.g., x.y.z)
 * @returns {FHIRObject}
 */
function toFHIRObject(data, typeSpecifier, modelInfo, suffix) {
  if (data == null) {
    // preserve distinction between null or undefined
    return data;
  }

  if (typeSpecifier.isNamed) {
    var rootClassInfo = modelInfo.findClass(typeSpecifier.fqn);
    var rootObject = new FHIRObject(data, rootClassInfo, modelInfo);
    if (suffix != null) {
      return rootObject.get(suffix);
    }
    return rootObject;
  } else if (typeSpecifier.isList) {
    if (suffix != null) {
      console.error('List type found in the middle of a path.');
      return;
    }
    return data.map(function (item) {
      return toFHIRObject(item, typeSpecifier.elementType, modelInfo);
    });
  } else if (typeSpecifier.isInterval) {
    return new cql.Interval(toFHIRObject(data.low, typeSpecifier.pointType, modelInfo), toFHIRObject(data.high, typeSpecifier.pointType, modelInfo), data.lowClosed, data.highClosed);
  }
  return;
}

/**
 * Converts a FHIRObject instance representing a FHIR.CodeableConcept, FHIR.Coding, or FHIR.code
 * to a CQL Code.
 * @param {FHIRObject} f - the FHIRObject instance to convert to a CQL Code
 * @returns {cql.Code}
 */
function toCode(f) {
  if (f == null) {
    // preserve distinction between null or undefined
    return f;
  }

  if (Array.isArray(f)) {
    return f.map(function (c) {
      return toCode(c);
    });
  }
  var typeName = f.getTypeInfo().name.replace(/^FHIR\./, '');
  if (typeName === 'CodeableConcept') {
    if (f.coding == null) {
      // preserve distinction between null or undefined
      return f.coding;
    } else {
      var codings = f.coding.map(function (c) {
        return toCode(c);
      });
      return codings.length === 1 ? codings[0] : codings;
    }
  } else if (typeName === 'Coding') {
    return new cql.Code(f.code ? f.code.value : f.code, f.system ? f.system.value : f.system, f.version ? f.version.value : f.version, f.display ? f.display.value : f.display);
  } else if (typeName === 'code') {
    return f.value;
  }
}

module.exports = { PatientSource: PatientSource, FHIRWrapper: FHIRWrapper };