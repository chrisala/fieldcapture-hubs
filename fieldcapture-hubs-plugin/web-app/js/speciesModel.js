

var speciesFormatters = function() {

    var singleLineSpeciesFormatter = function(species) {
        if (species.id == -1) {
            return 'Please select...';
        }
        if (species.scientificName && species.commonName) {
            return species.scientificName + ' (' + species.commonName + ')';
        }
        else if (species.scientificName) {
            return species.scientificName;
        }
        else {
            return species.name;
        }
    };

    function image(species, config) {

        var imageUrl = config.noImageUrl;
        if (species.guid || species.lsid) {
            imageUrl = config.speciesImageUrl + '?id=' + encodeURIComponent(species.guid || species.lsid);
        }
        return $('<div class="species-image-holder"/>').css('background-image', 'url('+imageUrl+')').append();
    }

    function scientificName(species) {
        var scientificName = species.scientificNameMatches && species.scientificNameMatches.length > 0 ? species.scientificNameMatches[0] : species.scientificName;
        return $('<div class="scientific-name"></div>').html(scientificName || '');
    }

    function commonName(species) {
        var commonName = species.commonNameMatches && species.commonNameMatches.length > 0 ? species.commonNameMatches[0] : species.commonName;
        return $('<div class="common-name"></div>').html(commonName || species.name);
    }
    var multiLineSpeciesFormatter = function(species, queryTerm, config) {

        if (!species) return '';

        var result = $("<div class='species-result'/>");;
        if (config.showImages) {
            result.append(image(species, config));
        }
        result.append($('<div class="name-holder"/>').append(scientificName(species)).append(commonName(species)));

        return result;
    };


    return {
        singleLineSpeciesFormatter:singleLineSpeciesFormatter,
        multiLineSpeciesFormatter:multiLineSpeciesFormatter
    }
}();



var speciesSearchEngines = function() {

    var speciesId = function (species) {
        if (species.guid || species.lsid) {
            return species.guid || species.lsid;
        }
        return species.name;
    };

    var speciesTokenizer = function (species) {
        var result = [];
        if (species.scientificName) {
            result = result.concat(species.scientificName.split(/\W+/));
        }
        if (species.commonName) {
            result = result.concat(species.commonName.split(/\W+/));
        }
        if (species.name) {
            result = result.concat(species.name.split(/\W+/));
        }
        return result;
    };

    var select2ListTransformer = function (speciesArray) {
        if (!speciesArray) {
            return [];
        }
        for (var i in speciesArray) {
            speciesArray[i].id = speciesId(speciesArray[i]);
        }
        return speciesArray;
    };

    var select2AlaTransformer = function(alaResults) {
        var speciesArray = alaResults.autoCompleteList;
        if (!speciesArray) {
            return [];
        }
        for (var i in speciesArray) {
            speciesArray[i].id = speciesArray[i].guid;
            speciesArray[i].scientificName = speciesArray[i].name;
        }
        return speciesArray;

    };

    var engines = {};

    function engineKey(listId, alaFallback) {
        return listId || '' + alaFallback;
    }

    function get(listId, alaFallback, config) {
        var engine = engines[engineKey(listId, alaFallback)];
        if (!engine) {
            engine = define(listId, alaFallback, config);
        }
        return engine;
    };

    function define(listId, alaFallback, config) {
        var options = {
            datumTokenizer: speciesTokenizer,
            queryTokenizer: Bloodhound.tokenizers.nonword,
            identify: speciesId
        };
        if (listId) {
            options.prefetch = {
                url: config.speciesListUrl + '?druid='+listId+'&includeKvp=true',
                cache: false,
                transform: select2ListTransformer
            };
        }
        if (alaFallback) {
            options.remote = {
                url: config.searchBieUrl + '?q=%',
                wildcard: '%',
                transform: select2AlaTransformer
            };
        }

        return new Bloodhound(options);
    };

    return {
        get:get,
        speciesId:speciesId
    };
}();


/**
 * Manages the species data type in the output model.
 * Allows species information to be searched for and displayed.
 */
