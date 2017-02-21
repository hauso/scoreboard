/**
 * Scoreboard JS
 *
 * @author Tomas Domanik
 *
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
        'goal_dialog': '#goal-dialog',
        'add_goal': 'input.add-goal',
        'flip_score_button' : '#flip-score-button',
    }

    var _data = { // private
        matchId: false,
        matchTime: Date.now(),
        parent: null,
        teams: {},
        players: {},
        score: {home: 0, host: 0},
        goals: {},
        events: {},
    }




    match.init = function($config) {
        _initScoreBoard();
        _initButtons();

        var config = $config || {};

        if(typeof config.matchId != 'undefined') {

        }

        // add teams from config
        if(typeof config.teams != 'undefined') {
            $.each(config.teams, function (teamId, _t) {
                match.addTeam(_t.side, _t.name);

                el = _ids.score.teams + '.' + _t.side;
                $(el).click(function(){
                    match.addGoalAction(teamId);
                });
            });
        }

        // add players from config
        if(typeof config.players != 'undefined') {
            $.each(config.players, function (i, _p) {
                match.addPlayer(_p.id, _p.no, _p.name, _p.team);
            });
        }

    }

    match.getData = function () {
        return _data;
    }

    match.getMatchId = function () {
        matchId = _data.matchId || _data.matchTime;
        return matchId;
    }

    match.saveLocal =function()
    {
        localStorage.setItem('match-' + match.getMatchId(), JSON.stringify(match.getData()));
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

        $(_ids.goal_dialog + ' .modal-title').html('Pridat gol ' + moment(_g.getTime()).format('h:mm:ss D. MMM.'));
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

        /* jQuery dialog */
        /*
         $( _ids.goal_dialog ).dialog({
         modal: true,
         buttons: [
         {
         text: "Zrusit",
         click: function() {
         alert('Gol nebyl ulozen !');
         $(  _ids.goal_dialog ).dialog( "close" );
         }
         },
         {
         text: "Ulozit",
         click: function() {
         addGoalToScoreBoard('home');

         $(  _ids.goal_dialog ).dialog( "close" );
         }
         }
         ]
         });
         */

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

            $("p.add-goal.button-player").each(function(){$(this).removeClass('team-selected')});

            if($team == 'home') {
                $("#host-team-players").insertAfter("#home-team-players");
                $("#host-team-assists").insertAfter("#home-team-assists");
            } else if($team == 'host'){
                $("#home-team-players").insertAfter("#host-team-players");
                $("#home-team-assists").insertAfter("#host-team-assists");
            }

            $("p.add-goal.button-player.team-"+_t.side).each(function(){$(this).addClass('team-selected')});

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


    function _initScoreBoard() {
        console.log('init Scoreboard');
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
        console.log('addgoal ' + $team);
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
    var _now = Date.now();
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
