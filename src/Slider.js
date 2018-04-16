/**
 * Slider
 * @param   {jQueryObject}    $target
 * @constructor
 */
ixSnack.Slider = ixSnack.BaseClass.extend({
    initialize: function ( $target ) {
        this._$target = $target;
        this._$input = this._$target.find( '.ix-input' );
        this._$icon = this._$target.find( '.ix-icon' );
        this._$slideBar = this._$target.find( '.ix-slider-bar' );
        this._$progress = this._$target.find( '.ix-progress' );
        this._options = ixSnack.getOptions( this._$target.attr('data-ix-options') );

        this._currentPer = 0;
        this._disabled = false;
        this._isInit = false;
        this._isMouseDown = false;
        this._isMouseUp = false;

        this._setOptions();
        this._setEvents();
        this._setProgress();

        if ( this._options.disable ) this.disable();
        this._dispatch( 'init', false );
    },

    // =============== Public Methods =============== //

    changeValue: function ( val ) {
        if ( val ) this._slider.value( this._correctValue(val) );
    },

    getValue: function () {
        return this._slider.value();
    },

    enable: function () {
        this._slider.enable();
        this._$target.removeClass( 'disabled' );
        this._disabled = false;
        this._setTouchAction( this._options.axis === 'horizontal'? 'pan-y' : 'pan-x' );
    },

    disable: function () {
        this._slider.disable();
        this._$target.addClass( 'disabled' );
        this._disabled = true;
        this._setTouchAction( 'auto' );
    },

    clear: function () {
        this._removeEvents();
        this.enable();
        if ( this._gAxis ) this._gAxis.clear();
        if ( this._slider ) this._slider.clear();
        ixSnack.removePlugin( this._$target, 'slider' );
    },

    // =============== Private Methods =============== //

    _setOptions: function () {
        if ( this._options.max < this._options.min ) this._options.max = this._options.min;
        if ( this._options.snap ) this._options.correctEndpoint = false;

        if ( this._options.gap > this._options.max - this._options.min ) {
            this._options.gap = this._options.max - this._options.min;
        }

        if ( this._options.axis === 'horizontal' ) {
            this._offsetProp = 'left';
            this._posProp = 'pageX';
            this._sizeProp = 'width';
        } else {
            this._offsetProp = 'top';
            this._posProp = 'pageY';
            this._sizeProp = 'height';
        }

        if ( typeof this._options.value !== 'number' ) this._options.value = this._options.min;
        this._options.value = this._correctValue( this._options.value );
    },

    _setEvents: function () {
        this._onTouch = $B.bind( this._touchHandler, this );
        this._onDrag = $B.bind( this._dragHandler, this );

        this._slider = new ixSnack.BaseSlider( this._$icon, this._$input, this._options );
        this._slider.addListener( 'change', $B.bind( function (e) {
                var isChange = this._isChangeValue( e.value );
                this._value = e.value;
                this._currentPer = this._slider.percent();

                this._setProgress();

                if ( e.isUserInput ) this._dispatch( 'slideStart', true );
                if ( isChange ) this._dispatch( 'change', e.isUserInput || this._isMouseDown );
                if ( this._isMouseUp || e.isUserInput ) this._dispatch( 'slideEnd', true );
            }, this))
            .addListener( 'mouseup', $B.bind( function (e) {
                this._currentPer = this._slider.percent();
                this._setProgress( true );
            }, this))
            .min( this._options.min ).max( this._options.max ).value( this._options.value ).setEvents();

        if ( $B.ua.TOUCH_DEVICE ) {
            this._touchEvent = new $B.event.TouchEvent( this._$slideBar );
            this._docTouchEvent = new $B.event.TouchEvent( document );

            if ( ixSnack.MS_POINTER ) {
                this._setTouchAction( this._options.axis === 'horizontal'? 'pan-y' : 'pan-x' );
                this._touchEvent.addListener( 'touchstart', this._onTouch );
            } else {
                this._gAxis = new $B.event.GestureAxis( this._$slideBar, {
                        aType: this._options.axis
					    //Safari v10~ preventDefault issue (ixband v1.1.2 에서 해결 됨)
                        //preventDefault: this._options.axis === 'vertical' && $B.ua.SAFARI && parseFloat( $B.ua.VERSION ) > 9
                    })
                    .addListener( 'axis', this._onTouch );

                this._$slideBar.on( 'mousedown', this._onDrag );
            }
        } else {
            this._$slideBar.on( 'mousedown', this._onDrag );
        }
    },

    _touchHandler: function (e) {
        if ( this._disabled ) return;

        var currentPer = 0;

        if ( e.type != 'axis' ) {
            e.preventDefault();
            e.stopPropagation();
        }

        switch ( e.type ) {
            case 'axis':
            case 'touchstart':
                this._docTouchEvent.addListener( 'touchmove', this._onTouch, {passive: false} );
                this._docTouchEvent.addListener( 'touchend', this._onTouch );
                this._docTouchEvent.addListener( 'touchcancel', this._onTouch );

                currentPer = this._pxToPercent( this._getEventPos(e) );
                this._isMouseDown = true;

                this._dispatch( 'slideStart', true );
                this._slider.focus().percent( currentPer );
                break;
            case 'touchcancel':
            case 'touchend':
                this._isMouseUp = true;
                this._docTouchEvent.removeListener();

                currentPer = ( this._options.axis === 'horizontal' )? this._currentPer : 100 - this._currentPer;
                this._slider.percent( currentPer, true );
                break;
            case 'touchmove':
                this._slider.percent( this._pxToPercent(this._getEventPos(e)) );
                break;
        }
    },

    _dragHandler: function (e) {
        if ( this._disabled ) return;
        e.preventDefault();
        e.stopPropagation();

        var currentPer = this._pxToPercent( this._getEventPos(e) );

        switch ( e.type ) {
            case 'mousedown':
                this._isMouseDown = true;
                $( document ).on( 'mousemove', this._onDrag );
                $( document ).on( 'mouseup', this._onDrag );

                this._dispatch( 'slideStart', true );
                this._slider.focus().percent( currentPer );
                break;
            case 'mouseup':
                this._isMouseUp = true;
                $( document ).off( 'mousemove', this._onDrag );
                $( document ).off( 'mouseup', this._onDrag );
                this._slider.percent( currentPer, true );
                break;
            case 'mousemove':
                this._slider.percent( currentPer );
                break;
        }
    },

    _setProgress: function ( isMouseUp ) {
        if ( !this._slider ) return;

        var style = {},
            percent = this._slider.percent(),
            size = ( this._options.axis === 'horizontal' )? percent : 100 - percent,
            pos = ( this._options.axis === 'horizontal' )? 0 : percent;

        style[this._sizeProp] = size + '%';
        style[this._offsetProp] = pos + '%';

        if ( isMouseUp && this._options.correctEndpoint && this._options.duration ) {
            this._$progress.stop().animate( style, this._options.duration );
        } else {
            this._$progress.stop().css( style );
        }
    },

    _isChangeValue: function ( val ) {
        return ( this._value !== val );
    },

    //none, auto
    _setTouchAction: function ( state ) {
        if ( $B.ua.TOUCH_DEVICE && $B.ua.WINDOWS ) {
            this._$slideBar.css({
                '-ms-touch-action': state,
                'touch-action': state
            });

            //마우스로 컨트롤시 드래그 방지
            if ( state == 'auto' ) {
                this._$slideBar.off( 'dragstart', this._dragStartHandler );
            } else {
                this._$slideBar.on( 'dragstart', this._dragStartHandler );
            }
        }
    },

    _dragStartHandler: function (e) {
        e.preventDefault();
    },

    _correctValue: function ( value ) {
        if ( value < this._options.min ) value = this._options.min;
        if ( value > this._options.max ) value = this._options.max;
        return value;
    },

    _removeEvents: function () {
        if ( this._docTouchEvent ) this._docTouchEvent.clear();
        if ( this._touchEvent ) this._touchEvent.clear();
        this._setTouchAction( 'auto' );

        this._$slideBar.off( 'mousedown', this._onDrag );
        $( document ).off( 'mousemove mouseup', this._onDrag );
    },

    _getEventPos: function ( e ) {
        var slidebarPos = this._$slideBar.offset()[this._offsetProp];

        if ( e.type === 'axis' || e.type.indexOf('touch') === -1 ) {
            return e[this._posProp] - slidebarPos;
        } else {
            return e.touches[0][this._posProp] - slidebarPos;
        }
    },

    _pxToPercent: function ( pos ) {
        var percent = pos / this._$slideBar[this._sizeProp]() * 100;
        return ( this._options.axis === 'horizontal' )? percent : 100 - percent;
    },

    _dispatch: function ( type, isUser ) {
        if ( type === 'init' ) {
            this._isInit = true;
        } else {
            if ( !this._isInit ) return;
        }

        if ( type === 'slideEnd' ) {
            this._isMouseDown = false;
            this._isMouseUp = false;
        }

        this._$target.triggerHandler( {type: 'ixSlider:' + type, value: this.getValue(), userInteraction: isUser} );
    }
}, 'ixSnack.Slider');