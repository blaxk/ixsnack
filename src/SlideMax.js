/**
 * Slide Max
 * @param   {jQueryObject}    $target
 * @constructor
 */
ixSnack.SlideMax = ixSnack.BaseClass.extend({
    initialize: function ( $target ) {
        this._$target = $target;
        this._$viewport = this._$target.find( '> .ix-list-viewport' );
        this._$ul = this._$viewport.find( '> .ix-list-items' );
        this._$touchArea = this._$target.find( '> .ix-touch-area' );
        this._options = ixSnack.getOptions( this._$target.attr('data-ix-options') );

        if ( !this._$touchArea.length ) {
			this._$touchArea = this._$viewport;
        }

        this._directionType = 'none';
        this._selectIdx = 0;
        this._originIdx = -1;
        this._oldOriginIdx = -1;
        this._currentPos = 0;
        this._disabled = false;
        this._endpoint = false;
        this._isTimerBlock = false;

        this._getItems( true );
        this._setItems();
        this._setSize();
        this._setAutoPlay();
        this._setEvents();

        this._options.motionType = this._options.motionType || 'slide';
        this._options.originLength = this._originLength;
        this._options.totalLength = this._totalLength;

        if ( this._options.moveLength > this._options.viewLength ) {
            this._options.moveLength = this._options.viewLength;
        }

        if ( !this._options.duration ) this._options.duration = 400;

        this._thumbController = new ixSnack.ThumbController( this._$target, this._options )
            .addListener( 'next', $B.bind(this._thumbHandler, this) )
            .addListener( 'prev', $B.bind(this._thumbHandler, this) )
            .addListener( 'index', $B.bind(this._thumbHandler, this) );

        this._listIndexManager = new ixSnack.ListIndexManager( this._options, {
            onChange: $B.bind( this._listIndexEventHandler, this ),
            onCorrect: $B.bind( this._listIndexEventHandler, this ),
            onInit: $B.bind( this._listIndexEventHandler, this )
        });
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

    changeIndex: function ( originIdx, direction ) {
		this._selectOriginIdx( originIdx, direction );
    },

    next: function ( moveLength ) {
		moveLength = Math.abs( moveLength );
        if ( moveLength > this._options.viewLength ) return;
        this._next( moveLength, true );
    },

    prev: function ( moveLength ) {
		moveLength = Math.abs( moveLength );
		if ( moveLength > this._options.viewLength ) return;
        this._prev( moveLength, true );
    },

    clear: function () {
        this._directionType = 'none';
        this._pauseTimer();
        this._removeEvents();
        this._removeSize();
        this._$ul.stop();
        this._$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
        if ( this._$cloneItems ) this._$cloneItems.remove();
        ixSnack.removePlugin( this._$target, 'slide-max' );
        this._removeWaiAria();
    },

    resize: function () {
        this._pauseTimer();
        this._removeSize();
        this._setSize();
        this._moveItems( this._selectIdx, 'none', true, true );
    },

    //v0.4.3 에서 origin-idx 를 반환 하도록 수정
	getCurrentIndex: function ( total ) {
        if ( total && typeof total === 'boolean' ) {
			return this._selectIdx;
        } else {
			return this._originIdx;
        }
	},

    // =============== Private Methods =============== //

    _next: function ( rangeLength, isInput ) {
		if ( this._disabled || this._thumbController.block() ) return;
		this._directionType = 'next';
		this._listIndexManager.next( rangeLength, isInput );
    },

	_prev: function ( rangeLength, isInput ) {
		if ( this._disabled || this._thumbController.block() ) return;
		this._directionType = 'prev';
		this._listIndexManager.prev( rangeLength, isInput );
	},

    _thumbHandler: function (e) {
        switch ( e.type ) {
            case 'next':
                this._next( null, true );
                break;
            case 'prev':
                this._prev( null, true );
                break;
            case 'index':
                this.changeIndex( e.index );
                break;
        }
    },

    _listIndexEventHandler: function (e) {
        switch ( e.type ) {
            case 'change':
                this._dispatch( 'slideStart' );
                this._endpoint = e.endpoint;
                this._originIdx = Number( this._$items.eq(e.index).attr('data-origin-idx') );
                this._moveItems( e.index, this._options.motionType );
                break;
            case 'correct':
                this._moveItems( e.index, 'none', true );
                break;
            case 'init':
                this._endpoint = e.endpoint;
                this._originIdx = Number( this._$items.eq(e.index).attr('data-origin-idx') );
                this._moveItems( e.index, 'none', false, true );
				this._dispatch( 'init' );
                break;
        }
    },

    _getItems: function ( first ) {
        this._$items = this._$ul.find( '> .ix-list-item' );
        this._totalLength = this._$items.length;
        if ( first ) this._originLength = this._totalLength;
    },

    //아이템 origin 갯수 대비 실제 갯수 설정
    _setItems: function () {
        if ( !this._totalLength ) return;

        this._$items.each( function ( idx, el ) {
            //origin-index 속성 추가
            $( el ).attr( 'data-origin-idx', idx );
        });

        if ( this._options.loop && this._originLength > this._options.viewLength ) {
            this._cloneItems();
            this._getItems();
        }

        this._$items.each( function ( idx, el ) {
            //index 속성 추가
            $( el ).attr( 'data-idx', idx ).attr( 'aria-hidden', true );
        });
    },

    //아이템 복사
    _cloneItems: function () {
        var $firstItems = this._$items.slice( this._totalLength - this._options.viewLength - 1, this._totalLength ).clone(),
            $lastItems = this._$items.slice( 0, this._options.viewLength + 1 ).clone();

        if ( $firstItems.length ) $firstItems.insertBefore( this._$items.eq(0) );
        if ( $lastItems.length ) this._$ul.append( $lastItems );

        this._options.firstCloneLength = $firstItems.length;
        this._$cloneItems = $firstItems.add( $lastItems );
        this._$cloneItems.addClass( 'ix-clone' );
    },

    _setEvents: function () {
        if ( !this._options.touchDisable && $B.ua.TOUCH_DEVICE && this._totalLength > this._options.viewLength ) {
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
    },

    _targetSwipe: function ( type ) {
        if ( type === 'left' || type === 'up' ) {
            this._next();
        } else if ( type === 'right' || type === 'down' ) {
            this._prev();
        } else {
            this._dispatch( 'slideStart' );
            this._moveItems( this._selectIdx, this._options.motionType );
        }
    },

    _isOverPosition: function ( current ) {
        var result = false, total = 0;

        if ( !this._options.loop ) {
            if ( this._options.paging && this._options.viewLength > 1 ) {
                total = this._indexToPosition( this._options.viewLength * Math.floor(this._totalLength / this._options.viewLength) );
            } else if ( this._options.correctEndpoint ) {
                total = -( this._totalLength * this._itemSize - this._viewportSize + this._options.correctEndpoint );
            } else {
                total = this._indexToPosition( this._totalLength - this._options.viewLength );
            }

            if ( current > 0 ) {
                result = true;
            } else if ( current < total ) {
                result = true;
            }
        }

        return result;
    },

    //아이템 이동
    _moveItems: function ( idx, motionType, isCorrect, isSilent ) {
        var nextPos = this._getCorrectEndpoint( this._indexToPosition(idx), idx ),
            isUnaltered = this._oldOriginIdx === this._originIdx;

        this._pauseTimer();
        this._thumbController.block( true ).setIndex( this._originIdx, idx );

        if ( motionType === 'slide' ) {
            ixSnack.move( this._$ul, nextPos + 'px', this._options, $B.bind(this._moveComplete, this), {idx: idx, isCorrect: isCorrect, isSilent: isSilent, isUnaltered: isUnaltered} );
        } else {
            ixSnack.moveTo( this._$ul, nextPos + 'px', this._options, $B.bind(this._moveComplete, this), {idx: idx, isCorrect: isCorrect, isSilent: isSilent, isUnaltered: isUnaltered} );
        }

        this._$items.each( $B.bind(function ( i, el ) {
            var $item = $( el );

            if ( i >= idx && i < (idx + this._options.viewLength) ) {
                $item.attr( 'aria-hidden', false );
            } else {
                $item.attr( 'aria-hidden', true );
            }
        }, this));

        this._currentPos = nextPos;
        this._selectIdx = idx;
        this._oldOriginIdx = this._originIdx;
    },

    _moveComplete: function (e) {
        if ( !e.data.isCorrect && this._listIndexManager ) {
            this._listIndexManager.correct( e.data.idx );
        }

        this._thumbController.block( false );
        this._playTimer();

        if ( !e.data.isSilent && !e.data.isCorrect ) {
            if ( !e.data.isUnaltered ) this._dispatch( 'change' );
            this._dispatch( 'slideEnd' );
            this._directionType = 'none';
        }
    },

    _getCorrectEndpoint: function ( pos, idx ) {
        if ( this._originLength > this._options.viewLength ) {
            if ( this._options.correctEndpoint && !this._options.loop && !this._options.paging && this._endpoint ) {
                var isOverPos = ( (this._totalLength - idx) * this._itemSize + this._options.correctEndpoint ) < this._viewportSize;
                if ( isOverPos ) pos = -( this._totalLength * this._itemSize - this._viewportSize + this._options.correctEndpoint );
            }
        }
        return pos;
    },

    _removeWaiAria: function () {
        this._$items.removeAttr( 'aria-hidden' );
    },

    _removeEvents: function () {
        this._$target.off( 'mouseover mouseout', this._mouseHandler );
        this._thumbController.clear();
        if ( this._swipe ) this._swipe.clear();
    },

    _setAutoPlay: function () {
        if ( !this._options.autoPlay || !this._totalLength ) return;

        this._timer = new $B.utils.Timer( this._options.delay, 0 )
            .addListener( 'timer', $B.bind(function (e) {
                if ( this._options.opposite ) {
                    this._prev( null, true );
                } else {
                    this._next( null, true );
                }
            }, this)).start();
    },

    //좌표 반환
    _indexToPosition: function ( idx ) {
        return -( idx * this._itemSize  );
    },

    //ul, li, viewport 사이즈 설정
    _setSize: function () {
        if ( this._options.viewportRatio ) this._$viewport.css( 'height', this._getViewportHeight() + 'px' );
        if ( !this._totalLength ) return;

        var sizeProp, viewportSizeProp, marginProps, itemStyle = {}, ulStyle = {},
            itemMargins = this._getItemMargins(), itemMarginTotal = itemMargins[0] + itemMargins[1];

        this._itemSize = this._getItemSize();
        if ( !this._options.includeMargin ) this._itemSize += itemMarginTotal;

        if ( this._options.axis === 'horizontal' ) {
            sizeProp = 'width';
            viewportSizeProp = 'innerWidth';
            marginProps = ['marginLeft', 'marginRight'];
        } else {
            sizeProp = 'height';
            viewportSizeProp = 'innerHeight';
            marginProps = ['marginTop', 'marginBottom'];
        }

        ulStyle[sizeProp] = ( this._itemSize * this._totalLength + 100 ) + 'px';
        itemStyle[sizeProp] = ( this._itemSize - itemMarginTotal )   + 'px';
        itemStyle[marginProps[0]] = itemMargins[0] + 'px';
        itemStyle[marginProps[1]] = itemMargins[1] + 'px';
        if ( this._totalLength > this._options.viewLength ) ulStyle[marginProps[0]] = this._options.datumPoint;

        this._$items.css( itemStyle );
        this._$ul.css( ulStyle );

        this._viewportSize = this._$viewport[viewportSizeProp]();

		//correctEndpoint px을 % 단위 변환
		if ( typeof this._options.correctEndpoint === 'string' ) {
			if ( /\%/.test(this._options.correctEndpoint) ) {
				this._options.correctEndpoint = this._viewportSize * ( parseFloat(this._options.correctEndpoint) / 100 );
			} else {
				this._options.correctEndpoint = parseFloat( this._options.correctEndpoint );
			}
		}
    },

    _getViewportHeight: function () {
        return $B( this._$viewport.get(0) ).rect().width * ( this._options.viewportRatio[1].value / this._options.viewportRatio[0].value );
    },

    //외부에서 origin index로 설정
    _selectOriginIdx: function ( originIdx, direction ) {
		if (originIdx > this._originLength || originIdx < 0 || this._originIdx == originIdx) return;

		if (direction === 'next') {
			this._next( Math.abs(originIdx - this._originIdx), true);
		} else if (direction === 'prev') {
			this._prev( Math.abs(this._originIdx - originIdx), true);
		} else {
			if (this._originIdx < originIdx) {
				this._next(originIdx - this._originIdx, true);
			} else if (this._originIdx > originIdx) {
				this._prev(this._originIdx - originIdx, true);
			}
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

    _getItemSize: function () {
        if ( this._options.itemSize ) {
            return this._options.itemSize.value;
        } else {
            var type = ( this._options.axis === 'horizontal' )? 'width' : 'height';
            return $B( this._$items.get(0) ).rect()[type];
        }
    },

    _removeSize: function () {
        this._$viewport.attr( 'style', '' );
        this._$ul.attr( 'style', '' );
        this._$items.attr( 'style', '' );
    },

    _playTimer: function () {
        if ( !this._isTimerBlock && this._timer ) this._timer.reset().start();
    },

    _pauseTimer: function () {
        if ( this._timer ) this._timer.stop();
    },

    _dispatch: function ( type ) {
        var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? this._endpoint : undefined;
        this._$target.triggerHandler( {type: 'ixSlideMax:' + type, currentIndex: this._originIdx, totalLength: this._originLength, endpoint: endpoint, direction: this._directionType} );
    }
}, 'ixSnack.SlideMax');