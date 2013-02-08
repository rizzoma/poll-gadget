var Options = function(callbacks) {
    this._options = {};
    this._node = $('#options');
    this._callbacks = callbacks;
};

Options.prototype.SORTING = {
    NONE: 0,
    BY_NAME: 1,
    BY_VOTE: 2
};

Options.prototype.isSingleVariantVoting = function() {
    return this._options.singleVariantVoting || false;
};

Options.prototype.getSortingOrder = function() {
    return this._options.sorting || this.SORTING.NONE;
};

Options.prototype._addChangeListener = function() {
    this._node.on('change', ':checkbox,select', $.proxy(function(event) {
        var options = $.extend({}, this._options);
        var element = $(event.target);
        var name = element.attr('name');
        if (name == 'singleVariantVoting') {
            options.singleVariantVoting = element.is(':checked');
        }
        if (name == 'sorting') {
            options.sorting = Number(element.val());
        }
        this._callbacks.onChange(options);
    }, this));
};

Options.prototype.init = function() {
    this._addChangeListener();
};

Options.prototype.update = function(options) {
    this._options = options;
};
