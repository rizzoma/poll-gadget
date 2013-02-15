var Poll = function(viewer, callbacks) {
    this._viewer = viewer;
    this._variants = [];
    this._positions = [];
    this._nodes = {
        poll: $('#poll'),
        add: $('#add-variant')
    };
    this._callbacks = callbacks;
    this._initOptions();
};

Poll.prototype.MODES = {
    SINGLE: 0,
    MULTI: 1
};

Poll.prototype._initOptions = function() {
    this._options = new Options({
        onChange: this._callbacks.onOptions,
        onResize: this._callbacks.onResize
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

Poll.prototype._getVariantPosition = function(variant) {
    return $.inArray(variant.getId(), this._positions);
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

Poll.prototype.hasUnknownUsers = function() {
    for (var i in this._variants) {
        var variant = this._variants[i];
        if (variant.hasUnknownUsers()) {
            return true;
        }
    }
    return false;
};

Poll.prototype._getPreparedName = function(name) {
    return $.trim(name);
};

Poll.prototype._getUpdatedVariants = function(name) {
    var updated = [];
    for (var i in this._variants) {
        var variant = this._variants[i];
        updated.push({
            id: variant.getId(),
            name: variant.getName(),
            position: this._getVariantPosition(variant)
        });
    }
    if (name) {
        updated.push({
            id: (new Date()).getTime(),
            name: name,
            position: this._positions.length
        });
    }
    return updated;
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

Poll.prototype._addSubmitListener = function() {
    this._nodes.add.submit($.proxy(function(event) {
        var text = $(event.target).find(':text');
        var name = this._getPreparedName(text.val());
        if (name && !this._isVariantExist(name)) {
            var variants = this._getUpdatedVariants(name);
            this._callbacks.onVariant(variants);
        }
        text.focus();
        text.select();
        return false;
    }, this));
};

Poll.prototype.init = function() {
    this._addSubmitListener();
    for (var i in this._nodes) {
        this._nodes[i].show();
    }
};

Poll.prototype._addVariant = function(id, name, position) {
    var isExclusive = this._options.isSingleVariantVoting();
    var allowMove = this._options.getSortingOrder() == this._options.SORTING.NONE;
    var variant = new Variant(id, name, isExclusive, {
        onEdit: $.proxy(function(raw) {
            var name = this._getPreparedName(raw);
            if (name && !this._isVariantExist(name)) {
                variant.setName(name);
            } else {
                variant.setName(variant.getName());
            }
            var variants = this._getUpdatedVariants();
            this._callbacks.onVariant(variants);
        }, this),
        onVote: $.proxy(function() {
            var mode = this._options.isSingleVariantVoting() ? this.MODES.SINGLE : this.MODES.MULTI;
            var votes = this._getUpdatedVotes();
            this._callbacks.onVote(mode, votes);
        }, this),
        onMove: allowMove ? $.proxy(function(delta) {
            var position = this._getVariantPosition(variant);
            var newPosition = position + delta;
            if (newPosition < 0 || newPosition >= this._positions.length) {
                return;
            }
            this._positions[position] = this._positions[newPosition];
            this._positions[newPosition] = id;
            var variants = this._getUpdatedVariants();
            this._callbacks.onVariant(variants);
        }, this) : null,
        onRemove: $.proxy(function() {
            this._removeVariant(id);
            var variants = this._getUpdatedVariants();
            this._callbacks.onVariant(variants);
        }, this)
    });
    this._variants.push(variant);
    this._positions[position] = id;
    this._nodes.poll.append(variant.getNode());
};

Poll.prototype._removeVariant = function(id) {
    var variant = this._getVariantById(id);
    variant.getNode().remove();
    var position = $.inArray(id, this._positions);
    this._positions.splice(position, 1);
    for (var i in this._variants) {
        if (this._variants[i].getId() == id) {
            this._variants.splice(i, 1);
            break;
        }
    }
};

Poll.prototype._updateOptions = function(options) {
    this._options.update(options);
};

Poll.prototype._updateVariants = function(variants) {
    while (this._variants.length) {
        var variant = this._variants[0];
        this._removeVariant(variant.getId());
    }
    for (var i in variants) {
        var variant = variants[i];
        this._addVariant(variant.id, variant.name, variant.position);
    }
};

Poll.prototype._updateVotes = function(votes) {
    var getUsers = function(mode, id) {
        if (!(mode in votes)) {
            return [];
        }
        if (!(id in votes[mode])) {
            return [];
        }
        return votes[mode][id];
    };
    var viewerId = this._viewer.getId();
    var hasVotes = $.proxy(function(id) {
        for (var i in this.MODES) {
            var users = getUsers(this.MODES[i], id);
            for (var j in users) {
                if (users[j].getId() != viewerId) {
                    return true;
                }
            }
        }
        return false;
    }, this);
    var mode = this._options.isSingleVariantVoting() ? this.MODES.SINGLE : this.MODES.MULTI;
    for (var i in this._variants) {
        var variant = this._variants[i];
        var variantId = variant.getId();
        if (hasVotes(variantId)) {
            variant.setHasVotes();
        }
        var users = getUsers(mode, variantId);
        for (var j in users) {
            var user = users[j];
            variant.addUser(user, user.getId() == viewerId);
        }
    }
};

Poll.prototype._getSortFunction = function() {
    var order = this._options.getSortingOrder();
    if (order == this._options.SORTING.NONE) {
        return $.proxy(function(a, b) {
            return this._getVariantPosition(a) > this._getVariantPosition(b) ? 1 : -1;
        }, this);
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
    return null;
};

Poll.prototype._sortVariants = function() {
    var func = this._getSortFunction();
    this._variants.sort(func);
    for (var i in this._variants) {
        var variant = this._variants[i];
        this._nodes.poll.append(variant.getNode());
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
    this._callbacks.onResize();
};
