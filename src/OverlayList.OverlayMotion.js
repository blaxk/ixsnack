/**
 * OverlayList - Motion type "overlay"
 * @param   {jQueryObject}    $target
 * @param   {jQueryObject}    $ul
 * @param   {jQueryObject}    $items
 * @param   {Object}          options
 * @constructor
 */
ixSnack.OverlayList.OverlayMotion = ixSnack.OverlayList.Motion.extend({
    //@override
    initialize: function ( $target, $ul, $items, options ) {
        this._$target = $target;
        this._$ul = $ul;
        this._$items = $items;
        this._options = options;

        this._totalLength = this._$items.length;
        this._selectIdx = this._options.defaultIndex;

        this._overlayItem( this._selectIdx, true, false );
    },

    // =============== Public Methods =============== //

    //@override
    next: function ( selectIdx ) {
        this._overlayItem( selectIdx, false, true );
    },

    //@override
    prev: function ( selectIdx ) {
        this._overlayItem( selectIdx, false, true );
    }

    // =============== Private Methods =============== //

}, 'ixSnack.OverlayList.OverlayMotion');