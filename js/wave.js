function participant2user(participant) {
    return new User(participant.getId(), participant.getDisplayName(), participant.getThumbnailUrl());
}

function state2variants(state) {
    var value = state.get('variants');
    if (!value) {
        return [];
    }
    return gadgets.json.parse(value);
}

function variants2state(variants) {
    return {variants: gadgets.json.stringify(variants)};
}

function onNewVariant(name) {
    var state = wave.getState();
    var variants = state2variants(state);
    variants.push({
        id: variants.length,
        name: name
    });
    state.submitDelta(variants2state(variants));
}

function state2votes(state) {
    var keys = state.getKeys();
    var votes = {};
    for (var i in keys) {
        var key = keys[i];
        if (key.slice(0, 6) != 'votes_') {
            continue;
        }
        var userId = key.slice(6);
        var user = participant2user(wave.getParticipantById(userId));
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
}

function votes2state(id, variants) {
    var delta = {};
    delta['votes_' + id] = gadgets.json.stringify(variants);
    return delta;
}

function onVote(id, variants) {
    var state = wave.getState();
    state.submitDelta(votes2state(id, variants));
}

gadgets.util.registerOnLoadHandler(function() {
    var viewer = participant2user(wave.getViewer());
    var poll = new Poll(viewer, onNewVariant, onVote);
    wave.setStateCallback(function() {
        var state = wave.getState();
        poll.updateState({
            variants: state2variants(state),
            votes: state2votes(state)
        });
    });
    wave.setParticipantCallback(function() {
        poll.updateUsers();
    });
    poll.init();
});
