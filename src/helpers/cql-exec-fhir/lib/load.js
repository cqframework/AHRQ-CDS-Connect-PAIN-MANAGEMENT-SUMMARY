var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var xml2js = require('xml2js');
var processors = require('xml2js/lib/processors');

function load(filePathOrXML) {
  var xml = void 0,
      name = void 0;
  if (/^\s*<[\s\S]+>\s*$/.test(filePathOrXML)) {
    xml = filePathOrXML;
    name = 'XML';
  } else {
    xml = fs.readFileSync(filePathOrXML, 'utf8');
    name = filePathOrXML;
  }

  var modelInfo = void 0;
  var opts = {
    async: false,
    tagNameProcessors: [processors.stripPrefix],
    attrNameProcessors: [processors.stripPrefix]
  };
  xml2js.parseString(xml, opts, function (err, result) {
    if (err != null) {
      console.error('Failed to load model info from ' + name + ':', err);
      return;
    } else if (result.modelInfo == null) {
      console.error('Model info is not valid for ' + name);
      return;
    }
    modelInfo = new ModelInfo(result.modelInfo);
  });

  return modelInfo;
}

var ModelInfo = function () {
  function ModelInfo(xml) {
    _classCallCheck(this, ModelInfo);

    this._name = xml.$.name;
    this._version = xml.$.version;
    this._url = xml.$.url;
    this._schemaLocation = xml.$.schemaLocation;
    this._targetQualifier = xml.$.targetQualifier;
    this._patientClassName = xml.$.patientClassName;
    this._patientClassIdentifier = xml.$.patientClassIdentifier;
    this._patientBirthDatePropertyName = xml.$.patientBirthDatePropertyName;
    this._caseSensitive = xml.$.caseSensitive;
    this._strictRetrieveTyping = xml.$.strictRetrieveTyping;
    this._classesByLabel = new Map();
    this._classesByIdentifier = new Map();
    this._classesByName = new Map();

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = xml.typeInfo[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var t = _step.value;

        if (t.$ != null && (stripNS(t.$.type) === 'ClassInfo' || stripNS(t.$.type) === 'ProfileInfo')) {
          var classInfo = new ClassInfo(t, this);
          if (classInfo.label != null) {
            this._classesByLabel.set(classInfo.label, classInfo);
          }
          if (classInfo.identifier != null) {
            this._classesByIdentifier.set(classInfo.identifier, classInfo);
          }
          if (classInfo.name != null) {
            this._classesByName.set(classInfo.name, classInfo);
          }
        }
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

  _createClass(ModelInfo, [{
    key: 'findClass',
    value: function findClass(klass) {
      // First check label, then identifier, then name
      if (this._classesByLabel.has(klass)) {
        return this._classesByLabel.get(klass);
      } else if (this._classesByIdentifier.has(klass)) {
        return this._classesByIdentifier.get(klass);
      }

      // If label or identifier aren't used, it might come in as something like {http://hl7.org/fhir}MedicationStatement.
      // If the URL matches the model URL, then swap out the namespace with the model name (and a dot).  Otherwise this
      // will keep the name as-is.
      var klassName = klass.replace('{' + this.url + '}', this.name + '.');
      if (this._classesByName.has(klassName)) {
        return this._classesByName.get(klassName);
      }

      // Last ditch effort by name: if it starts with the model prefix (e.g., FHIR.Patient) then remove it; OR if it
      // doesn't start with the model prefix (e.g. Patient), add it.
      var modKlassName = klassName.startsWith(this.name + '.') ? klassName.slice(this.name.length + 1) : this.name + '.' + klassName;
      return this._classesByName.get(modKlassName);
    }
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }
  }, {
    key: 'version',
    get: function get() {
      return this._version;
    }
  }, {
    key: 'url',
    get: function get() {
      return this._url;
    }
  }, {
    key: 'schemaLocation',
    get: function get() {
      return this._schemaLocation;
    }
  }, {
    key: 'targetQualifier',
    get: function get() {
      return this._targetQualifier;
    }
  }, {
    key: 'patientClassName',
    get: function get() {
      return this._patientClassName;
    }
  }, {
    key: 'patientClassIdentifier',
    get: function get() {
      return this._patientClassIdentifier;
    }
  }, {
    key: 'patientBirthDatePropertyName',
    get: function get() {
      return this._patientBirthDatePropertyName;
    }
  }, {
    key: 'caseSensitive',
    get: function get() {
      return this._caseSensitive;
    }
  }, {
    key: 'strictRetrieveTyping',
    get: function get() {
      return this._strictRetrieveTyping;
    }
  }]);

  return ModelInfo;
}();

var ClassInfo = function () {
  function ClassInfo(xml, modelInfo) {
    _classCallCheck(this, ClassInfo);

    this._namespace = xml.$.namespace;
    this._name = xml.$.name;
    this._identifier = xml.$.identifier;
    this._label = xml.$.label;
    this._isRetrievable = xml.$.retrievable == 'true'; // eslint-disable-line
    this._primaryCodePath = xml.$.primaryCodePath;
    this._baseTypeSpecifier = getTypeSpecifierFromXML(xml, 'base');
    this._modelInfo = modelInfo;
    this._elementsByName = new Map();
    if (xml.element != null) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = xml.element[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var e = _step2.value;

          var element = new ClassElement(e, modelInfo);
          this._elementsByName.set(element.name, element);
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
    this._parentClasses = null; //lazy loaded
  }

  _createClass(ClassInfo, [{
    key: 'parentClasses',


    // @return NamedTypeSpecifier
    value: function parentClasses() {
      if (!this._parentClasses) {
        this._parentClasses = [];
        if (this.baseTypeSpecifier) {
          var _parentClasses;

          var parentClass = this._modelInfo.findClass(this.baseTypeSpecifier.name);
          if (parentClass) (_parentClasses = this._parentClasses).push.apply(_parentClasses, [parentClass].concat(_toConsumableArray(parentClass.parentClasses())));
        }
      }
      return this._parentClasses;
    }

    /**
     * Finds an element by name, optionally allowing for explicit choice names. If explicit choice names
     * are allowed, then if 'medicationCodeableConcept' is passed in, but the real element name is
     * 'medication' and it is a choice where 'CodeableConcept' is a valid option type, then it will return
     * that.  If explicit choice names are not allowed, it will return `undefined`.  Technically, explicit
     * choicenames won't come up often -- likely only when a ModelInfo uses one as its primaryCodePath or
     * primaryDatePath (and even then, some might consider that a bug in the ModelInfo).
     * @param {string} el - the name of the element to find
     * @param {boolean} allowExplicitChoice - indicates if explicit choice names are allowed
     * @return {ClassElement}
     */

  }, {
    key: 'findElement',
    value: function findElement(el) {
      var allowExplicitChoice = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var element = this._elementsByName.get(el);
      // TODO: Should we add support for when the base type is a System type?
      if (element == null && this.baseTypeSpecifier != null && this.baseTypeSpecifier.namespace !== 'System') {
        element = this._modelInfo.findClass(this.baseTypeSpecifier.fqn).findElement(el);
      }
      if (element == null && allowExplicitChoice) {
        // Now go through the name checking possible combinations of name and type for explicit choices
        // E.g., medicationCodeableConcept -> medication / CodeableConcept -> medicationCodeable / Concept
        for (var i = 0; i < el.length; i++) {
          if (/^[A-Z]$/.test(el[i])) {
            var name = el.slice(0, i);
            var potential = this.findElement(name, false);
            if (potential != null && potential.typeSpecifier && potential.typeSpecifier.isChoice) {
              var _ret = function () { // eslint-disable-line no-loop-func
                var explicitType = el.slice(i);
                var typeMatchesChoice = potential.typeSpecifier.choices.find(function (c) {
                  return c.name === explicitType || c.name === '' + explicitType[0].toLowerCase() + explicitType.slice(1);
                });
                if (typeMatchesChoice) {
                  element = potential;
                  return 'break';
                }
              }();

              if (_ret === 'break') break;
            }
          }
        }
      }
      return element;
    }
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }
  }, {
    key: 'identifier',
    get: function get() {
      return this._identifier;
    }
  }, {
    key: 'label',
    get: function get() {
      return this._label;
    }
  }, {
    key: 'isRetrievable',
    get: function get() {
      return this._isRetrievable;
    }
  }, {
    key: 'primaryCodePath',
    get: function get() {
      return this._primaryCodePath;
    }
  }, {
    key: 'baseTypeSpecifier',
    get: function get() {
      return this._baseTypeSpecifier;
    }
  }, {
    key: 'elements',
    get: function get() {
      return Array.from(this._elementsByName.values());
    }
  }]);

  return ClassInfo;
}();

var ClassElement = function () {
  function ClassElement(xml, modelInfo) {
    _classCallCheck(this, ClassElement);

    this._name = xml.$.name;
    this._typeSpecifier = getTypeSpecifierFromXML(xml, '', 'element');
    this._isProhibited = xml.$.prohibited == 'true'; // eslint-disable-line
    this._isOneBased = xml.$.oneBased === 'true';
    this._modelInfo = modelInfo;
  }

  _createClass(ClassElement, [{
    key: 'name',
    get: function get() {
      return this._name;
    }
  }, {
    key: 'typeSpecifier',
    get: function get() {
      return this._typeSpecifier;
    }
  }, {
    key: 'isProhibited',
    get: function get() {
      return this._isProhibited;
    }
  }]);

  return ClassElement;
}();

var NAMED_TYPE_NAME = 'NamedTypeSpecifier';
var NAMED_TYPE_RE = /^(([^.<>]+)\.)?([^<>]+)$/;

var NamedTypeSpecifier = function () {
  function NamedTypeSpecifier(name, namespace) {
    _classCallCheck(this, NamedTypeSpecifier);

    this._name = name;
    this._namespace = namespace;
  }

  _createClass(NamedTypeSpecifier, [{
    key: 'isNamed',
    get: function get() {
      return true;
    }
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }
  }, {
    key: 'namespace',
    get: function get() {
      return this._namespace;
    }
  }, {
    key: 'fqn',
    get: function get() {
      return this.namespace == null ? this.name : this.namespace + '.' + this.name;
    }
  }]);

  return NamedTypeSpecifier;
}();

