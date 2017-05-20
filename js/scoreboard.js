/**
 * Scoreboard JS
 *
 * @author Tomas Domanik
 */


// match
(function( match, jQuery, undefined ) {
    var _ids = { // private
        'scoreboard': '#scoreboard',
        'score': {
            'teams': '#scoreboard>div.score>div',
            'home': '#score-home',
            'host': '#score-host'
        },
        dialog: {
            goal: '#goal-dialog',
            match_list: '#match-list-dialog ',
            match_info: '#match-info-dialog ',
            match_data_send: '#match-send-dialog ',
            new_match: '#match-new-dialog ',
            player_list: '#player-list-dialog ',
            player_edit: '#player-edit-dialog ',
        },
        'goal_dialog': '#goal-dialog',
        'flip_score_button' : '#flip-score-button',
    }

    var _data = { // private
        matchId: false,
        matchTime: (moment().unix()*1000 + moment().milliseconds()),
        parent: null,
        teams: {},
        players: {},
        score: {home: 0, host: 0},
        goals: {},
        events: {},
        api: {
            sendMatchDataUrl: 'http://',
        },
    }

    var _setting = {
        format: {
            datetime: 'D/MMM YYYY HH:mm',
            date: 'DoM YYYY',
        }
    }




    match.init = function($config) {
        var config = $config || {};

        if(typeof config.matchId != 'undefined') {
            _data.matchId = config.matchId;
        }

        if(typeof config.parent != 'undefined') {
            _data.parent = config.parent;
        }

        if(typeof config.matchTime != 'undefined') {
            _data.matchTime = config.matchTime;
        }

        // add teams from config
        if(typeof config.teams != 'undefined') {
            $.each(config.teams, function (teamId, _t) {
                match.addTeam(_t.side, _t.name);

                score = 0;
                if(typeof config.score != 'undefined') {
                    score = config.score[_t.side] || 0;
                }
                _setScore(_t.side, score);

                $el = _ids.score.teams + '.' + _t.side;
                $($el).click(function(){
                    match.addGoalAction(_t.side);
                });
            });

        } else {
            alert('teams not defined !');
        }

        // add players from config
        if(typeof config.players != 'undefined') {
            $.each(config.players, function (i, _p) {
                match.addPlayer(_p.id, _p.no, _p.name, _p.team);
            });
        }

        // add players from config
        if(typeof config.goals != 'undefined') {
            _data.goals = config.goals;
        }

        // add players from config
        if(typeof config.api != 'undefined') {
            _data.api = config.api;
        }

        _initScoreBoard();
        _initButtons();

        $('#navbar a.match-action.player-manage').show();
        $('#navbar a.match-action.send-data').show();

        if(!_data.matchId) {
            _data.matchId = _data.matchTime;
        }

        match.saveLocal();
    }


    match.getCollection = function() {
        var collection = [];
        $.each(localStorage, function(item, data){
            if(item.indexOf('match-') == 0 && data.indexOf('[object Object]') < 0) {
                collection[item] = data;
            }
        });

        return collection;
    }

    match.manageMatchesAction = function () {
        manageMatchesDialog(match.getCollection());
    }

    match.managePlayersAction = function () {
        players = _data.players;

        managePlayersDialog(players);
    }


    match.initNewMatchAction = function() {
        newMatchDialog();
    }

    match.loadMatchAction = function(id) {
        match.load(id);
    }

    match.load = function (id) {
        loadedData = JSON.parse(localStorage.getItem(id));
        loadedData.parent = loadedData.parent || loadedData.matchId;

        match.init(loadedData);
    }


    match.showMatchAction = function(id) {
        match.show(id);
    }

    match.show = function (id) {
        loadedData = JSON.parse(localStorage.getItem(id));

        showMatchInfoDialog(loadedData);
    }


    match.sendMatchAction = function(id) {
        loadedData = JSON.parse(localStorage.getItem(id));

        sendToServerDialog(loadedData);
    }

    match.deleteMatchAction = function(id) {
        localStorage.removeItem(id);

        manageMatchesDialog(match.getCollection());
    }

    newMatchDialog = function () {
        $('#datetimepicker1').datetimepicker({
            format: _setting.format.datetime,
            locale: moment.locale(),
            icons:{
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-caret-up',
                down: 'fa fa-caret-down',
                previous: 'fa fa-caret-left',
                next: 'fa fa-caret-right',
                today: 'fa fa-calendar-check-o',
                clear: 'fa fa-trash',
                close: 'fa fa-close',
            },
            sideBySide: true,
        });

        $(_ids.dialog.new_match).modal('show');

        $(_ids.dialog.new_match + ' button.submit-action').off("click").click(function(){
            init();

            $(_ids.goal_dialog).modal('hide');
        });

        init = function () {
            timestamp = moment($('#newMatchTime').val(), _setting.format.datetime).unix()*1000
                + moment().milliseconds();

            $config = {
                teams: {
                    home: {side:'home', name: $('#newMatchTeamHomeName').val()},
                    host: {side:'host', name: $('#newMatchTeamHostName').val()},
                },
                matchTime: timestamp,
            };
            $(_ids.dialog.new_match).modal('hide');

            match.init($config);
        }
    }

    manageMatchesDialog = function (collectionList) {
        matchHtml = '';

        for(cID in collectionList) {
            _m = JSON.parse(collectionList[cID]);
            matchHtml = matchHtml + '<div class="match-row row" data-match-id="' + cID + '">' +
                '<div class="col-xs-12 col-md-8 match-title">' + _m.teams.home.name + ' vs ' + _m.teams.host.name + '</div>' +
                '<div class="col-xs-12 col-md-4 match-subtitle">' + moment(_m.matchTime).format('DoMMM \'YY H:m') + '</div>' +
                '<div class="col-xs-12 match-action">' +
                '   <span class="btn btn-primary col-xs-6 col-md-3" data-action="loadMatchAction" >pokracovat</span>' +
                '   <span class="btn btn-warning col-xs-6 col-md-3" data-action="deleteMatchAction" >smazat</span>' +
                '   <span class="btn btn-default col-xs-6 col-md-3" data-action="showMatchAction" >zobrazit</span>' +
                '   <span class="btn btn-default col-xs-6 col-md-3" data-action="sendMatchAction" >odeslat</span>' +
                '</div>' +
            '</div>';
        }

        $(_ids.dialog.match_list +' div.match-collection').html(matchHtml);

        $(_ids.dialog.match_list +' div.match-row span.btn[data-action]').each(function () {

            $(this).click(function(){
                match[$(this).data('action')]($(this).closest('div.match-row').data('match-id'));
                $(_ids.dialog.match_list).modal('hide');

            });

        });

        $(_ids.dialog.match_list).modal('show');
    }


    showMatchInfoDialog = function (data) {
        if(typeof data.teams == 'undefined') return;

        _hideAllModals();

        $(_ids.dialog.match_info +' div.match-collection').html(matchHtml);

        // add team list for modal
        teamHtml =
        '<div class="row list info">' +
        '   <div class="col-xs-3">Nazev</div>' +
        '   <div class="col-xs-2">Strana</div>' +
        '   <div class="col-xs-1">Skore</div>' +
        '</div>';
        $.each(data.teams, function (i, _t) {
            teamHtml = teamHtml +
                '<div class="row list info team-' + _t.side + '">' +
                '   <div class="col-xs-3">' + _t.name + '</div>' +
                '   <div class="col-xs-2">' + _t.side + '</div>' +
                '   <div class="col-xs-1">' + data.score[_t.side] + '</div>' +
                '</div>';
        });

        teamHtml = '<div class="container">' + teamHtml + '</div>';
        $(_ids.dialog.match_info +' div.teams div.infoData').html(teamHtml);

        // add player list for modal
        playerHome = playerHost ='';
        playerHtml =
            '<div class="row player info">' +
            '   <div class="col-xs-1">#/div>' +
            '   <div class="col-xs-3">Jmeno</div>' +
            '   <div class="col-xs-2">Team</div>' +
            '</div>';
        $.each(data.players, function (i, _p) {
                if (_p.team != 'undefined' && _p.team == 'home'){
                    playerHome = playerHome +
                        '<div class="row player info team-' + _p.team + '">' +
                        '   <div class="col-xs-1">' + _p.no + '</div>' +
                        '   <div class="col-xs-3">' + _p.name + '</div>' +
                        '   <div class="col-xs-2">' + _p.team + '</div>' +
                        '</div>';
                } else if (_p.team != 'undefined' && _p.team == 'host'){
                    playerHost = playerHost +
                        '<div class="row list player team-' + _p.team + '">' +
                        '   <div class="col-xs-1">' + _p.no + '</div>' +
                        '   <div class="col-xs-3">' + _p.name + '</div>' +
                        '   <div class="col-xs-2">' + _p.team + '</div>' +
                        '</div>';
                }

            }
        );
        playerHtml = '<div class="container">' + playerHome + '</div> <div class="container">' + playerHost + '</div>';
        $(_ids.dialog.match_info +' div.players div.infoData').html(playerHtml);

        // add goal list
        assistHtml = '';
        goalHtml =
            '<div class="row list goal">' +
            '   <div class="col-xs-3">Cas</div>' +
            '   <div class="col-xs-2">Team</div>' +
            '   <div class="col-xs-3">Autor</div>' +
            '   <div class="col-xs-4">Assistence</div>' +
            '</div>';
        $.each(data.goals, function (i, _g) {
            var a = 0;
            assistHtml = '';
            $.each(_g.assists, function (i, _p) {
                if(a > 0) assistHtml = assistHtml + ' + ';
                assistHtml = assistHtml + '<span class="player">#'+ _p.no + ' - ' + _p.name + '</span>';
                a++;
            });

            goalTime = _getHumanTimeDiff(data.matchTime, _g.time);
            goalHtml = goalHtml +
                '<div class="row list goal team-' + _g.team + '">' +
                '   <div class="col-xs-3">' + goalTime + '</div>' +
                '   <div class="col-xs-2">' + _g.team + '</div>' +
                '   <div class="col-xs-3"><span class="player">#'+ _g.author.no + ' - ' + _g.author.name + '</span></div>' +
                '   <div class="col-xs-4">' + assistHtml + '</div>' +
                '</div>';
        });

        goalHtml = '<div class="container">' + goalHtml + '</div>';
        $(_ids.dialog.match_info +' div.goals div.infoData').html(goalHtml);

        $(_ids.dialog.match_info).modal('show');

    }


    managePlayersDialog = function (playerList) {
        playerHtml = '';

        for(pID in playerList) {
            _p = playerList[pID];

            playerHtml = playerHtml +
                '<div class="player-row team-' + _p.team + ' row" data-player-id="' + pID + '">' +
                '   <span class="col-xs-1 player-cell-no">' + _p.no + '</span>' +
                '   <span class="col-xs-6 col-md-4 player-cell-name">' + _p.name + '</span>' +
                '   <span class="col-xs-4 col-md-3 player-cell-team">' + _data.teams[_p.team].name + '</span>' +
                '   <span class="col-xs-6 col-md-2 btn btn-primary" data-action="editPlayerAction" >upravit</span>';
            if(match.getPlayerGoalsCount(_p.id) == 0) {
                playerHtml = playerHtml + '   <span class="col-xs-6 col-md-2 btn btn-warning" data-action="deletePlayerAction" >smazat</span>';
            }

            playerHtml = playerHtml + '</div>';
        }

        $(_ids.dialog.player_list +' div.player-collection').html(playerHtml);

        $(_ids.dialog.player_list +' div.player-row span.btn[data-action]').each(function () {
            $(this).click(function(){
                match[$(this).data('action')]($(this).closest('div.player-row').data('player-id'), _data.matchId);
                $(_ids.dialog.player_list).modal('hide');

            });
        });



        $(_ids.dialog.player_list + ' button.new-action').off("click").click(function(){
            match.newPlayerAction(match.getMatchId());

            $(_ids.dialog.player_list).modal('hide');
        });

        $(_ids.dialog.player_list).modal('show');
    }

    match.editPlayerAction = function(playerId, matchId) {
        editPlayerDialog(playerId, matchId);
    };

    match.newPlayerAction = function() {
        matchId = match.getMatchId();

        editPlayerDialog(null, matchId);
    }

    editPlayerDialog = function ($playerId, $matchId) {

        teamSelectHtml = '';

        for(side in _data.teams) {
            _t = _data.teams[side];
            teamSelectHtml = teamSelectHtml + '<option value=' + _t.side + '>' + _t.name + '</option>';
        }

        $(_ids.dialog.player_edit + ' div.team-selector select').html(teamSelectHtml);

        if($playerId) {
            _p = match.getPlayer($playerId);
            $(_ids.dialog.player_edit + 'div.modal-body input[name="id"]').val($playerId);
            $(_ids.dialog.player_edit + 'div.modal-body input[name="no"]').val(_p.no);
            $(_ids.dialog.player_edit + 'div.modal-body input[name="name"]').val(_p.name);
            $(_ids.dialog.player_edit + 'div.modal-body select[name="team"]').val(_p.side);

            $(_ids.dialog.player_edit + 'div.modal-body input[name="id"]').prop('disabled', true);
            $(_ids.dialog.player_edit + 'button.create-action').hide();
            $(_ids.dialog.player_edit + 'button.edit-action').show();

            goals = match.getPlayerGoals($playerId);
            if(goals.length > 0) {
                $(_ids.dialog.player_edit + 'button.delete-action').hide();
            } else {
                $(_ids.dialog.player_edit + 'button.delete-action').show();
            }
        } else {
            $(_ids.dialog.player_edit + 'div.modal-body input[name="id"]').val("");
            $(_ids.dialog.player_edit + 'div.modal-body input[name="no"]').val("");
            $(_ids.dialog.player_edit + 'div.modal-body input[name="name"]').val("");
            $(_ids.dialog.player_edit + 'div.modal-body select[name="team"]').val("");
            $(_ids.dialog.player_edit + 'div.modal-body input[name="id"]').prop('disabled', false);

            $(_ids.dialog.player_edit + 'button.create-action').show();
            $(_ids.dialog.player_edit + 'button.delete-action').hide();
            $(_ids.dialog.player_edit + 'button.edit-action').hide();
        }

        $(_ids.dialog.player_edit + 'button.edit-action').off("click").click(function(){
            playerData = {
                id: $playerId || $(_ids.dialog.player_edit + 'div.modal-body input[name="id"]').val(),
                no: $(_ids.dialog.player_edit + 'div.modal-body input[name="no"]').val(),
                name: $(_ids.dialog.player_edit + 'div.modal-body input[name="name"]').val(),
                team: $(_ids.dialog.player_edit + 'div.modal-body select[name="team"]').val(),
            };

            save(playerData);

            $(_ids.dialog.player_edit).modal('hide');
        });


        $(_ids.dialog.player_edit + 'button.create-action').off("click").click(function(){
            newId = getNewTempId();
            formPlayerId = $(_ids.dialog.player_edit + 'div.modal-body input[name="id"]').val()
            playerData = {
                id: formPlayerId || newId,
                no: $(_ids.dialog.player_edit + 'div.modal-body input[name="no"]').val(),
                name: $(_ids.dialog.player_edit + 'div.modal-body input[name="name"]').val(),
                team: $(_ids.dialog.player_edit + 'div.modal-body select[name="team"]').val(),
            };

            save(playerData);

            $(_ids.dialog.player_edit).modal('hide');
        });


        $(_ids.dialog.player_edit + 'button.delete-action').off("click").click(function(){
            match.deletePlayerAction($playerId, $matchId);

            $(_ids.dialog.player_edit).modal('hide');
        });

        $(_ids.dialog.player_edit).modal('show');



        save = function(player) {
            if(typeof player.id == 'undefined' || player.id == '') {
                return false;
            }

            _data.players[player.id] = player;

            match.saveLocal();
        }

        getNewTempId = function() {
            var randId = Math.floor((Math.random() * 1000) + 1) + 1000;

            newId  = 'temp-' + randId;
            used =  match.getPlayer(newId);
            if(typeof used.id != 'undefined') {
                newId = getNewTempId();
            }

            return newId;
        }
    }


    match.deletePlayerAction = function(playerId, $matchId) {
        if(typeof $matchId == 'undefined' || $matchId == _data.matchId){
            delete _data.players[playerId];

            //playerCollection = _data.players;
        }

        if(typeof $matchId != 'undefined') {
            _m = JSON.parse(localStorage.getItem('match-' + matchId));

            delete _m.players[playerId];

            localStorage.setItem(matchId, _m);

            //playerCollection = _m.players;
        }

        _hideAllModals();

            //managePlayersDialog(playerCollection);
    }


    function _hideAllModals() {
        $('div.modal-dialog').each(function () {
            $(this).parent('div.modal').modal('hide');
        })
    }

    function _getMatchMinSec($time) {
        if(!$time) return '???';

        var actionTime = $time
        var gameStart = _data.matchTime;

        ms = _getHumanTimeDiff(gameStart, actionTime);
        return ms;
    }


    function _getHumanTimeDiff($time1, $time2) {
        if(typeof $time2 != 'undefined') {
            diff = $time2 - $time1;
        } else {
            diff = $time1 || 0;
        }

        diff = diff/1000;

        sec = Math.floor(diff%60);
        min = Math.floor(diff/60);

        if(sec<10) sec= '0'+sec;
        var timeDiff = min + ':' + sec;

        return timeDiff;
    }


    match.getData = function () {
        return _data;
    }

    match.getMatchId = function () {
        matchId = _data.matchId || _data.matchTime;
        return matchId;
    }

    match.saveLocal = function($data) {
        var _data = $data || match.getData();
        var _matchId = _data.matchId;


        localStorage.setItem('match-' + _matchId, JSON.stringify(_data) );
    }



    match.addTeam = function ($side, $name) {
        _data.teams[$side] = {side: $side, name: $name};
    }


    match.getTeam = function($teamId) {
        if($teamId in match.getTeams()) {
            return _data.teams[$teamId];
        }

        return false;
    }


    match.getTeams = function () {
        return _data.teams;
    }


    match.addPlayer = function ($id, $no, $name, $team) {
        _data.players[$id] = {id: $id, no: $no, name: $name, team: $team};
    }


    match.getPlayer = function($playerId) {
        if($playerId in match.getPlayers()) {
            return _data.players[$playerId];
        }

        return false;
    }


    match.getPlayers = function () {
        return _data.players;
    }

    match.addGoal = function(_g) {
        _data.goals[_g.getTime()] = _g.getData();
        teamScore = match.getScore(_g.getTeam()) + 1;

        _setScore(_g.getTeam(), teamScore);

        match.saveLocal();
    }


    match.addGoalAction = function($team) {
        addGoalDialog($team);
    }


    addGoalDialog = function($team, $player, $assists) {
        var _g = new goal();

        $( _ids.goal_dialog ).modal();
        $('#goal-dialog button.submit-action').removeClass('all-set');

        goalTime = _getMatchMinSec(_g.getTime());
        $(_ids.goal_dialog + ' .modal-title').html('Pridat gol v case: ' + goalTime);
        $('#headingTeam a').html('Team');
        $('#headingPlayer a').html('Autor');
        $('#headingAssists a').html('Asistence');
        $('#goal-dialog button.submit-action').hide();

        // add team list for modal
        teamHtml = '';
        $.each(match.getTeams(), function (i, _t) {
            teamHtml = teamHtml +
                '<p type="button" class="add-goal button-team team-' + _t.side +
                ' btn" data-team-side="' + _t.side + '">' +
                '<span>' + _t.name + '</span></p>';
        });
        $('#collapseTeam>div.panel-body').html(teamHtml);

        // add player list for modal
        playerHtml = playerHome = playerHost ='';
        $.each(match.getPlayers(), function (i, _p) {
                if (_p.team != 'undefined' && _p.team == 'home'){
                    playerHome = playerHome + '<p class="add-goal button-player author btn team-home" ' +
                        'data-player-id="' + _p.id + '" ><span class="no"><span class="sharp">#</span>' + _p.no + '</span>' +
                        '<span class="name">' + _p.name + '</span></p>';
                } else if (_p.team != 'undefined' && _p.team == 'host'){
                    playerHost = playerHost + '<p class="add-goal button-player author btn team-host" ' +
                        'data-player-id="' + _p.id + '" ><span class="no"><span class="sharp">#</span>' + _p.no + '</span>' +
                        '<span class="name">' + _p.name + '</span></p>';
                }

            }
        );
        playerHtml = '<div id="home-team-players">' + playerHome + '</div> <div id="host-team-players">' + playerHost + '</div>';
        $('#collapsePlayer>div.panel-body').html(playerHtml);

        // add assist list for modal
        assistHtml = assistHome = assistHost ='';
        $.each(match.getPlayers(), function (i, _p) {
                if (_p.team != 'undefined' && _p.team == 'home'){
                    assistHome = assistHome + '<p class="add-goal button-player assist btn team-home" ' +
                        'data-assist-id="' + _p.id + '" ><span class="no"><span class="sharp">#</span>' + _p.no + '</span>' +
                        '<span class="name">' + _p.name + '</span></p>';
                } else if (_p.team != 'undefined' && _p.team == 'host'){
                    assistHost = assistHost + '<p class="add-goal button-player assist btn team-host" ' +
                        'data-assist-id="' + _p.id + '" ><span class="no"><span class="sharp">#</span>' + _p.no + '</span>' +
                        '<span class="name">' + _p.name + '</span></p>';
                }

                assistHtml = '<div id="home-team-assists">' + assistHome + '</div> <div id="host-team-assists">' + assistHost + '</div>';
            }
        );
        $('#collapseAssist>div.panel-body').html(assistHtml);

        $(_ids.goal_dialog).modal('show');
        /*$(_ids.goal_dialog).addClass('in');*/


        if(typeof $team == 'undefined') {
            $('a[aria-controls="collapseTeam"]').click();
        }

        $('#goal-dialog p.add-goal.button-team').off("click").click(function(){
            var team = $(this).data('team-side');
            setTeam(team);
        });

        $('#goal-dialog p.add-goal.button-player.author').off("click").click(function(){
            var id = $(this).data('player-id');
            setAuthor(id);
        });

        $('#goal-dialog p.add-goal.button-player.assist').off("click").click(function(){
            var id = $(this).data('assist-id');
            addAssist(id);
        });

        $('#goal-dialog button.cancel-action').off("click").click(function(){
            cancel();
        });

        $('#goal-dialog button.submit-action').off("click").click(function(){
            save();

            $(_ids.goal_dialog).modal('hide');
        });


        setTeam = function($team){
            _t = match.getTeam($team);

            if(_g.getTeam() != $team){
                // TODO: reset players on switch team ?
                _g.reset();
                $('#headingPlayer a').html('Autor');
                $('#headingAssists a').html('Asistence');
                $('p.add-goal.button-player').show();
            }


            $('#headingTeam a').html('Team: ' + _t.name);

            $("p.add-goal.button-player").each(function(){
                $(this).removeClass('team-selected').hide();
            });
            $("p.add-goal.button-player.team-"+_t.side).each(function(){
                $(this).addClass('team-selected').show();
            });

            _g.setTeam(_t.side);

            if(!$('#collapsePlayer').hasClass('in')){
                $('a[aria-controls="collapsePlayer"]').click();
            }
        }

        setAuthor = function ($id) {
            if(typeof _g.getAuthor().id != 'undefined') {
                unsetAssist();
            }

            player = match.getPlayer($id);
            _g.setAuthor(player);
            $('#headingPlayer a').html('Autor: ' + player.no + ' - ' + player.name);

            removeAssist($id);
            $('p.button-player.assist[data-assist-id="' + player.id + '"]').hide();


            $('#goal-dialog button.submit-action').show();
            $('a[aria-controls="collapseAssist"]').click();
        }

        addAssist = function ($id) {
            player = match.getPlayer($id);
            if(!_g.addAssist(player)){
                $('a[aria-controls="collapseAssist"]').click();

                return;
            }

            $('p.button-player.assist[data-assist-id="' + player.id + '"]').hide();

            this.updateAssistsTitle();

            if(_g.getAssistCount() >= 2) {
                $('a[aria-controls="collapseAssist"]').click();
                $('#goal-dialog button.submit-action').addClass('all-set');
            }

            $('#goal-dialog span.remove-assist-link').click(function(){
                var id = $(this).data('assist-id');
                removeAssist(id);
            });
        }

        removeAssist = function ($id) {
            _g.removeAssist($id);

            this.updateAssistsTitle();
            $('p.button-player.assist[data-assist-id="' + player.id + '"]').show();
        }

        unsetAssist = function() {
            _g.unsetAssists();

            $('p.button-player.assist').each(function () {
                $(this).show();
            });
        }

        cancel = function () {
// TODO: check this works !!!
            _g = undefined;

        }

        save = function () {
            match.addGoal(_g);
        }

        this.updateAssistsTitle = function () {
            var a = 0;
            var title = 'Asistence: ';
            $.each(_g.getAssists(), function (i, _p) {
                if(a > 0) title = title + ' + ';
                title = title + '<span class="remove-assist-link" data-assist-id="'+ _p.id + '">'+ _p.no + ' - ' + _p.name + '</span>';
                a++;
            });

            $('#headingAssists a').html(title);
        }


        if(typeof $team != 'undefined') {
            setTeam($team);
        }
    }

    match.getPlayerGoals = function (playerId) {
        var playerGoals = [];
        for(gID in _data.goals) {
            _g = _data.goals[gID];
            if(playerId == _g.author.id){
                playerGoals.push(_g);
            }
        }

        return playerGoals;
    }

    match.getPlayerGoalsCount = function (playerId) {
        playerGoals = match.getPlayerGoals(playerId);

        return playerGoals.length;
    }

    match.sendCurrentMatchToServerAction = function () {
        sendToServerDialog(match.getData());
    }

    sendToServerDialog = function ($data) {
        var url = $data.api.sendMatchDataUrl;
        $(_ids.dialog.match_data_send + 'div.modal-body input[name="api_url"]').val(url);

        $(_ids.dialog.match_data_send + ' button.send-action').off("click").click(function(){
            apiUrl = $(_ids.dialog.match_data_send + 'div.modal-body input[name="api_url"]').val();

            $data.api.sendMatchDataUrl = apiUrl;
            match.saveLocal($data);

            params = {
                url: apiUrl,
            }

            _sendDataToServer($data, params);
        });

        $(_ids.dialog.match_data_send).modal('show');
    }

    function _sendDataToServer(data, $params) {
        if(typeof $params.url == 'undefined') {
            alert('ERROR in given parameters, server URL not set!');
            return;
        }

        var origSendButton = $(_ids.dialog.match_data_send + 'div.modal-footer button.send-action').html();
        sendingButtonHtml = '<i class="fa fa-spinner fa-spin"></i> Sending data ...';
        $(_ids.dialog.match_data_send + 'div.modal-footer button.send-action').html(sendingButtonHtml).prop('disabled', true);

        var _dj = JSON.stringify(data);
        $.ajax({
            type: "POST",
            url: $params.url,
            data: {data:_dj},
            dataType: 'json',
            error: function(xhr, status, error){
                alert(status + ' - ' + error);
            },
            complete: function(){
                $(_ids.dialog.match_data_send + 'div.modal-footer button.send-action').html(origSendButton).prop('disabled', false);;
            },
        });
    }

    function _initScoreBoard() {
        _setScore('home', _data.score.home);
        _setScore('host', _data.score.host);

    }

    function _setScore($team, value) {
        scoreIds = _ids.score;
        el = scoreIds[$team];

        _data.score[$team] = value;
        $(el).html(value);
    }


    function addGoalToScoreBoard($team){
        score = match.getScore($team);
        score++;

        _setScore($team, score);

        return true;
    }

    match.getScore =function ($team) {
        score = _data.score[$team] || false;

        if(!score) {
            console.log('ERROR UNKNOWN TEAM ' + $team);
            score = 0;
        }

        return score;
    }

    function _initButtons(){
        $('#flip-score-button').click(function() {
            $('#scoreboard div.score').toggleClass('flipped');
        });


        $(_ids.flip_score_button).click(function () {
            $(_ids.score.wrapper).toggleClass('flipped')
        });
    }


}( window.match = window.match || {}, jQuery ));