var SpeciesViewModel = function(data, options) {

    var self = this;

    self.guid = ko.observable();
    self.name = ko.observable();
    self.scientificName = ko.observable();
    self.commonName = ko.observable();

    self.listId = ko.observable();
    self.transients = {};
    self.transients.speciesInformation = ko.observable();
    self.transients.speciesTitle = ko.observable();
    self.transients.editing = ko.observable(false);
    self.transients.textFieldValue = ko.observable();
    self.transients.bioProfileUrl =  ko.computed(function (){
        return  fcConfig.bieUrl + '/species/' + self.guid();
    });

    self.transients.speciesSearchUrl = options.speciesSearchUrl+'&dataFieldName='+options.dataFieldName;

    self.speciesSelected = function(event, data) {
        self.loadData(data);
        self.transients.editing(!data.name);
    };

    self.textFieldChanged = function(newValue) {
        if (newValue != self.name()) {
            self.transients.editing(true);
        }
    };

    self.toJS = function() {
        return {
            guid:self.guid(),
            name:self.name(),
            scientificName:self.scientificName(),
            commonName:self.commonName(),
            listId:self.listId
        }
    };

    self.loadData = function(data) {
        if (!data) data = {};
        self.guid(orBlank(data.guid || data.lsid));
        self.name(orBlank(data.name));
        self.listId(orBlank(data.listId));
        self.scientificName(orBlank(data.scientificName));
        self.commonName(orBlank(data.commonName));

        self.transients.speciesTitle = speciesFormatters.multiLineSpeciesFormatter(self.toJS(), '', {showImage: false});
        self.transients.textFieldValue(self.name());
        if (self.guid() && !options.printable) {

            var profileUrl = fcConfig.bieUrl + '/species/' + encodeURIComponent(self.guid());
            $.ajax({
                url: fcConfig.speciesProfileUrl+'?id=' + encodeURIComponent(self.guid()),
                dataType: 'json',
                success: function (data) {
                    var profileInfo = '<a href="'+profileUrl+'" target="_blank">';
                    var imageUrl = data.thumbnail || (data.taxonConcept && data.taxonConcept.smallImageUrl);

                    if (imageUrl) {
                        profileInfo += "<img title='Click to show profile' class='taxon-image ui-corner-all' src='"+imageUrl+"'>";
                    }
                    else {
                        profileInfo += "No profile image available";
                    }
                    profileInfo += "</a>";
                    self.transients.speciesInformation(profileInfo);
                },
                error: function(request, status, error) {
                    console.log(error);
                }
            });

        }
        else {
            self.transients.speciesInformation("No profile information is available.");
        }

    };

    if (data) {
        self.loadData(data);
    }
    self.focusLost = function(event) {
        self.transients.editing(false);
        if (self.name()) {
            self.transients.textFieldValue(self.name());
        }
        else {
            self.transients.textFieldValue('');
        }
    };

    var speciesConfig = _.find(options.speciesConfig.surveyConfig.speciesFields || [], function(conf) {
        return conf.output == options.outputName && conf.dataFieldName == options.dataFieldName;
    });
    if (!speciesConfig) {
        speciesConfig = options.speciesConfig.defaultSpeciesConfig;
    }
    else {
        speciesConfig = speciesConfig.config;
    }

    if (options.showImages == undefined) {
        options.showImages = true;
    }

    self.formatSearchResult = function(species) {
        return speciesFormatters.multiLineSpeciesFormatter(species, self.transients.currentSearchTerm || '', options);
    };
    self.formatSelectedSpecies = speciesFormatters.singleLineSpeciesFormatter;
    var listId = speciesConfig.speciesLists && speciesConfig.speciesLists.length > 0 ? speciesConfig.speciesLists[0].dataResourceUid : '';
    self.transients.engine = speciesSearchEngines.get(listId, speciesConfig.useAla || true, options);
    self.id = function() {
        return speciesSearchEngines.speciesId({guid:self.guid(), name:self.name()});
    };

    function markMatch (text, term) {
        if (!text) {
            return '';
        }
        // Find where the match is
        var match = text.toUpperCase().indexOf(term.toUpperCase());

        // If there is no match, move on
        if (match < 0) {
            return text;
        }

        // Put in whatever text is before the match
        var result = text.substring(0, match);

        // Mark the match
        result += '<b>' + text.substring(match, match + term.length) + '</b>';

        // Put in whatever is after the match
        result += text.substring(match + term.length);

        return result;
    }


    self.search = function(params, callback) {
        var term = params.term;
        self.transients.currentSearchTerm = term;
        var suppliedResults = false;
        if (term) {
            self.transients.engine.search(term, function (resultArr) {
                    if (resultArr.length > 0) {

                        for (var i in resultArr) {
                            resultArr[i].scientificNameMatches = [markMatch(resultArr[i].scientificName, term)];
                            resultArr[i].commonNameMatches = [markMatch(resultArr[i].commonName || resultArr[i].name, term)];
                        }

                        callback({results: [{text: "Species List", children: resultArr}]}, false);

                        suppliedResults = true;
                    }
                },
                function (resultArr) {
                    var results = {results: [{text: "Atlas of Living Australia", children: resultArr}]};
                    callback(results, suppliedResults);
                });
        }
        else {
            var list = self.transients.engine.all();
            if (list.length > 0) {
                var pageLength = 10;
                var offset = (params.page || 0) * pageLength;
                var end = Math.min(offset+pageLength, list.length);
                var page = list.slice(offset, end);
                var results = offset > 0 ? page : [{text: "Species List", children: page}];

                callback({results: results, pagination: {more: end < list.length }});
            }
        }
    }
};

$.fn.select2.amd.define('select2/species', [
    'select2/data/ajax',
    'select2/utils'
], function (BaseAdapter, Utils) {
    function SpeciesAdapter($element, options) {
        this.model = options.get("model");
        SpeciesAdapter.__super__.constructor.call(this, $element, options);
    }

    Utils.Extend(SpeciesAdapter, BaseAdapter);

    SpeciesAdapter.prototype.query = function (params, callback) {
        var self = this;

        self.model.search(
            params, function (results, append) {
                if (!append) {
                    callback(results);
                }
                else {
                    self.trigger("results:append", {data: results, query: params});
                }
            }
        );

    };

    SpeciesAdapter.prototype.current = function (callback) {
        var data = this.model.toJS();
        data.id = speciesSearchEngines.speciesId(data);
        if (!data.id) {
            data = {id: -1, text: "Please select..."}
        }
        callback([data]);
    };

    return SpeciesAdapter;
});
