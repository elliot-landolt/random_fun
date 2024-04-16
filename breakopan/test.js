Sim.UI.challenge = (function() {

    var demo = window.location.pathname.indexOf("-demo") !== -1;
    var demoWarning = '<br/><b>Please note that users are able to view but not run this challenge in the demonstration version of the simulation.</b>';

    var _config = {
        challengeKey: null,
        challengeName: null,
        challengeNum: -1,
        getDecisionsImpl: function() { return {} },
        specializedInitImpl: function() { return {} }
    }
    var _modalOptions = {
        modalColor : '#000000',
        opacity : 0.4
    }
    //user settable attrs
    var _attrs = {

    }

    var _initCb;
    var _scenarioNum;
    var _initialized;
    var _runTable;
    var _runInfoTable;
    var _runSummaryTable;
    var _selectedRunNumber;
    var _animationStep;
    var _runLoadingMessage = "<p/>Generating 20 runs....<br/>Highlight a run from the list on the side bar to view the animation or run data.</p>";

    var _buildTabContents = function(overtimeData) {

        _runInfoTable = Sim.UI.utils.buildRunInfoTable(
                overtimeData,
                _selectedRunNumber,
                _animationStep);

        _runSummaryTable = Sim.UI.utils.buildRunSummaryTable(
                overtimeData,
                _selectedRunNumber,
                _animationStep);

        Sim.UI.charts.build( overtimeData, _selectedRunNumber, _animationStep);

        setTimeout( function(){
            _checkRunLimit();
        }, 1000);

    }

    var _getNumTableVars = function(){
        var n = parseInt(Sim.UI.challenge.getAttr('numTableVars'))
        return isNaN(n)? 14 : n;
    }

    var _getRuntimeData = function(cb) {
        $.ajax({
            type: 'POST',
            url: F.APIUtils.getURL("run"),
            data: 'variables='+Sim.getRuntimeVars(_selectedRunNumber, _getNumTableVars())+'&method=GET&format=RUNTIME',
            dataType:'json',
            success:function(overtimeData){
                if(cb != null)
                    cb(overtimeData);
            }
        });
    }

    var _getConciseData = function(cb) {
        F.API.Run.getInfo(function(conciseData) {
                    if(cb != null)
                        cb(conciseData);
                }, {
                    "variables" : Sim.getConciseVars(),
                    "format" : "CONCISE"
                });
    }

    var _showPopUp = function() {
        if(_isDemoDisabled())
            return;
        Dialogs.hide();
        Dialogs.show($("#challenge-info").html(), null, {header:''});
    }
    var _showDemoWarning = function() {
        Dialogs.hide();
        Dialogs.show($("#challenge-info").html()+demoWarning, null, {header:''});
    }

    var _doRun =  function(e) {
        _enableRunButton(false);
        Sim.UI.charts.reset();
        Sim.run();
        return false;
    }

    var _enableRunButton = function(enabled, showMsg) {
        if(enabled){
            $('#run-button').unbind('click');
            $('#run-button').bind('click', _doRun);
            $('#run-button').removeClass('button-disabled');
            $('#run-button').removeAttr('disabled');
            $('#run-limit-message').hide();
        }
        else {
            $('#run-button').unbind('click');
            $('#run-button').addClass('button-disabled');
            $('#run-button').attr('disabled','disabled');

            if (showMsg !== undefined && showMsg !== false) {
                $('#run-limit-message').html("Simulate is disabled. You have run the maximum number of scenarios .");
                $('#run-limit-message').show();
            }
        }
    }

    var _checkRunLimit = function() {

        if(_isDemoDisabled())
            return _enableRunButton(false);

        if(!_config.runLimit )
            return _enableRunButton(true);
        if(isNaN(_config.runLimit))
            return _enableRunButton(true);
        if(_config.runLimit <= 0)
            return _enableRunButton(true);
        if(_scenarioNum >= _config.runLimit && !_config.isFac)
            _enableRunButton(false, true);
        else{
            _enableRunButton(true);

            $('#run-limit-message').html('You have simulated '+_scenarioNum+' of '+_config.runLimit+' scenarios.');
            $('#run-limit-message').show();
        }
    }
    var _isDemoDisabled = function(){

        if(!demo || _config.challengeNum == null)
            return false;

        if(_config.challengeNum == 1 )
            return false;

        return true;
    }

    var _updateRunInfo = function(data, runNumber, forStep) {
        Sim.UI.utils.buildRunInfoTable(data, _selectedRunNumber, forStep);
        Sim.UI.utils.buildRunSummaryTable(data, _selectedRunNumber, forStep);
        Sim.UI.charts.update(forStep, _selectedRunNumber);
    }

    var _triggerHotjarAnalytics = function() {
        if (pendingHotjarTrigger && _config.challengeNum == 6 && 10 <= _scenarioNum) {
            if (window.hj) {
                window.hj('trigger', 'simulate-harvard-benihana-nps');
                pendingHotjarTrigger = false;
            }
        }
    }

    return {
        selectedRunNumber: function(){ return _selectedRunNumber;},
        updateRunInfo:_updateRunInfo,
        getD_KeyValueDecisions : function() {
            return _config.getDecisionsImpl();
        },
        incrementScenarioNumber : function() {
            _scenarioNum++;
            Sim.UI.utils.saveScenarioData(_config.groupName, _config.challengeKey + "/scenarioNum", _scenarioNum.toString());
            _triggerHotjarAnalytics();
        },
        updateData : function() {
            $("#loading_msg").show();
            _selectedRunNumber = 21; //select the average run
            Restaurant.resetAnimation();
            Restaurant.enableControls(false);
            _checkRunLimit();
            _getConciseData(function(conciseData) {
                Sim.UI.utils.buildRunTable(conciseData);

                _getRuntimeData(function(overtimeData) {
                    if (Sim.UI.getTableMode()) {
                        Sim.UI.setTableMode();
                    }
                    _animationStep = parseInt(overtimeData.run.step);
                    _buildTabContents(overtimeData);
                    Restaurant.setOvertimeData( overtimeData, _selectedRunNumber, _getNumTableVars());
                    _checkRunLimit();
                });
            });
        },
        reload: function (runId) {
            $("#loading_msg").show();
            F.API.Run.clone(runId, Sim.UI.challenge.updateData);
        },
        runLimitExceeded: function(){
            if(!_config.runLimit )
                return false;
            if(isNaN(_config.runLimit))
                return false;
            if(_config.runLimit <= 0)
                return false;
            return  _scenarioNum >= _config.runLimit;
        },
        getChallengeNum : function () {
            return _config.challengeNum;
        },
        getChallengeName : function () {
            return _config.challengeName;
        },
        getCurrentRunName : function() {
            if(!_initialized)
                throw new Error(_config.challengeName + " not initialized");

            return _config.challengeNum + ":Scenario " + _scenarioNum;
        },
        setAttr: function(name,value) {
            _attrs[name] = value;
        },
        getAttr: function(name) {
            if(!name)
                return _attrs;
            return _attrs[name];
        },
        hasAttr: function (name) {
            return _attrs[name] !== undefined && _attrs[name] !== null;
        },
        isInitialized: function() {
            return _initialized;
        },
        onInit: function(initCb) {
            _initCb = initCb;
        },
        handleRunLimit: function() {
            $("#loading_msg").hide();
        },
        buildTabContents:function(selectedRunNumber){
            _selectedRunNumber = selectedRunNumber;
            Restaurant.resetAnimation();
            Restaurant.enableControls(false);

            $("#loading_msg").show();

            _getRuntimeData(function(overtimeData) {
                _buildTabContents( overtimeData );
                if(selectedRunNumber == 21)
                    return;
                Restaurant.enableControls(true);
                Restaurant.setOvertimeData( overtimeData, _selectedRunNumber, _getNumTableVars());
                Restaurant.playAnimation();
            });
        },
        enableRunButton:_enableRunButton,
        init : function(config) {
            if (config.isFac){
                Sim.UI.challenge.isFac = true;
            }

            $('#challenge-moreinfo').bind('click', function(e) {
                _showPopUp();
                return false;
            });

            $("#challenge_side_bar").show();
            $("#prepare_side_bar").hide();

            _attrs = {};
            _initCb = null;
            _config = config;

            _scenarioNum = 1;
            _initialized = false;

            _runTable = null;
            _runInfoTable = null;
            _runSummaryTable = null;

            _selectedRunNumber = 21;
            _animationStep = 271;

            if(_config.specializedInitImpl)
                _config.specializedInitImpl();

            Sim.UI.utils.initChallenge();
            Sim.UI.utils.initSideBar();

            Sim.reset();

            Sim.UI.utils.loadScenarioData(_config.groupName, _config.challengeKey, function(value) {

                value = value[_config.challengeKey];
                if(value === null || value === undefined)
                {
                    _showPopUp();
                    _initialized = true;
                    _scenarioNum = 0;

                    if(_initCb != null)
                        _initCb();

                    _checkRunLimit();
                    Restaurant.enableControls(true);
                    return;
                }

                var scenarioNum = 0;
                if(value && value.scenarioNum !== undefined && value.scenarioNum !== null)
                    scenarioNum = parseInt(value.scenarioNum);

                if (scenarioNum < 0 || isNaN(scenarioNum))
                    scenarioNum = 0;

                setScenarionNum = function (scenarioNum) {
                    _scenarioNum = scenarioNum;

                    Restaurant.enableControls(false);
                    Restaurant.resetAnimation();

                    _initialized = true;

                    if (_initCb != null)
                        _initCb();
                    _checkRunLimit();
                    _triggerHotjarAnalytics();
                }

                if (_config.challengeKey === 'challenge-6') {
                    F.API.Archive.getRuns(null, function(res) { setScenarionNum(res.run.length) }, { name: '6', 'user_path': window.GLOBALS.User.path })
                } else {
                    setScenarionNum(scenarioNum)
                }
            });

            if(_isDemoDisabled()){
                    _showDemoWarning();
            }
        }
    };
}());
//14 table default
