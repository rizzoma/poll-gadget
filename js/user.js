var User = function(id, name, avatar) {
    this._id = id;
    this._name = name;
    this._avatar = avatar;
};

User.prototype.getId = function() {
    return this._id;
};

User.prototype.getName = function() {
    return this._name;
};

User.prototype.getAvatar = function() {
    return this._avatar;
};

User.prototype.isUnknown = function() {
    return !this._name || !this._avatar;
};
