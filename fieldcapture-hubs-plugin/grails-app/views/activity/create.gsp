<%@ page import="grails.converters.JSON; org.codehaus.groovy.grails.web.json.JSONArray" contentType="text/html;charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="${hubConfig.skin}"/>
    <title>Create | Activity | Field Capture</title>
    <script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/jstimezonedetect/1.0.4/jstz.min.js"></script>
    <r:script disposition="head">
    var fcConfig = {
        serverUrl: "${grailsApplication.config.grails.serverURL}",
        createUrl: "${createLink(action: 'create')}/",
        projectViewUrl: "${createLink(controller:'project', action:'index')}/"
        },
        here = document.location.href;
    </r:script>
    <r:require modules="knockout,jqueryValidationEngine,datepicker"/>
</head>
<body>
<div class="${containerType} validationEngineContainer" id="validation-container">
    <div id="koActivityMainBlock">
        <ul class="breadcrumb">
            <li><g:link controller="home">Home</g:link> <span class="divider">/</span></li>
            <g:if test="${project}">
                <li><a data-bind="click:goToProject" class="clickable">Project</a> <span class="divider">/</span></li>
            </g:if>
            <g:elseif test="${site}">
                <li><a data-bind="click:goToSite" class="clickable">Site</a> <span class="divider">/</span></li>
            </g:elseif>
            <li class="active">Create new activity</li>
        </ul>

        <div class="row-fluid">
            <div class="span6">
                <label for="type">Type of activity</label>
                <select data-bind="value: type, popover:{title:'', content:transients.activityDescription, trigger:'manual', autoShow:true}" id="type" data-validation-engine="validate[required]" class="input-xlarge">
                    <g:each in="${activityTypes}" var="t" status="i">
                        <g:if test="${i == 0 && create}">
                            <option></option>
                        </g:if>
                        <optgroup label="${t.name}">
                            <g:each in="${t.list}" var="opt">
                                <option>${opt.name}</option>
                            </g:each>
                        </optgroup>
                    </g:each>
                </select>
            </div>
        </div>

        <div class="form-actions">
            <button type="button" data-bind="click: next" class="btn btn-primary">Next</button>
            <button type="button" id="cancel" class="btn">Cancel</button>
        </div>
    </div>

</div>

<!-- templates -->

<r:script>

    var returnTo = "${returnTo}";

    $(function(){

        $('#validation-container').validationEngine('attach', {scroll: false});

        $('.helphover').popover({animation: true, trigger:'hover'});

        $('#cancel').click(function () {
            document.location.href = returnTo;
        });

        function ViewModel (activityTypes, projectId) {
            var self = this;

            self.type = ko.observable();

            self.goToProject = function () {
                document.location.href = fcConfig.projectViewUrl + projectId;
            };
            self.transients = {};
            self.transients.activityDescription = ko.computed(function() {
                var result = "";
                if (self.type()) {
                    $.each(activityTypes, function(i, obj) {
                        $.each(obj.list, function(j, type) {
                            if (type.name === self.type()) {
                                result = type.description;
                                return false;
                            }
                        });
                        if (result) {
                            return false;
                        }
                    });
                }
                return result;
            });

            self.next = function () {
                if ($('#validation-container').validationEngine('validate')) {

                    document.location = fcConfig.createUrl+'?projectId='+projectId+'&type='+self.type();

                }
            };

        }

        var viewModel = new ViewModel(${(activityTypes as JSON).toString()}, '${project.projectId}');
        ko.applyBindings(viewModel,document.getElementById('koActivityMainBlock'));

    });

</r:script>
</body>
</html>