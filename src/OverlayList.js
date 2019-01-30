/**
 * Overlay List
 * @param   {jQueryObject}    $target
 * @constructor
 */
ixSnack.OverlayList = ixSnack.BaseClass.extend({
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
        this._directionType = 'none';
        this._currentPos = 0;

        this._getItems();
        this._setItems();
        this._setSize();
        this._setAutoPlay();
        this._setEvents();

        this._options.motionType = this._options.motionType || 'overlay';
        this._options.originLength = this._totalLength;
        this._options.totalLength = this._totalLength;
        if ( this._options.defaultIndex >= this._totalLength || this._options.defaultIndex < 0 ) this._options.defaultIndex = 0;
        if ( !this._options.duration ) this._options.duration = 400;
        if ( this._options.motionType === 'slide' && this._totalLength < 3 ) this._options.loop = false;

        this._motion = this._getMotion()
            .addListener( 'motionMove', $B.bind(function (e) {
                this._dispatch( 'touchMove' );
            }, this))
            .addListener( 'motionEnd', $B.bind(this._motionHandler, this) );


        this._thumbController = new ixSnack.ThumbController( this._$target, this._options )
            .setIndex( this._options.defaultIndex, this._options.defaultIndex )
            .addListener( 'next', $B.bind(this._thumbHandler, this) )
            .addListener( 'prev', $B.bind(this._thumbHandler, this) )
            .addListener( 'index', $B.bind(this._thumbHandler, this) );

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
			this.next(idx, 'changeIndex');
		} else if (direction === 'prev') {
			this.prev(idx, 'changeIndex');
		} else {
			if (this._selectIdx < idx) {
				this.next(idx, 'changeIndex');
			} else if (this._selectIdx > idx) {
				this.prev(idx, 'changeIndex');
			}
		}
    },

    next: function ( selectIdx, state ) {
        if ( this._disabled || this._thumbController.block() || !this._totalLength ) return;
        var idx = this._motion.correctSelectIdx( (typeof selectIdx === 'number')? selectIdx : this._selectIdx + 1 );

        if ( this._selectIdx != idx ) {
            this._directionType = 'next';
            this._dispatch( 'slideStart' );
            this._pauseTimer();
            this._thumbController.block( true ).setIndex( idx, idx );
            this._motion.next( idx, state === 'changeIndex' );
        }
    },

    prev: function ( selectIdx, state ) {
        if ( this._disabled || this._thumbController.block() || !this._totalLength ) return;
        var idx = this._motion.correctSelectIdx( (typeof selectIdx === 'number')? selectIdx : this._selectIdx - 1 );

        if ( this._selectIdx != idx ) {
            this._directionType = 'prev';
            this._dispatch( 'slideStart' );
            this._pauseTimer();
            this._thumbController.block( true ).setIndex( idx, idx );
            this._motion.prev( idx, state === 'changeIndex' );
        }
    },

    clear: function () {
        this._directionType = 'none';
        this._pauseTimer();
        this._removeEvents();
        this._removeStyle();
        this._$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
        ixSnack.removePlugin( this._$target, 'overlay-list' );
        this._removeWaiAria();
    },

    resize: function () {
        if ( !this._totalLength ) return;

        this._pauseTimer();
        this._removeSize();
        this._motion.resize();
        this._setSize();
        this._playTimer();
    },

    // =============== Private Methods =============== //

    _motionHandler: function (e) {
        var oldIdx = this._selectIdx;

        this._thumbController.block( false );
        this._playTimer();
        this._selectIdx = e.idx;

        if ( !e.isSilent ) {
            if ( oldIdx !== this._selectIdx ) this._dispatch( 'change' );
            this._dispatch( 'slideEnd' );
            this._directionType = 'none';
        }
    },

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

    _getMotion: function () {
        var motion;

        switch ( this._options.motionType ) {
            case 'overlay':
                motion = new ixSnack.OverlayList.OverlayMotion( this._$target, this._$ul, this._$items, this._options );
                break;
            case 'slide':
                motion = new ixSnack.OverlayList.SlideMotion( this._$target, this._$ul, this._$items, this._options );
                break;
            case 'mask':
                motion = new ixSnack.OverlayList.MaskMotion( this._$target, this._$ul, this._$items, this._options );
                break;
            default :
                motion = new ixSnack.OverlayList.Motion( this._$target, this._$ul, this._$items, this._options );
                break;
        }

        return motion;
    },

    _removeSize: function (  ) {
        var sizeProp = ( this._options.axis === 'horizontal' ) ? 'width' : 'height';
        this._$viewport.attr( 'style', '' );
        this._$ul.css( sizeProp, '' );
        this._$items.css( sizeProp, '' ).css( 'margin', '' );
    },

    _getItems: function () {
        this._$items = this._$ul.find( '> .ix-list-item' );
        this._totalLength = this._$items.length;
    },

    //아이템 origin 갯수 대비 실제 갯수 설정
    _setItems: function () {
        this._$items.each( function ( idx, el ) {
            //origin-index 속성 추가
            $( el ).attr( 'data-idx', idx );
        });

        if ( this._options.motionType !== 'mask' ) {
            this._$items.css({
                position: 'absolute'
            });
        }
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

    _setEvents: function () {
        var moveProp = ( this._options.axis === 'horizontal' )? 'moveX' : 'moveY';

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
                    if ( !this._thumbController.block() ) {
                        this._motion.move( e );
                    }
                }, this))
                .addListener( 'swipe', $B.bind(function (e) {
                    if ( this._thumbController.block() ) return;
                    this._dispatch( 'touchEnd' );

                    //이동값이 변동이 없으면 transitionend 이벤트가 발생하지 않기 때문
                    if ( e[moveProp] === 0 ) {
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

    _targetSwipe: function ( type ) {
        if ( type === 'left' || type === 'up' ) {
            this.next();
        } else if ( type === 'right' || type === 'down' ) {
            this.prev();
        } else {
            this._dispatch( 'slideStart' );
            this._pauseTimer();
            this._thumbController.block( true );
            this._motion.none();
        }
    },

    _removeWaiAria: function () {
        this._$items.removeAttr( 'aria-hidden' );
    },

    _setSize: function () {
        if ( this._options.viewportRatio ) this._$viewport.css( 'height', this._getViewportHeight() + 'px' );
    },

    _getViewportHeight: function () {
        return $B( this._$viewport.get(0) ).rect().width * ( this._options.viewportRatio[1].value / this._options.viewportRatio[0].value );
    },

    _removeStyle: function () {
        this._$viewport.attr( 'style', '' );
        this._$items.attr( 'style', '' );
    },

    _removeEvents: function () {
        this._$target.off( 'mouseover mouseout', this._mouseHandler );
        this._thumbController.clear();
        if ( this._swipe ) this._swipe.clear();
        if ( this._motion ) this._motion.clear();
    },

    _playTimer: function () {
        if ( !this._isTimerBlock && this._timer ) this._timer.reset().start();
    },

    _pauseTimer: function () {
        if ( this._timer ) this._timer.stop();
    },

    _dispatch: function ( type ) {
        var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? this._motion.isEndpoint() : undefined,
            currentIndex = this._selectIdx;

        if ( !this._totalLength ) currentIndex = NaN;
        this._$target.triggerHandler( {type: 'ixOverlayList:' + type, currentIndex: currentIndex, totalLength: this._totalLength, endpoint: endpoint, direction: this._directionType, displacement: this._motion.displacement()} );
    }
}, 'ixSnack.OverlayList');