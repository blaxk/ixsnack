/**
 * OverlayList - Motion type "slide"
 * @param   {jQueryObject}    $target
 * @param   {jQueryObject}    $ul
 * @param   {jQueryObject}    $items
 * @param   {Object}          options
 * @constructor
 */
ixSnack.OverlayList.SlideMotion = ixSnack.OverlayList.Motion.extend({
    //@override
    initialize: function ( $target, $ul, $items, options ) {
        this._$target = $target;
        this._$ul = $ul;
        this._$items = $items;
        this._options = options;

        this._totalLength = this._$items.length;
        this._selectIdx = this._options.defaultIndex;
        this._currentPos = 0;
        this._growProp = ( this._options.axis === 'horizontal' )? 'growX' : 'growY';

        this._setSize();
        this._arrangeItems( this._selectIdx );
        this._setWaiArea( this._selectIdx );
    },

    // =============== Public Methods =============== //

    //@override
    next: function ( selectIdx, isChangeIndex ) {
        if ( isChangeIndex && !this._isGradualIndex(selectIdx) ) this._arrangeItems( selectIdx, 'next' );
        this._overlayItem( selectIdx, 'next' );
    },

    //@override
    prev: function ( selectIdx, isChangeIndex ) {
        if ( isChangeIndex && !this._isGradualIndex(selectIdx) ) this._arrangeItems( selectIdx, 'prev' );
        this._overlayItem( selectIdx, 'prev' );
    },

    //@override
    //swipe none
    none: function () {
        this._overlayItem( this._selectIdx, 'none' );
    },

    //@override
    move: function ( e ) {
        this._touchMove( e[this._growProp] );
    },

    //@override
    displacement: function () {
        return this._currentPos / this._itemSize;
    },

    //@override
    resize: function () {
        this._setSize();
        this._arrangeItems( this._selectIdx );
    },

    // =============== Private Methods =============== //

    //@override
    _overlayItem: function ( idx, moveType ) {
        idx = this.correctSelectIdx( idx );

        var nextPos = 0,
            callbackData = {idx: idx, isSilent: false, moveType: moveType},
            callback = $B.bind( this._overlayComplete, this ),
            nextCallback, prevCallback;

        if ( moveType === 'next' ) {
            nextPos = -this._itemSize;
            nextCallback = callback;
        } else if ( moveType === 'prev' ) {
            nextPos = this._itemSize;
            prevCallback = callback;
        } else {
            if ( !this._options.loop && this._selectIdx === 0 ) {
                nextCallback = callback;
            } else {
                prevCallback = callback;
            }
        }

        if ( this._prevIdx > -1 ) ixSnack.move( this._$prev, nextPos + 'px', this._options, prevCallback, callbackData );
        if ( this._nextIdx > -1 ) ixSnack.move( this._$next, nextPos + 'px', this._options, nextCallback, callbackData );
        this._currentPos = nextPos;
    },

    //@override
    _overlayComplete: function (e) {
        if ( e.data.moveType !== 'none' ) this._arrangeItems( e.data.idx );
        ixSnack.OverlayList.Motion.prototype._overlayComplete.call( this, e );
        this._currentPos = 0;
    },

    _touchMove: function ( movePos ) {
        var pos = movePos + this._currentPos;

        if ( -this._itemSize > pos ) {
            pos = -this._itemSize;

        } else if ( this._itemSize < pos ) {
            pos = this._itemSize;
        }

        if ( !this._isOverPosition(pos) ) {
            ixSnack.moveTo( this._$next, pos + 'px', this._options );
            ixSnack.moveTo( this._$prev, pos + 'px', this._options );
            this._currentPos = pos;
            this.dispatch( 'motionMove' );
        }
    },

    _arrangeItems: function ( idx, moveType ) {
        var centerIdx = this._getCenterIdx( idx, moveType ),
            prevIdx = this._getPrevIdx( idx, moveType ),
            nextIdx = this._getNextIdx( idx, moveType ),
            posProp = ( this._options.axis === 'horizontal' )? 'left' : 'top';

        this._$prev = this._$items.eq( prevIdx );
        this._$center = this._$items.eq( centerIdx );
        this._$next = this._$items.eq( nextIdx );

        if ( prevIdx > -1 ) this._$ul.append( this._$prev.css(posProp, '0px').show() );
        this._$center.css( posProp, this._itemSize + 'px' ).show();
        if ( nextIdx > -1 ) this._$ul.append( this._$next.css(posProp, (this._itemSize * 2) + 'px').show() );

        ixSnack.moveTo( this._$prev, '0px', this._options );
        ixSnack.moveTo( this._$center, '0px', this._options );
        ixSnack.moveTo( this._$next, '0px', this._options );

        this._$items.filter( function ( index ) {
            return ( prevIdx !== index && nextIdx !== index &&  centerIdx !== index );
        }).hide();

        this._$ul.css( posProp, -this._itemSize + 'px' );

        this._centerIdx = centerIdx;
        this._prevIdx = prevIdx;
        this._nextIdx = nextIdx;
    },

    //왼쪽에 위치할 Element Index
    _getPrevIdx: function ( idx, moveType ) {
        var result = moveType ? ( moveType === 'next' ? -1 : idx ) : idx - 1;
        return ( moveType === 'next' ? result : (this._options.loop ? this.correctSelectIdx(result) : result) );
    },

    //오른쪽에 위치할 Element Index
    _getNextIdx: function ( idx, moveType ) {
        var result = moveType ? ( moveType === 'prev' ? -1 : idx ) : idx + 1;
        return ( moveType === 'prev' ? result : (this._options.loop ? this.correctSelectIdx(result) : result) );
    },

    //중심에 위치할 Element Index
    _getCenterIdx: function ( idx, moveType ) {
        return moveType ? this._selectIdx : idx;
    },

    //한칸씩 이동하는 index인지
    _isGradualIndex: function ( idx ) {
        return ( Math.abs(idx - this._selectIdx) === 1 );
    },

    _setSize: function () {
        if ( !this._totalLength ) return;

        var sizeProp, marginProps, itemStyle = {}, ulStyle = {},
            itemMargins = this._getItemMargins(), itemMarginTotal = itemMargins[0] + itemMargins[1];

        this._itemSize = this._getItemSize();

        if ( !this._options.includeMargin ) this._itemSize += itemMarginTotal;

        if ( this._options.axis === 'horizontal' ) {
            sizeProp = 'width';
            marginProps = ['marginLeft', 'marginRight'];
        } else {
            sizeProp = 'height';
            marginProps = ['marginTop', 'marginBottom'];
        }

        ulStyle[sizeProp] = ( this._itemSize * 3 + 100 ) + 'px';
        itemStyle[sizeProp] = ( this._itemSize - itemMarginTotal )   + 'px';
        itemStyle[marginProps[0]] = itemMargins[0] + 'px';
        itemStyle[marginProps[1]] = itemMargins[1] + 'px';

        this._$items.css( itemStyle );
        this._$ul.css( ulStyle );
    }
}, 'ixSnack.OverlayList.SlideMotion');