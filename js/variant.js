var Variant = function(id, name, onSelected) {
    this._id = id;
    this._name = name;
    this._users = [];
    this._node = null;
    this._onSelected = onSelected;
};

Variant.prototype.getId = function() {
    return this._id;
};

Variant.prototype.getName = function() {
    return this._name;
};

Variant.prototype._createNode = function() {
    this._node = $(
        '<div class="variant"> \
            <label class="variant-name" style="width: 100px"> \
                <input type="radio" name="variant"> ' + this._name + ' \
            </label> \
            <span class="voter_count"></span> \
            <span class="voters"></span> \
        </div>'
    );
};

Variant.prototype._addCheckedListener = function() {
    this._node.on('change', ':radio', $.proxy(function(event) {
        this._onSelected();
    }, this));
};

Variant.prototype.getNode = function() {
    if (!this._node) {
        this._createNode();
        this._addCheckedListener();
    }
    return this._node;
};

Variant.prototype.hasVote = function() {
    return this._node.find(':radio').is(':checked');
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
        this._node.find(':radio').prop('checked', true);
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
    this._node.find(':radio').prop('checked', false);
};