var LIST_TYPE_NAME = 'ListTypeSpecifier';
var LIST_TYPE_RE = /^[Ll]ist\s*<\s*(.*[^\s])\s*>$/;

var ListTypeSpecifier = function () {
  function ListTypeSpecifier(elementType) {
    _classCallCheck(this, ListTypeSpecifier);

    this._elementType = elementType;
  }

  _createClass(ListTypeSpecifier, [{
    key: 'isList',
    get: function get() {
      return true;
    }
  }, {
    key: 'elementType',
    get: function get() {
      return this._elementType;
    }
  }]);

  return ListTypeSpecifier;
}();

var INTERVAL_TYPE_NAME = 'IntervalTypeSpecifier';
var INTERVAL_TYPE_RE = /^[Ii]nterval\s*<\s*(.*[^\s])\s*>$/;

var IntervalTypeSpecifier = function () {
  function IntervalTypeSpecifier(pointType) {
    _classCallCheck(this, IntervalTypeSpecifier);

    this._pointType = pointType;
  }

  _createClass(IntervalTypeSpecifier, [{
    key: 'isInterval',
    get: function get() {
      return true;
    }
  }, {
    key: 'pointType',
    get: function get() {
      return this._pointType;
    }
  }]);

  return IntervalTypeSpecifier;
}();

