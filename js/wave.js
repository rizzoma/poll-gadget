var Converter = function() {
    
};

Converter.prototype.participant2user = function (participant) {
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
    return gadgets.json.parse(value);
};

Converter.prototype.variants2state = function(variants) {
    return {variants: gadgets.json.stringify(variants)};
};

Converter.prototype.state2votes = function(state) {
    var keys = state.getKeys();
    var votes = {};
    for (var i in keys) {
        var key = keys[i];
        if (key.slice(0, 6) != 'votes_') {
            continue;
        }
        var userId = key.slice(6);
        var user = this.participant2user(wave.getParticipantById(userId));
        var variants = gadgets.json.parse(state.get(key));
        for (var j in variants) {
            var variant = variants[j];
            if (!(variant in votes)) {
                votes[variant] = [];
            }
            votes[variant].push(user); 
        }
    }
    return votes;
};

Converter.prototype.votes2state = function(id, variants) {
    var delta = {};
    delta['votes_' + id] = gadgets.json.stringify(variants);
    return delta;
};

var WaveConnector = function() {
    this._converter = new Converter();
};

WaveConnector.prototype._onNewVariant = function(name) {
    var state = wave.getState();
    var variants = this._converter.state2variants(state);
    variants.push({
        id: variants.length,
        name: name
    });
    state.submitDelta(this._converter.variants2state(variants));
};

WaveConnector.prototype._onVote = function(id, variants) {
    var state = wave.getState();
    state.submitDelta(this._converter.votes2state(id, variants));
};

WaveConnector.prototype._onLoad = function() {
    var viewer = this._converter.participant2user(wave.getViewer());
    var poll = new Poll(viewer, $.proxy(this._onNewVariant, this), $.proxy(this._onVote, this));
    wave.setStateCallback($.proxy(function() {
        var state = wave.getState();
        poll.updateState({
            variants: this._converter.state2variants(state),
            votes: this._converter.state2votes(state)
        });
    }, this));
    poll.init();
};

WaveConnector.prototype.init = function() {
    gadgets.util.registerOnLoadHandler($.proxy(this._onLoad, this));
};

var connector = new WaveConnector();
connector.init();
