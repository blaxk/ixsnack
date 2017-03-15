/**
 * Overlay List
 * @param   {jQueryObject}    $target
 * @constructor
 */
ixSnack.OverlayList = $B.Class.extend({
    initialize: function ( $target ) {
        this._$target = $target;
        this._$viewport = this._$target.find( '> .ix-list-viewport' );
        this._$ul = this._$viewport.find( '> .ix-list-items' );
        this._options = ixSnack.getOptions( this._$target.attr('data-ix-options') );

        this._selectIdx = 0;
        this._disabled = false;
        this._isTimerBlock = false;
        this._directionType = 'none';

        this._getItems();
        this._setItems();
        this._setSize();
        this._setAutoPlay();
        this._setEvents();

        this._options.originLength = this._totalLength;
        this._options.totalLength = this._totalLength;
        if ( this._options.defaultIndex >= this._totalLength || this._options.defaultIndex < 0 ) this._options.defaultIndex = 0;
        if ( this._options.motionType === 'slide' ) this._options.motionType = 'overlay';
        if ( !this._options.duration ) this._options.duration = 400;

        this._thumbController = new ixSnack.ThumbController( this._$target, this._options )
            .setIndex( this._options.defaultIndex, this._options.defaultIndex )
            .addListener( 'next', $B.bind(this._thumbHandler, this) )
            .addListener( 'prev', $B.bind(this._thumbHandler, this) )
            .addListener( 'index', $B.bind(this._thumbHandler, this) );

        this._overlayItem( this._options.defaultIndex, 'none', true );
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

    changeIndex: function ( idx ) {
        if ( idx > this._totalLength || idx < 0 || !this._totalLength ) return;

        if ( this._selectIdx < idx ) {
            this.next( idx );
        } else if ( this._selectIdx > idx ) {
            this.prev( idx );
        }
    },

    next: function ( selectIdx ) {
        if ( this._disabled || this._thumbController.block() || !this._totalLength ) return;
        var idx = this._correctSelectIdx( (typeof selectIdx === 'number')? selectIdx : this._selectIdx + 1 );

        if ( this._selectIdx != idx ) {
            this._directionType = 'next';
            this._dispatch( 'slideStart' );
            this._overlayItem( idx, this._options.motionType );
        }
    },

    prev: function ( selectIdx ) {
        if ( this._disabled || this._thumbController.block() || !this._totalLength ) return;
        var idx = this._correctSelectIdx( (typeof selectIdx === 'number')? selectIdx : this._selectIdx - 1 );

        if ( this._selectIdx != idx ) {
            this._directionType = 'prev';
            this._dispatch( 'slideStart' );
            this._overlayItem( idx, this._options.motionType );
        }
    },

    clear: function () {
        this._directionType = 'none';
        this._pauseTimer();
        this._removeEvents();
        this._removeStyle();
        this._$ul.stop();
        this._$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
        ixSnack.removePlugin( this._$target, 'overlay-list' );
        this._removeWaiAria();
    },

    getCurrentIndex: function () {
        return this._selectIdx;
    },

    getTotalLength: function () {
        return this._totalLength;
    },

    enable: function () {
        if ( this._swipe ) this._swipe.enable();
        this._thumbController.enable();
        this._disabled = false;
    },

    disable: function () {
        if ( this._swipe ) this._swipe.disable();
        this._thumbController.disable();
        this._disabled = true;
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

    _getItems: function () {
        this._$items = this._$ul.find( '> .ix-list-item' );
        this._totalLength = this._$items.length;
    },

    //아이템 origin 갯수 대비 실제 갯수 설정
    _setItems: function () {
        this._$items.each( function ( idx, el ) {
            //origin-index 속성 추가
            $( el ).attr( 'data-idx', idx );
        }).css({
            position: 'absolute'
        });
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
        if ( !this._options.touchDisable && $B.ua.TOUCH_DEVICE && this._totalLength > 1 ) {
            this._swipe = new $B.event.Swipe( this._$viewport.get(0), {
                axis: this._options.axis,
                //TODO: Safari v10~ preventDefault issue 임시방편 해결 필요
                preventDefault: this._options.axis === 'vertical' && $B.ua.SAFARI && parseFloat( $B.ua.VERSION ) > 9
            }).sensitivity( this._options.swipeSensitivity )
                .addListener( 'axis', $B.bind(function (e) {
                    if ( this._thumbController.block() ) return;
                    this._pauseTimer();
                    this._dispatch( 'touchStart' );
                }, this))
                .addListener( 'move', $B.bind(function (e) {
                    //if ( this._thumbController.block() ) return;
                    //if ( this._options.motionType === 'slide' ) this._touchMove( e );
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

    _targetSwipe: function ( type ) {
        if ( type === 'left' || type === 'up' ) {
            this.next();
        } else if ( type === 'right' || type === 'down' ) {
            this.prev();
        } else {
            this._playTimer();
        }
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

    _removeWaiAria: function () {
        this._$items.removeAttr( 'aria-hidden' );
    },

    //아이템 이동
    _overlayItem: function ( idx, motionType, isSilent ) {
        this._pauseTimer();
        this._thumbController.block( true ).setIndex( idx, idx );

        if ( motionType === 'overlay' ) {
            this._$items.attr( 'aria-hidden', true );
            var $item = this._$items.eq( idx ).show().attr( 'aria-hidden', false );
            ixSnack.opacity( $item, 0, this._options, null, null, true );
            this._$ul.append( $item );
            ixSnack.opacity( $item, 1, this._options, $B.bind(this._overlayComplete, this), {idx: idx, isSilent: isSilent} );
        } else {
            this._$items.hide().attr( 'aria-hidden', true ).eq( idx ).show().attr( 'aria-hidden', false );
            this._overlayComplete( {data: {idx: idx, isSilent: isSilent}} );
        }
    },

    _overlayComplete: function (e) {
        var oldIdx = this._selectIdx;

        this._thumbController.block( false );
        this._playTimer();
        this._selectIdx = e.data.idx;

        if ( !e.data.isSilent ) {
            if ( oldIdx !== this._selectIdx ) this._dispatch( 'change' );
            this._dispatch( 'slideEnd' );
            this._directionType = 'none';
        }
    },

    _isEndpoint: function () {
        return ( !this._options.loop && this._selectIdx === this._totalLength - 1 );
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
    },

    _playTimer: function () {
        if ( !this._isTimerBlock && this._timer ) this._timer.reset().start();
    },

    _pauseTimer: function () {
        if ( this._timer ) this._timer.stop();
    },

    _dispatch: function ( type ) {
        var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? this._isEndpoint() : undefined,
            currentIndex = this._selectIdx;

        if ( !this._totalLength ) currentIndex = NaN;
        this._$target.triggerHandler( {type: 'ixOverlayList:' + type, currentIndex: currentIndex, totalLength: this._totalLength, endpoint: endpoint, direction: this._directionType} );
    }
}, 'ixSnack.OverlayList');