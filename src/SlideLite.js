/**
 * Slide Lite
 * @param   {jQueryObject}    $target
 * @constructor
 */
ixSnack.SlideLite = ixSnack.BaseClass.extend({
    initialize: function ( $target ) {
        this._$target = $target;
        this._$viewport = this._$target.find( '> .ix-list-viewport' );
        this._$ul = this._$viewport.find( '> .ix-list-items' );
		this._$touchArea = this._$target.find( '> .ix-touch-area' );
        this._options = ixSnack.getOptions( this._$target.attr('data-ix-options') );

		if ( !this._$touchArea.length ) {
			this._$touchArea = this._$viewport;
		}

        this._selectIdx = 0;
        this._disabled = false;
        this._isTimerBlock = false;
        this._currentPos = 0;
        this._directionType = 'none';

        this._getItems();
        this._setItems();
        this._setSize();
        this._setAutoPlay();
        this._setEvents();

        this._options.motionType = this._options.motionType || 'slide';
        this._options.originLength = this._totalLength;
        this._options.totalLength = this._totalLength;
        if ( this._totalLength < 3 ) this._options.loop = false;
        if ( this._options.defaultIndex >= this._totalLength || this._options.defaultIndex < 0 ) this._options.defaultIndex = 0;
        if ( !this._options.duration ) this._options.duration = 400;

        this._thumbController = new ixSnack.ThumbController( this._$target, this._options )
            .setIndex( this._options.defaultIndex, this._options.defaultIndex )
            .addListener( 'next', $B.bind(this._thumbHandler, this) )
            .addListener( 'prev', $B.bind(this._thumbHandler, this) )
            .addListener( 'index', $B.bind(this._thumbHandler, this) );

        this._arrangeItems( this._options.defaultIndex );
        this._selectIdx = this._centerIdx;
        this._dispatch( 'init' );
    },

    // =============== Public Methods =============== //

    startTimer: function () {
        if ( this._disabled ) return;
        this._isTimerBlock = false;
        this._playTimer();
    },

    stopTimer: function () {
        this._isTimerBlock = true;
        this._pauseTimer();
    },

	changeIndex: function ( idx, direction ) {
		if (idx > this._totalLength || idx < 0 || !this._totalLength || this._selectIdx == idx) return;
		
		if (direction === 'next') {
			this.next(idx);
		} else if (direction === 'prev') {
			this.prev(idx);
		} else {
			if (this._selectIdx < idx) {
				this.next(idx);
			} else if (this._selectIdx > idx) {
				this.prev(idx);
			}
		}
    },

    next: function ( selectIdx, isSwipe ) {
        if ( this._disabled || this._thumbController.block() || !this._totalLength ) return;
        this._directionType = 'next';
        this._selectMove( this._selectIdx + 1, selectIdx, 'next', isSwipe );
    },

    prev: function ( selectIdx, isSwipe ) {
        if ( this._disabled || this._thumbController.block() || !this._totalLength ) return;
        this._directionType = 'prev';
        this._selectMove( this._selectIdx - 1, selectIdx, 'prev', isSwipe );
    },

    resize: function () {
        if ( !this._totalLength ) return;

        this._pauseTimer();
        this._removeSize();
        this._setSize();
        this._arrangeItems( this._selectIdx );
        this._playTimer();
    },

    clear: function () {
        this._directionType = 'none';
        this._pauseTimer();
        this._removeEvents();
        this._removeStyle();
        this._$ul.stop();
        this._$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
        ixSnack.removePlugin( this._$target, 'slide-lite' );
        this._removeWaiAria();
    },

    // =============== Private Methods =============== //

    _thumbHandler: function (e) {
        switch ( e.type ) {
            case 'next':
                this.next();
                break;
            case 'prev':
                this.prev();
                break;
            case 'index':
                this.changeIndex( e.index );
                break;
        }
    },

    _setEvents: function () {
        if ( !this._options.touchDisable && $B.ua.TOUCH_DEVICE && this._totalLength > 1 ) {
            this._swipe = new $B.event.Swipe( this._$touchArea.get(0), {
                axis: this._options.axis
				//Safari v10~ preventDefault issue (ixband v1.1.2 에서 해결 됨)
                //preventDefault: this._options.axis === 'vertical' && $B.ua.SAFARI && parseFloat( $B.ua.VERSION ) > 9
            }).sensitivity( this._options.swipeSensitivity )
                .addListener( 'axis', $B.bind(function (e) {
                    if ( this._thumbController.block() ) return;
                    this._pauseTimer();
                    this._dispatch( 'touchStart' );
                }, this))
                .addListener( 'move', $B.bind(function (e) {
                    if ( this._thumbController.block() ) return;
                    if ( this._options.motionType === 'slide' ) this._touchMove( e );
                    //TODO: touchMove 이벤트 전달
                }, this))
                .addListener( 'swipe', $B.bind(function (e) {
                    if ( this._thumbController.block() ) return;
                    this._dispatch( 'touchEnd' );

                    //이동값이 변동이 없으면 transitionend 이벤트가 발생하지 않기 때문
                    if ( (this._options.axis === 'horizontal'? e.moveX : e.moveY) === 0 ) {
                        this._playTimer();
                        return;
                    }

                    this._targetSwipe( e.swipe );
                }, this));
        }

        this._mouseHandler = $B.bind(function (e) {
            if ( e.type === 'mouseover' ) {
                this._pauseTimer();
            } else {
                this._playTimer();
            }
        }, this);

        if ( this._options.autoPlay && !$B.ua.TOUCH_DEVICE ) {
            this._$target.on( 'mouseover mouseout', this._mouseHandler );
        }
    },

    _touchMove: function (e) {
        var movePos = ( this._options.axis === 'horizontal' )? e.growX : e.growY,
            isOverPos = this._isOverPosition( movePos + this._currentPos ),
            pos = isOverPos? ( movePos * ENDPOINT_DECREASE ) + this._currentPos : movePos + this._currentPos;

        if ( isOverPos && this._options.bounce || !isOverPos ) {
            ixSnack.moveTo( this._$ul, pos + 'px', this._options );
            this._currentPos = pos;
        }

        this._dispatch( 'touchMove' );
    },

    _targetSwipe: function ( type ) {
        if ( type === 'left' || type === 'up' ) {
            this.next();
        } else if ( type === 'right' || type === 'down' ) {
            this.prev();
        } else {
            this._dispatch( 'slideStart' );
            this._moveItems( this._selectIdx, 'none', this._options.motionType );
        }
    },

    _isOverPosition: function ( current ) {
        var result = false;

        if ( !this._options.loop ) {
            if ( this._selectIdx <= 0 && current > -this._itemSize ) {
                result = true;
            } else if ( this._selectIdx >= this._totalLength - 1 && current < -this._itemSize ) {
                result = true;
            }
        }

        return result;
    },

    _selectMove: function ( nextIdx, selectIdx, moveProp ) {
        if ( typeof selectIdx === 'number' && nextIdx !== selectIdx ) {
            this._arrangeItems( selectIdx, moveProp );
            nextIdx = selectIdx;
        }

        nextIdx = this._correctSelectIdx( nextIdx );
        if ( nextIdx === this._selectIdx ) moveProp = 'none';

        this._dispatch( 'slideStart' );
        this._moveItems( nextIdx, moveProp,  this._options.motionType );
    },

    //최소 최대 index값 보정
    _correctSelectIdx: function ( idx ) {
        if ( idx > this._totalLength - 1 ) {
            idx = this._options.loop ? 0 : this._totalLength - 1;
        } else if ( idx < 0 ) {
            idx = this._options.loop ? this._totalLength - 1 : 0;
        }

        return idx;
    },

    //아이템 배치
    _arrangeItems: function ( idx, moveType ) {
        var centerIdx = this._getCenterIdx( idx, moveType ),
            prevIdx = this._getPrevIdx( idx, moveType ),
            nextIdx = this._getNextIdx( idx, moveType ),
            posProp = ( this._options.axis === 'horizontal' )? 'left' : 'top';

        if ( prevIdx > -1 ) this._$items.eq( prevIdx ).css( posProp, '0px' ).show().attr( 'aria-hidden', true );
        this._$items.eq( centerIdx ).css( posProp, this._itemSize + 'px' ).show().attr( 'aria-hidden', false );
        if ( nextIdx > -1 ) this._$items.eq( nextIdx ).css( posProp, (this._itemSize * 2) + 'px' ).show().attr( 'aria-hidden', true );

        this._$items.filter( function ( index ) {
            return ( prevIdx !== index && nextIdx !== index &&  centerIdx !== index );
        }).hide().attr( 'aria-hidden', true );

        ixSnack.moveTo( this._$ul, -this._itemSize + 'px', this._options );

        this._currentPos = -this._itemSize;
        this._centerIdx = centerIdx;
        this._prevIdx = prevIdx;
        this._nextIdx = nextIdx;
    },

    //아이템 이동
    _moveItems: function ( idx, moveType, motionType, isSilent ) {
        idx = this._correctSelectIdx( idx );

        var nextPos = -this._itemSize;

        this._pauseTimer();
        this._thumbController.block( true ).setIndex( idx, idx );

        if ( moveType === 'next' ) {
            nextPos = -( this._itemSize * 2 );
        } else if ( moveType === 'prev' ) {
            nextPos = 0;
        }

        if ( motionType === 'slide' ) {
            ixSnack.move( this._$ul, nextPos + 'px', this._options, $B.bind(this._moveComplete, this), {idx: idx, isSilent: isSilent} );
        } else {
            ixSnack.moveTo( this._$ul, nextPos + 'px', this._options, $B.bind(this._moveComplete, this), {idx: idx, isSilent: isSilent} );
        }

        this._currentPos = nextPos;
    },

    _moveComplete: function (e) {
        var oldIdx = this._selectIdx;

        this._thumbController.block( false );
        this._playTimer();
        this._selectIdx = e.data.idx;

        this._arrangeItems( this._selectIdx );

        if ( !e.data.isSilent ) {
            if ( oldIdx !== this._selectIdx ) this._dispatch( 'change' );
            this._dispatch( 'slideEnd' );
            this._directionType = 'none';
        }
    },

    _isEndpoint: function () {
        return ( !this._options.loop && this._selectIdx === this._totalLength - 1 );
    },

    //왼쪽에 위치할 Element Index
    _getPrevIdx: function ( idx, moveType ) {
        var result = moveType ? ( moveType === 'next' ? -1 : idx ) : idx - 1;
        return ( moveType === 'next' ? result : (this._options.loop ? this._correctSelectIdx(result) : result) );
    },

    //오른쪽에 위치할 Element Index
    _getNextIdx: function ( idx, moveType ) {
        var result = moveType ? ( moveType === 'prev' ? -1 : idx ) : idx + 1;
        return ( moveType === 'prev' ? result : (this._options.loop ? this._correctSelectIdx(result) : result) );
    },

    //중심에 위치할 Element Index
    _getCenterIdx: function ( idx, moveType ) {
        return moveType ? this._selectIdx : idx;
    },

    _setAutoPlay: function () {
        if ( !this._options.autoPlay || this._totalLength < 2 ) return;

        this._timer = new $B.utils.Timer( this._options.delay, this._totalLength )
            .addListener( 'timer', $B.bind(function (e) {
                if ( this._options.opposite ) {
                    this.prev();
                } else {
                    this.next();
                }
            }, this)).addListener( 'complete', $B.bind(function (e) {
                this._playTimer();
            }, this)).start();
    },

    //사이즈 설정
    _setSize: function () {
        if ( this._options.viewportRatio ) this._$viewport.css( 'height', this._getViewportHeight() + 'px' );
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

    _getViewportHeight: function () {
        return $B( this._$viewport.get(0) ).rect().width * ( this._options.viewportRatio[1].value / this._options.viewportRatio[0].value );
    },

    _getItemSize: function () {
        if ( this._options.itemSize ) {
            return this._options.itemSize.value;
        } else {
            var type = ( this._options.axis === 'horizontal' )? 'width' : 'height';
            return $B( this._$items.get(this._selectIdx) ).rect()[type];
        }
    },

    _removeSize: function () {
        var sizeProp = ( this._options.axis === 'horizontal' ) ? 'width' : 'height';
        this._$viewport.attr( 'style', '' );
        this._$ul.css( sizeProp, '' );
        this._$items.css( sizeProp, '' ).css( 'margin', '' );
    },

    _removeStyle: function () {
        this._$viewport.attr( 'style', '' );
        this._$ul.attr( 'style', '' );
        this._$items.attr( 'style', '' );
    },

    _removeEvents: function () {
        this._$target.off( 'mouseover mouseout', this._mouseHandler );
        this._thumbController.clear();
        if ( this._swipe ) this._swipe.clear();
    },

    _getItems: function () {
        this._$items = this._$ul.find( '> .ix-list-item' );
        this._totalLength = this._$items.length;
    },

    //아이템 origin 갯수 대비 실제 갯수 설정
    _setItems: function () {
        this._$items.each( function ( idx, el ) {
            //origin-index 속성 추가
            $( el ).attr( 'data-idx', idx ).attr( 'aria-hidden', true );
        }).css({
            position: 'absolute'
        });
    },

    _removeWaiAria: function () {
        this._$items.removeAttr( 'aria-hidden' );
    },

    _playTimer: function () {
        if ( !this._isTimerBlock && this._timer ) this._timer.reset().start();
    },

    _pauseTimer: function () {
        if ( this._timer ) this._timer.stop();
    },

    _displacement: function ( type ) {
        var val = 0;

        if ( type === 'change' || type === 'slideEnd' ) {
            if ( this._directionType === 'next' ) {
                val = -1;
            } else if ( this._directionType === 'prev' ) {
                val = 1;
            }
        } else {
            val = 1 + ( this._currentPos / this._itemSize );

            if ( val < -1 ) {
                val = -1;
            } else if ( val > 1 ) {
                val = 1;
            }
        }

        return val;
    },

    _dispatch: function ( type ) {
        var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? this._isEndpoint() : undefined,
            currentIndex = this._selectIdx,
            displacement = this._displacement( type );

        if ( !this._totalLength ) currentIndex = NaN;
        this._$target.triggerHandler( {type: 'ixSlideLite:' + type, currentIndex: currentIndex, totalLength: this._totalLength, endpoint: endpoint, direction: this._directionType, displacement: displacement} );
    }

}, 'ixSnack.SlideLite');