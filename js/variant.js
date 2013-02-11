var Variant = function(id, name, callbacks) {
    this._id = id;
    this._name = name;
    this._users = [];
    this._callbacks = callbacks;
    this._createNode();
};

Variant.prototype._addChangeListener = function() {
    this._node.on('change', ':checkbox,:radio', $.proxy(function() {
        this._callbacks.onVote();
    }, this));
};

Variant.prototype._showNameEditor = function() {
    var input = $('<input type="text">');
    input.val(this._name);
    input.click(function() {
        return false;
    });
    var callback = $.proxy(function() {
        var name = input.val();
        this._callbacks.onEdit(name);
    }, this);
    input.keydown(function(event) {
        if (event.which == 10 || event.which == 13) {
            callback();
        }
    });
    input.blur(callback);
    this._node.find('.variant-name').empty().append(input);
    input.focus();
    input.select();
};

Variant.prototype._addClickListener = function() {
    this._node.on('click', '.button', $.proxy(function(event) {
        var element = $(event.target);
        if (element.hasClass('variant-move-up')) {
            this._callbacks.onMove(-1);
        }
        if (element.hasClass('variant-move-down')) {
            this._callbacks.onMove(1);
        }
        if (element.hasClass('variant-edit')) {
            this._showNameEditor();
        }
        return false;
    }, this));
};

Variant.prototype._createNode = function() {
    this._node = $(
        '<div class="variant"> \
            <label class="variant-name-container"> \
                <input type="checkbox" name="variant"> \
                <span class="variant-name"></span> \
                <span class="variant-vote-count" title="Voters"></span> \
                <div class="variant-controls"> \
                    <button class="button variant-move-up" title="Move up"></button> \
                    <button class="button variant-move-down" title="Move down"></button> \
                    <button class="button variant-edit" title="Edit title"></button> \
                </div> \
            </label><div class="variant-voters"></div> \
        </div>'
    );
    this._node.find('.variant-name').text(this._name);
    this._addChangeListener();
    this._addClickListener();
};

Variant.prototype.getId = function() {
    return this._id;
};

Variant.prototype.getName = function() {
    return this._name;
};

Variant.prototype.setName = function(name) {
    this._name = name;
    this._node.find('.variant-name').empty().text(name);
};

Variant.prototype.getNode = function() {
    return this._node;
};

Variant.prototype.getVoteCount = function() {
    return this._users.length;
};

Variant.prototype.setExclusive = function(isExclusive) {
    var type = isExclusive ? 'radio' : 'checkbox';
    this._node.find(':checkbox,:radio').attr('type', type);
};

Variant.prototype.hasVote = function() {
    return this._node.find(':checkbox,:radio').is(':checked');
};

Variant.prototype._updateVoteCount = function() {
    var count = this.getVoteCount();
    var text = count ? '(' + count + ')' : '';
    this._node.find('.variant-vote-count').text(text);
};

Variant.prototype.getUserIds = function() {
    var ids = [];
    for (var i in this._users) {
        var user = this._users[i];
        ids.push(user.getId());
    }
    return ids;
};

Variant.prototype.hasUser = function(userId) {
    for (var i in this._users) {
        if (this._users[i].getId() == userId) {
            return true;
        }
    }
    return false;
};

Variant.prototype.addUser = function(user, isCurrentUser) {
    this._users.push(user);
    var node = $('<span class="variant-avatar variant-user-' + user.getId() + '"></span>');
    var name = user.getName();
    if (name) {
        node.attr('title', name);
    }
    var avatar = user.getAvatar();
    if (avatar) {
        node.css('background-image', 'url(' + avatar + ')');
    }
    this._node.find('.variant-voters').append(node);
    this._updateVoteCount();
    if (isCurrentUser) {
        this._node.addClass('voted');
        this._node.find(':checkbox,:radio').prop('checked', true);
    }
    if (this._users.length > 1 || !isCurrentUser) {
        this._node.find('.variant-edit').addClass('disabled');
    }
};

Variant.prototype._removeUser = function(userId) {
    if (!this.hasUser(userId)) {
        return;
    }
    for (var i in this._users) {
        if (this._users[i].getId() == userId) {
            this._users.splice(i, 1);
            break;
        }
    }
    this._node.find('.variant-voters .variant-user-' + userId).remove();
    this._updateVoteCount();
    
};

Variant.prototype.reset = function() {
    var ids = [];
    for (var i in this._users) {
        ids.push(this._users[i].getId());
    }
    for (var i in ids) {
        this._removeUser(ids[i]);
    }
    this._node.removeClass('voted');
    this._node.find(':checkbox,:radio').prop('checked', false);
    this._node.find('.variant-edit').removeClass('disabled');
};
