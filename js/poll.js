var Poll = function(viewer, onNewVariant, onVote) {
    this._users = null;
    this._viewer = viewer;
    this._variants = [];
    this._node = $('#poll');
    this._onNewVariant = onNewVariant;
    this._onVote = onVote;
};

Poll.prototype._getUserById = function(id) {
    for (var i in this._users) {
        var user = this._users[i];
        if (user.getId() == id) {
            return user;
        }
    }
    return null;
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
        var text = $(event.target).find(':text')
        var variant = text.val();
        if (!this._isVariantExist(variant)) {
            this._onNewVariant(variant);
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
    var variant = new Variant(id, name, $.proxy(function() {
        var voted = this._getVotedVariants();
        this._onVote(this._viewer.getId(), voted);
    }, this));
    this._variants.push(variant);
    this._node.append(variant.getNode());
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
    for (var variantId in votes) {
        var variant = this._getVariantById(variantId);
        var users = votes[variantId];
        for (var j in users) {
            var user = users[j];
            variant.addUser(user, user.getId() == this._viewer.getId());
        }
    }
};

Poll.prototype.updateState = function(state) {
    this._updateVariants(state.variants);
    this._updateVotes(state.votes);
};