function goal()
{
    var _now = (moment().unix()*1000 + moment().milliseconds());
    var _data = {
        time: _now,
        team: '',
        author: '',
        assists: {},
    };

    this.getData =function () {
        return _data;
    }

    this.reset = function () {
        this.unsetTeam();
        this.unsetAuthor();
        this.unsetAssists();
    }

    this.getTime = function () {
        return _data.time;
    }

    this.getTeam = function () {
        return _data.team;
    }

    this.unsetTeam = function () {
        _data.team = ''
    }

    this.setTeam = function ($team) {
        _data.team = $team;

        return this;
    }

    this.getAuthor = function () {
        return _data.author;
    }

    this.setAuthor = function($player) {
        _data.author = $player;
    }

    this.unsetAuthor = function () {
        _data.author = '';
    }


    this.getAssists = function () {
        return _data.assists;
    }

    this.getAssistCount = function () {
        var assistCount = 0;
        $.each(_data.assists, function () {
            assistCount++;
        })

        return assistCount;
    }

    this.addAssist = function ($player) {
        assistCount = this.getAssistCount();

        if($player == this.getAuthor()) {
            console.log("Can't set assist for same player as goal.");
            return false;
        } else if(assistCount >= 2) {
            console.log("Already 2 assistance selected.");
            return false;
        } else if($player in _data.assists) {
            console.log('Player ' + $player + ' already in assist list.');
            return false;
        }

        _data.assists[$player.id] = $player;

        return true;
    }

    this.removeAssist = function($playerId) {
        delete _data.assists[$playerId];
    }

    this.unsetAssists = function () {
        _data.assists = {};
    }
}
