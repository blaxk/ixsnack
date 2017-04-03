/**
 * OverlayList - Motion type "none"
 * @param   {jQueryObject}    $target
 * @param   {jQueryObject}    $ul
 * @param   {jQueryObject}    $items
 * @param   {Object}          options
 * @constructor
 */
ixSnack.OverlayList.Motion = $B.Class.extend({
    initialize: function ( $target, $ul, $items, options ) {
        this._$target = $target;
        this._$ul = $ul;
        this._$items = $items;
        this._options = options;

        this._totalLength = this._$items.length;
        this._selectIdx = this._options.defaultIndex;

        this._overlayItem( this._selectIdx, true );
    },

    // =============== Public Methods =============== //

    resize: function () {},

    displacement: function () {
        return 0;
    },

    none: function () {
        this.dispatch( 'motionEnd', {idx: this._selectIdx, isSilent: false} );
    },

    move: function ( e ) {
        //this.dispatch( 'motionMove' );
    },

    next: function ( selectIdx ) {
        this._overlayItem( selectIdx );
    },

    prev: function ( selectIdx ) {
        this._overlayItem( selectIdx );
    },

    isEndpoint: function () {
        return ( !this._options.loop && this._selectIdx === this._totalLength - 1 );
    },

    isFirstpoint: function () {
        return ( !this._options.loop && this._selectIdx === 0 );
    },

    //최소 최대 index값 보정
    correctSelectIdx: function ( idx ) {
        if ( idx > this._totalLength - 1 ) {
            idx = this._options.loop ? 0 : this._totalLength - 1;
        } else if ( idx < 0 ) {
            idx = this._options.loop ? this._totalLength - 1 : 0;
        }

        return idx;
    },

    clear: function () {
        this.removeListener();
    },

    // =============== Private Methods =============== //

    _isOverPosition: function ( pos ) {
        var result = false;

        if ( !this._options.loop ) {
            //prev
            if ( pos > 0 && this._selectIdx <= 0 ) {
                result = true;
            } else if ( pos < 0 && this._selectIdx >= this._totalLength - 1 ) {
                result = true;
            }
        }

        return result;
    },

    //아이템 이동
    _overlayItem: function ( idx, isSilent, isAni ) {
        if ( isAni ) {
            var $item = this._$items.eq( idx ).show();
            ixSnack.animate( $item, 'opacity', 0, this._options, null, null, true );
            this._$ul.append( $item );
            ixSnack.animate( $item, 'opacity', 1, this._options, $B.bind(this._overlayComplete, this), {idx: idx, isSilent: isSilent} );
        } else {
            this._$items.hide().eq( idx ).show();
            this._overlayComplete( {data: {idx: idx, isSilent: isSilent}} );
        }
    },

    _overlayComplete: function (e) {
        this._setWaiArea( e.data.idx );
        this._selectIdx = e.data.idx;
        this.dispatch( 'motionEnd', {idx: e.data.idx, isSilent: e.data.isSilent} );
    },

    _getItemSize: function () {
        if ( this._options.itemSize ) {
            return this._options.itemSize.value;
        } else {
            var type = ( this._options.axis === 'horizontal' )? 'width' : 'height';
            return $B( this._$items.get(this._selectIdx) ).rect()[type];
        }
    },

    _getItemMargins: function () {
        var result = [];

        if ( this._options.itemMargin ) {
            result = [this._options.itemMargin[0].value, this._options.itemMargin[1].value];
        } else {
            var margins = this._$items.css( this._options.axis === 'horizontal' ? ['marginLeft', 'marginRight'] : ['marginTop', 'marginBottom'] );
            $.each( margins, function ( key, value ) {
                result.push( parseFloat(value) );
            });
        }

        return result;
    },
    
    _setWaiArea: function ( idx ) {
        this._$items.attr( 'aria-hidden', true ).eq( idx ).attr( 'aria-hidden', false );
    }
}, 'ixSnack.OverlayList.Motion');