var CHOICE_TYPE_NAME = 'ChoiceTypeSpecifier';
var CHOICE_TYPE_RE = /^[Cc]hoice\s*<\s*(.*[^\s])\s*>$/;

var ChoiceTypeSpecifier = function () {
  function ChoiceTypeSpecifier(choices) {
    _classCallCheck(this, ChoiceTypeSpecifier);

    this._choices = choices;
  }

  _createClass(ChoiceTypeSpecifier, [{
    key: 'isChoice',
    get: function get() {
      return true;
    }
  }, {
    key: 'choices',
    get: function get() {
      return this._choices;
    }
  }]);

  return ChoiceTypeSpecifier;
}();

function getTypeSpecifierFromXML(xml) {
  var type = void 0,
      typeSpecifier = void 0;

  // loop through prefixes looking for type property (e.g., type, elementType, pointType, etc.)

  for (var _len = arguments.length, prefixes = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    prefixes[_key - 1] = arguments[_key];
  }

  if (xml.$) {
    for (var i = 0; type == null && i < prefixes.length; i++) {
      type = prefixes[i] === '' ? stripNS(xml.$.type) : stripNS(xml.$[prefixes[i] + 'Type']);
    }
  }

  // loop through prefixes looking for typeSpecifier property (e.g., typeSpecifier, elementTypeSpecifier, etc.)
  for (var _i = 0; typeSpecifier == null && _i < prefixes.length; _i++) {
    typeSpecifier = prefixes[_i] === '' ? xml.typeSpecifier : xml[prefixes[_i] + 'TypeSpecifier'];
  }
  if (typeSpecifier && typeSpecifier.length > 0) {
    typeSpecifier = typeSpecifier[0];
  }

  return getTypeSpecifier(type, typeSpecifier);
}

