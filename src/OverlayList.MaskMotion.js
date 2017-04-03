/**
 * OverlayList - Motion type "mask"
 * @param   {jQueryObject}    $target
 * @param   {jQueryObject}    $ul
 * @param   {jQueryObject}    $items
 * @param   {Object}          options
 * @constructor
 */
ixSnack.OverlayList.MaskMotion = ixSnack.OverlayList.Motion.extend({
    //@override
    initialize: function ( $target, $ul, $items, options ) {
        this._$target = $target;
        this._$ul = $ul;
        this._$items = $items;
        this._options = options;

        this._totalLength = this._$items.length;
        this._selectIdx = this._options.defaultIndex;
        this._currentPos = 0;
        this._positionProp = ( this._options.axis === 'horizontal' )? 'right' : 'bottom';
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
        this._$items.children().css({
            width: '',
            height: ''
        });

        this._setSize();
        this._arrangeItems( this._selectIdx );
    },

    //@override
    clear: function () {
        ixSnack.OverlayList.Motion.prototype.clear.call( this );
        this._$items.children().css({
            right: '',
            bottom: '',
            width: '',
            height: ''
        });
    },

    // =============== Private Methods =============== //

    //@override
    _overlayItem: function ( idx, moveType ) {
        idx = this.correctSelectIdx( idx );

        var pos = 0,
            callbackData = {idx: idx, isSilent: false, moveType: moveType},
            callback = $B.bind( this._overlayComplete, this );

        if ( moveType === 'next' ) {
            pos = -this._itemSize;
        } else if ( moveType === 'prev' ) {
            pos = this._itemSize;
        }

        this._size( pos, callback, callbackData, true );
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
            this._size( pos );
            this.dispatch( 'motionMove' );
        }
    },

    _size: function ( pos, callback, data, isAni ) {
        var basePer = pos / this._itemSize * 100,
            prevPer, centerPer, nextPer,
            nextCallback, centerCallback, prevCallback,
            notAni = !isAni;

        //next
        if ( pos < 0 ) {
            prevPer = '0%';
            centerPer = this._correctPercent( 100 + basePer ) + '%';
            nextPer = this._correctPercent( Math.abs(basePer) ) + '%';
        } else {
            prevPer = this._correctPercent( basePer ) + '%';
            centerPer = this._correctPercent( 100 - basePer ) + '%';
            nextPer = '0%';
        }

        if ( isAni ) {
            if ( data.moveType === 'next' ) {
                nextCallback = callback;
            } else if ( data.moveType === 'prev' ) {
                prevCallback = callback;
            } else {
                centerCallback = callback;
            }
        }

        this._setChildrenStyle( this._$prev, 'prev', pos );
        this._setChildrenStyle( this._$center, 'center', pos );
        this._setChildrenStyle( this._$next, 'next', pos );

        if ( this._prevIdx > -1 ) ixSnack.size( this._$prev, prevPer, this._options, prevCallback, data, notAni );
        ixSnack.size( this._$center, centerPer, this._options, centerCallback, data, notAni );
        if ( this._nextIdx > -1 ) ixSnack.size( this._$next, nextPer, this._options, nextCallback, data, notAni );

        this._currentPos = pos;
    },

    _correctPercent: function ( val ) {
        if ( val < 0 ) {
            val = 0;
        } else if ( val > 100 ) {
            val = 100;
        }

        return val;
    },

    //touchstart, next, prev 시 동작
    _arrangeItems: function ( idx, moveType ) {
        var prevIdx = this._getPrevIdx( idx, moveType ),
            centerIdx = this._getCenterIdx( idx, moveType ),
            nextIdx = this._getNextIdx( idx, moveType );

        this._$prev = this._$items.eq( prevIdx );
        this._$center = this._$items.eq( centerIdx );
        this._$next = this._$items.eq( nextIdx );

        //hide
        this._$items.each( $B.bind(function ( idx, el ) {
            if ( prevIdx !== idx || nextIdx !== idx || centerIdx !== idx ) {
                var $el = $( el ).hide();
                ixSnack.size( $el, '100%', this._options, null, null, true );
            }
        }, this));

        if ( prevIdx > -1 ) this._setActiveItem( this._$prev, 'close' );
        this._setActiveItem( this._$center, 'open' );
        if ( nextIdx > -1 ) this._setActiveItem( this._$next, 'close' );

        this._prevIdx = prevIdx;
        this._centerIdx = centerIdx;
        this._nextIdx = nextIdx;
    },

    _setActiveItem: function ( $el, type ) {
        ixSnack.size( $el, (type === 'open')? '100%' : '0%', this._options, null, null, true );
        this._$ul.append( $el );
        $el.show();
    },

    _setChildrenStyle: function ( $el, moveType, pos ) {
        var style = {};

        //next
        if ( pos < 0 ) {
            if ( moveType === 'next' ) {
                style[this._positionProp] = 0;
            } else {
                style[this._positionProp] = '';
            }
        } else if ( pos > 0 ) {
            if ( moveType === 'prev' ) {
                style[this._positionProp] = '';
            } else {
                style[this._positionProp] = 0;
            }
        }

        $el.children().css( style );
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

    _getChildrenSize: function () {
        var sizeProp;

        if ( this._options.axis === 'horizontal' ) {
            sizeProp = 'outerWidth';
        } else {
            sizeProp = 'outerHeight';
        }

        return this._$items.eq( this._selectIdx ).children()[sizeProp]();
    },

    _setSize: function () {
        if ( !this._totalLength ) return;

        var sizeProp, itemStyle = {};

        this._itemSize = this._getItemSize();

        if ( this._options.axis === 'horizontal' ) {
            sizeProp = 'width';
        } else {
            sizeProp = 'height';
        }

        itemStyle[sizeProp] = this._getChildrenSize() + 'px';
        this._$items.children().css( itemStyle );
    }
}, 'ixSnack.OverlayList.MaskMotion');