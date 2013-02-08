var Poll = function(viewer, callbacks) {
    this._viewer = viewer;
    this._variants = [];
    this._node = $('#poll');
    this._callbacks = callbacks;
    this._initOptions();
};

Poll.prototype.MODES = {
    SINGLE: 0,
    MULTI: 1
};

Poll.prototype._initOptions = function() {
    this._options = new Options({
        onChange: this._callbacks.onOptionsChange
    });
    this._options.init();
};

Poll.prototype._getVariantById = function(id) {
    for (var i in this._variants) {
        var variant = this._variants[i];
        if (variant.getId() == id) {
            return variant;
        }
    }
    return null;
};

Poll.prototype._isVariantExist = function(name) {
    for (var i in this._variants) {
        var variant = this._variants[i];
        if (variant.getName() == name) {
            return true;
        }
    }
    return false;
};

Poll.prototype._getUpdatedVariants = function(name) {
    var updated = [];
    for (var i in this._variants) {
        var variant = this._variants[i];
        updated.push({
            id: variant.getId(),
            name: variant.getName()
        });
    }
    updated.push({
        id: this._variants.length, 
        name: name
    });
    return updated;
};

Poll.prototype._addSubmitListener = function() {
    $('#add-variant').submit($.proxy(function(event) {
        var text = $(event.target).find(':text');
        var name = text.val().replace(/^\s+|\s+$/, '');
        if (name && !this._isVariantExist(name)) {
            var variants = this._getUpdatedVariants();
            this._callbacks.onVariant(variants);
        }
        text.focus();
        text.select();
        return false;
    }, this));
};

Poll.prototype.init = function() {
    this._addSubmitListener();
};

Poll.prototype._getUpdatedVotes = function() {
    var updated = {};
    var viewerId = this._viewer.getId();
    for (var i in this._variants) {
        var variant = this._variants[i];
        var userIds = variant.getUserIds();
        var position = $.inArray(viewerId, userIds);
        if (variant.hasVote()) {
            if (position == -1) {
                userIds.push(viewerId);
            }
        } else {
            if (position != -1) {
                userIds.splice(position, 1);
            }
        }
        var variantId = variant.getId();
        updated[variantId] = userIds;
    }
    return updated;
};

Poll.prototype._addVariant = function(id, name) {
    var variant = new Variant(id, name, {
        onVote: $.proxy(function() {
            var mode = this._options.isSingleVariantVoting() ? this.MODES.SINGLE : this.MODES.MULTI;
            var votes = this._getUpdatedVotes();
            this._callbacks.onVote(mode, votes);
        }, this)
    });
    var isExclusive = this._options.isSingleVariantVoting();
    variant.setExclusive(isExclusive);
    this._variants.push(variant);
    this._node.append(variant.getNode());
};

Poll.prototype._updateOptions = function(options) {
    this._options.update(options);
};

Poll.prototype._updateVariants = function(variants) {
    for (var i in this._variants) {
        this._variants[i].reset();
    }
    var isExclusive = this._options.isSingleVariantVoting();
    for (var i in variants) {
        var variant = variants[i];
        if (!this._isVariantExist(variant.name)) {
            this._addVariant(variant.id, variant.name);
        } else {
            this._getVariantById(variant.id).setExclusive(isExclusive);
        }
    }
};

Poll.prototype._updateVotes = function(votes) {
    var mode = this._options.isSingleVariantVoting() ? this.MODES.SINGLE : this.MODES.MULTI;
    var modeVotes = votes[mode] || {};
    for (var variantId in modeVotes) {
        var variant = this._getVariantById(variantId);
        var users = modeVotes[variantId];
        for (var j in users) {
            var user = users[j];
            variant.addUser(user, user.getId() == this._viewer.getId());
        }
    }
};

Poll.prototype._getSortFunction = function() {
    var order = this._options.getSortingOrder();
    if (order == this._options.SORTING.NONE) {
        return function(a, b) {
            return a.getId() > b.getId() ? 1 : -1;
        };
    }
    if (order == this._options.SORTING.BY_NAME) {
        return function(a, b) {
            return a.getName() > b.getName() ? 1 : -1;
        };
    }
    if (order == this._options.SORTING.BY_VOTE) {
        return function(a, b) {
            if (a.getVoteCount() == b.getVoteCount()) {
                return a.getName() > b.getName() ? 1 : -1;
            }
            return a.getVoteCount() > b.getVoteCount() ? -1 : 1;
        };
    }
};

Poll.prototype._sortVariants = function() {
    var func = this._getSortFunction();
    this._variants.sort(func);
    for (var i in this._variants) {
        var variant = this._variants[i];
        this._node.append(variant.getNode());
    }
};

Poll.prototype.updateState = function(state) {
    if (!state.options || !state.variants || !state.votes) {
        return;
    }
    this._updateOptions(state.options);
    this._updateVariants(state.variants);
    this._updateVotes(state.votes);
    this._sortVariants();
};
