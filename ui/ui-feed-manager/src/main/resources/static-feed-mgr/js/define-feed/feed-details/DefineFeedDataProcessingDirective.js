(function () {

    var directive = function () {
        return {
            restrict: "EA",
            bindToController: {
                stepIndex: '@'
            },
            controllerAs: 'vm',
            require:['thinkbigDefineFeedDataProcessing','^thinkbigStepper'],
            scope: {},
            templateUrl: 'js/define-feed/feed-details/define-feed-data-processing.html',
            controller: "DefineFeedDataProcessingController",
            link: function ($scope, element, attrs, controllers) {
                var thisController = controllers[0];
                var stepperController = controllers[1];
                thisController.stepperController = stepperController;
                thisController.totalSteps = stepperController.totalSteps;
            }

        };
    }

    var controller = function ($scope, $http, $mdDialog, $mdExpansionPanel, RestUrlService, FeedService, BroadcastService, StepperService) {
        this.isValid = true;

        var self = this;
        this.model = FeedService.createFeedModel;
        this.stepNumber = parseInt(this.stepIndex)+1
        this.schemaHeight = "100px";

        /**
         * The form in angular
         * @type {{}}
         */
        this.dataProcessingForm = {};

        this.calcfitTable = function() {
            var numfields = self.model.table.tableSchema.fields.length;
            var height = (numfields * 59) + 'px';
            self.schemaHeight = height;
        }

        this.expandFieldPoliciesPanel = function () {
            $mdExpansionPanel().waitFor('panelFieldPolicies').then(function (instance) {
                instance.expand();
            });
        }

        this.mergeStrategies = angular.copy(FeedService.mergeStrategies);
        FeedService.enableDisablePkMergeStrategy(self.model, self.mergeStrategies);
        FeedService.enableDisableRollingSyncMergeStrategy(self.model, self.mergeStrategies);
        this.permissionGroups = ['Marketing','Human Resources','Administrators','IT'];

        BroadcastService.subscribe($scope, StepperService.ACTIVE_STEP_EVENT, onActiveStep)

        function onActiveStep(event, index) {
            if (index == parseInt(self.stepIndex)) {
                self.calcfitTable();
                validateMergeStrategies();
            }
        }

        this.allCompressionOptions = FeedService.compressionOptions;

        this.targetFormatOptions = FeedService.targetFormatOptions;

        // Open panel by default
        self.calcfitTable();
        self.expandFieldPoliciesPanel();


        this.transformChip = function(chip) {
            // If it is an object, it's already a known chip
            if (angular.isObject(chip)) {
                return chip;
            }
            // Otherwise, create a new one
            return { name: chip }
        }

        this.compressionOptions = ['NONE'];

        this.onTableFormatChange = function(opt){

            var format = self.model.table.targetFormat;
            if(format == 'STORED AS ORC' ){
                self.compressionOptions = self.allCompressionOptions['ORC'];
            }
            else  if(format == 'STORED AS PARQUET' ){
                self.compressionOptions = self.allCompressionOptions['PARQUET'];
            }
            else {
                self.compressionOptions = ['NONE'];
            }
        }

        function findProperty(key){
            return _.find(self.model.inputProcessor.properties,function(property){
                //return property.key = 'Source Database Connection';
                return property.key == key;
            });
        }

        this.onChangeMergeStrategy = function () {
            validateMergeStrategies();
        }

        function validateMergeStrategies() {
            var validPK = FeedService.enableDisablePkMergeStrategy(self.model, self.mergeStrategies);

            self.dataProcessingForm['targetMergeStrategy'].$setValidity('invalidPKOption', validPK);

            validRollingSync = FeedService.enableDisableRollingSyncMergeStrategy(self.model, self.mergeStrategies);

            self.dataProcessingForm['targetMergeStrategy'].$setValidity('invalidRollingSyncOption', validRollingSync);

            self.isValid = validRollingSync && validPK;
        }


        this.showFieldRuleDialog = function(field,policyParam) {
            $mdDialog.show({
                controller: 'FeedFieldPolicyRuleDialogController',
                templateUrl: 'js/shared/feed-field-policy-rules/define-feed-data-processing-field-policy-dialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose:false,
                fullscreen: true,
                locals : {
                    feed: self.model,
                    field:field,
                    policyParameter:policyParam
                }
            })
                .then(function(msg) {


                }, function() {

                });
        };

        // Initialize UI
        this.onTableFormatChange();
    };


    angular.module(MODULE_FEED_MGR).controller('DefineFeedDataProcessingController', controller);

    angular.module(MODULE_FEED_MGR)
        .directive('thinkbigDefineFeedDataProcessing', directive);


})();




