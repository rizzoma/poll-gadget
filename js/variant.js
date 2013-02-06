var Variant = function(id, name, callbacks) {
    this._id = id;
    this._name = name;
    this._users = [];
    this._callbacks = callbacks;
    this._createNode();
};

Variant.prototype._addCheckedListener = function() {
    this._node.on('change', ':checkbox,:radio', $.proxy(function(event) {
        this._callbacks.onVote();
    }, this));
};

Variant.prototype._createNode = function() {
    this._node = $(
        '<div class="variant"> \
            <label class="variant-name-container"> \
                <input type="checkbox" name="variant"><span class="variant-name"></span> \
            </label> \
            <span class="voter_count"></span> \
            <span class="voters"></span> \
        </div>'
    );
    this._node.find('.variant-name').text(this._name);
    this._addCheckedListener();
};

Variant.prototype.getId = function() {
    return this._id;
};

Variant.prototype.getName = function() {
    return this._name;
};

Variant.prototype.getNode = function() {
    return this._node;
};

Variant.prototype.setExclusive = function(isExclusive) {
    var type = isExclusive ? 'radio' : 'checkbox';
    this._node.find(':checkbox,:radio').attr('type', type);
};

Variant.prototype.hasVote = function() {
    return this._node.find(':checkbox,:radio').is(':checked');
};

Variant.prototype._updateVoterCount = function() {
    var text = this._users.length ? '(' + this._users.length + ')' : '';
    this._node.find('.voter_count').text(text);
};

Variant.prototype.addUser = function(user, isCurrentUser) {
    this._users.push(user);
    var node = $('<span class="avatar user_' + user.getId() + '"></span>');
    var name = user.getName();
    if (name) {
        node.attr('title', name);
    }
    var avatar = user.getAvatar();
    if (avatar) {
        node.css('background-image', 'url(' + avatar + ')');
    }
    this._node.find('.voters').append(node);
    this._updateVoterCount();
    if (isCurrentUser) {
        this._node.addClass('voted');
        this._node.find(':checkbox,:radio').prop('checked', true);
    }
};

Variant.prototype.removeUser = function(userId) {
    if (!this.hasUser(userId)) {
        return;
    }
    for (var i in this._users) {
        if (this._users[i].getId() == userId) {
            this._users.splice(i, 1);
            break;
        }
    }
    this._node.find('.voters .user_' + userId).remove();
    this._updateVoterCount();
};

Variant.prototype.hasUser = function(userId) {
    for (var i in this._users) {
        if (this._users[i].getId() == userId) {
            return true;
        }
    }
    return false;
};

Variant.prototype.reset = function() {
    var ids = [];
    for (var i in this._users) {
        ids.push(this._users[i].getId());
    }
    for (var i in ids) {
        this.removeUser(ids[i]);
    }
    this._node.removeClass('voted');
    this._node.find(':checkbox,:radio').prop('checked', false);
};
