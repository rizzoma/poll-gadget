var Options = function(callbacks) {
    this._options = {};
    this._node = $('#options');
    this._callbacks = callbacks;
};

Options.prototype.isSingleVariantVoting = function() {
    return this._options.singleVariantVoting == true;
};

Options.prototype._addCheckedListener = function() {
    this._node.on('change', ':checkbox', $.proxy(function(event) {
        var options = $.extend({}, this._options);
        var checkbox = $(event.target);
        if (checkbox.attr('name') == 'singleVariantVoting') {
            options.singleVariantVoting = checkbox.is(':checked');
        }
        this._callbacks.onChange(options);
    }, this));
};

Options.prototype.init = function() {
    this._addCheckedListener();
};

Options.prototype._getUpdatedOptions = function(options) {
    var updated = [];
    for (var i in options) {
        if (this._options[i] != options[i]) {
            updated.push(i);
        }
    }
    return updated;
};

Options.prototype.update = function(options) {
    var updated = this._getUpdatedOptions(options);
    this._options = options;
    if (updated.length) {
        this._callbacks.onUpdate(updated);
    }
};