function getTypeSpecifier(stringType, xmlTypeSpecifier) {
  // NamedTypeSpecifier
  if (stringType && NAMED_TYPE_RE.test(stringType)) {
    var m = NAMED_TYPE_RE.exec(stringType);
    return new NamedTypeSpecifier(m[3], m[2]);
  } else if (xmlTypeSpecifier && stripNS(xmlTypeSpecifier.$.type) === NAMED_TYPE_NAME) {
    var name = xmlTypeSpecifier.$.name;
    var namespace = xmlTypeSpecifier.$.modelName || xmlTypeSpecifier.$.namespace;
    return new NamedTypeSpecifier(name, namespace);
  }
  // ListTypeSpecifier
  else if (stringType && LIST_TYPE_RE.test(stringType)) {
      var _m = LIST_TYPE_RE.exec(stringType);
      return new ListTypeSpecifier(getTypeSpecifier(_m[1]));
    } else if (xmlTypeSpecifier && stripNS(xmlTypeSpecifier.$.type) === LIST_TYPE_NAME) {
      return new ListTypeSpecifier(getTypeSpecifierFromXML(xmlTypeSpecifier, 'element'));
    }
    // IntervalTypeSpecifier
    else if (stringType && INTERVAL_TYPE_RE.test(stringType)) {
        var _m2 = INTERVAL_TYPE_RE.exec(stringType);
        return new IntervalTypeSpecifier(getTypeSpecifier(_m2[1]));
      } else if (xmlTypeSpecifier && stripNS(xmlTypeSpecifier.$.type) === INTERVAL_TYPE_NAME) {
        return new IntervalTypeSpecifier(getTypeSpecifierFromXML(xmlTypeSpecifier, 'point'));
      }
      // ChoiceTypeSpecifier
      else if (stringType && CHOICE_TYPE_RE.test(stringType)) {
          // NOTE: The string type attribute variant does not support choices nested in choices
          var _m3 = INTERVAL_TYPE_RE.exec(stringType);
          var choiceStrings = _m3[1].split(',').map(function (c) {
            return c.trim();
          });
          var choices = choiceStrings.map(function (c) {
            return getTypeSpecifier(c);
          });
          return new ChoiceTypeSpecifier(choices);
        } else if (xmlTypeSpecifier && stripNS(xmlTypeSpecifier.$.type) === CHOICE_TYPE_NAME) {
          var _choices = xmlTypeSpecifier.choice.map(function (c) {
            return getTypeSpecifier(null, c);
          });
          return new ChoiceTypeSpecifier(_choices);
        }
  return;
}

function stripNS(str) {
  if (str == null) {
    return str;
  }
  return str.replace(/.*:/, '');
}

module.exports = load;