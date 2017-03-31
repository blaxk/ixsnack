/**
 * Base Class
 * SlideMax, SlideLite, OverlayList 공통 Methods 정의
 * @constructor
 */
ixSnack.BaseClass = $B.Class.extend({
    // =============== Public Methods =============== //
    getCurrentIndex: function () {
        return this._selectIdx;
    },

    getTotalLength: function () {
        return this._totalLength;
    },

    getComputedOption: function ( prop ) {
        if ( $B.isString(prop) ) {
            prop = $B.string.camelCase( prop );

            if ( this._options.hasOwnProperty(prop) ) {
                return this._options[prop];
            }
        } else {
            return $B.object.clone( this._options );
        }
    },

    enable: function () {
        if ( this._swipe ) this._swipe.enable();
        if ( this._thumbController ) this._thumbController.enable();
        this._disabled = false;
    },

    disable: function () {
        if ( this._swipe ) this._swipe.disable();
        if ( this._thumbController ) this._thumbController.disable();
        this._disabled = true;
    }
}, 'ixSnack.BaseClass');