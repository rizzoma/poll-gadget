var Converter = function() {
    
};

Converter.prototype._getUserById = function(id) {
    var participant = wave.getParticipantById(id);
    if (!participant) {
        return new User(id);
    }
    return this.participant2user(participant);
};

Converter.prototype._serialize = function(object) {
    return gadgets.json.stringify(object);
};

Converter.prototype._unserialize = function(string) {
    return gadgets.json.parse(string);
};

Converter.prototype.participant2user = function(participant) {
    var id = participant.getId();
    var name = participant.getDisplayName();
    var avatar = participant.getThumbnailUrl();
    return new User(id, name, avatar);
};

Converter.prototype.state2variants = function(state) {
    var value = state.get('variants');
    if (!value) {
        return [];
    }
    return this._unserialize(value);
};

Converter.prototype.variants2state = function(variants) {
    return {variants: this._serialize(variants)};
};

Converter.prototype.state2votes = function(state) {
    var keys = state.getKeys();
    var votes = {};
    for (var i in keys) {
        var key = keys[i];
        if (key.slice(0, 6) != 'votes|') {
            continue;
        }
        var parts = key.split('|');
        var mode = parts[1];
        var variantId = parts[2];
        var userIds = this._unserialize(state.get(key));
        for (var j in userIds) {
            var userId = userIds[j];
            var user = this._getUserById(userId);
            if (!(mode in votes)) {
                votes[mode] = {};
            }
            var modeVotes = votes[mode];
            if (!(variantId in modeVotes)) {
                modeVotes[variantId] = [];
            }
            modeVotes[variantId].push(user); 
        }
    }
    return votes;
};

Converter.prototype.votes2state = function(mode, votes) {
    var delta = {};
    for (var variantId in votes) {
        var key = 'votes|' + mode + '|' + variantId;
        delta[key] = this._serialize(votes[variantId]);
    }
    return delta;
};

Converter.prototype.state2options = function(state) {
    var value = state.get('options');
    if (!value) {
        return {};
    }
    return this._unserialize(value);
};

Converter.prototype.options2state = function(options) {
    return {options: this._serialize(options)};
};

var WaveConnector = function() {
    this._converter = new Converter();
    this._poll = null;
    this._needUpdateState = false;
};

WaveConnector.prototype._onVariant = function(variants) {
    var state = wave.getState();
    var delta = this._converter.variants2state(variants);
    state.submitDelta(delta);
};

WaveConnector.prototype._onVote = function(mode, votes) {
    var state = wave.getState();
    var delta = this._converter.votes2state(mode, votes);
    state.submitDelta(delta);
};

WaveConnector.prototype._onOptions = function(options) {
    var state = wave.getState();
    var delta = this._converter.options2state(options);
    state.submitDelta(delta);
};

WaveConnector.prototype._onParticipants = function() {
    if (!this._poll) {
        var participant = wave.getViewer();
        if (!participant) {
            return;
        }
        var viewer = this._converter.participant2user(participant);
        this._poll = new Poll(viewer, {
            onVariant: $.proxy(this._onVariant, this),
            onVote: $.proxy(this._onVote, this),
            onOptions: $.proxy(this._onOptions, this),
            onResize: function() {
                gadgets.window.adjustHeight();
            }
        });
        this._poll.init();
    }
    if (this._needUpdateState) {
        this._onState();
        this._needUpdateState = false;
    } else if (this._poll.hasUnknownUsers()) {
        this._onState();
    }
};

WaveConnector.prototype._onState = function() {
    if (!this._poll) {
        this._needUpdateState = true;
        return;
    }
    var state = wave.getState();
    this._poll.updateState({
        variants: this._converter.state2variants(state),
        votes: this._converter.state2votes(state),
        options: this._converter.state2options(state)
    });
};

WaveConnector.prototype.init = function() {
    gadgets.util.registerOnLoadHandler($.proxy(function() {
        wave.setParticipantCallback($.proxy(this._onParticipants, this));
        wave.setStateCallback($.proxy(this._onState, this));
    }, this));
};

var connector = new WaveConnector();
connector.init();
