var Poll = function(viewer, callbacks) {
    this._viewer = viewer;
    this._variants = [];
    this._node = $('#poll');
    this._callbacks = callbacks;
    this._initOptions();
};

Poll.prototype._initOptions = function() {
    this._options = new Options({
        onChange: this._callbacks.onOptionsChange,
        onUpdate: $.proxy(function(updated) {
            if ($.inArray('singleVariantVoting', updated) == -1) {
                return;
            }
            var isExclusive = this._options.isSingleVariantVoting();
            for (var i in this._variants) {
                var variant = this._variants[i];
                variant.setExclusive(isExclusive);
            }
        }, this)
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

Poll.prototype._addSubmitListener = function() {
    $('#add-variant').submit($.proxy(function(event) {
        var text = $(event.target).find(':text');
        var name = text.val().replace(/^\s+|\s+$/, '');
        if (name && !this._isVariantExist(name)) {
            this._callbacks.onNewVariant(this._variants.length, name);
        }
        text.focus();
        text.select();
        return false;
    }, this));
};

Poll.prototype.init = function() {
    this._addSubmitListener();
};

Poll.prototype._getVotedVariants = function() {
    var voted = [];
    for (var i in this._variants) {
        var variant = this._variants[i];
        if (variant.hasVote()) {
            voted.push(variant.getId());
        }
    }
    return voted;
};

Poll.prototype._addVariant = function(id, name) {
    var variant = new Variant(id, name, {
        onVote: $.proxy(function() {
            var voted = this._getVotedVariants();
            this._callbacks.onVote(this._viewer.getId(), voted, this._options.isSingleVariantVoting());
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
    if (!variants) {
        return;
    }
    for (var i in variants) {
        var variant = variants[i];
        if (!this._isVariantExist(variant.name)) {
            this._addVariant(variant.id, variant.name);
        }
    }
};

Poll.prototype._updateVotes = function(votes) {
    if (!votes) {
        return;
    }
    for (var i in this._variants) {
        this._variants[i].reset();
    }
    var mode = this._options.isSingleVariantVoting();
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

Poll.prototype.updateState = function(state) {
    this._updateOptions(state.options);
    this._updateVariants(state.variants);
    this._updateVotes(state.votes);
};
