/**
 * Range Slider
 * @param   {jQueryObject}    $target
 * @constructor
 */
ixSnack.RangeSlider = ixSnack.BaseClass.extend({
    initialize: function ( $target ) {
        this._$target = $target;
        this._$minInput = this._$target.find( '.ix-min-input' );
        this._$maxInput = this._$target.find( '.ix-max-input' );
        this._$minIcon = this._$target.find( '.ix-min-icon' );
        this._$maxIcon = this._$target.find( '.ix-max-icon' );
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

        if ( typeof this._options.disable === 'string' ) {
            this.disable( this._options.disable );
        } else if ( this._options.disable ) {
            this.disable();
        }

        this._dispatch( 'init', false );
    },

    // =============== Public Methods =============== //

    changeValues: function ( val ) {
        if ( $B.isArray(val) && val.length === 2 ) {
            var values = this._correctValues( val );
            this._minSlider.max( values[1] ).value( values[0] );
            this._maxSlider.min( values[0] ).value( values[1] );
        }
    },

    getValues: function () {
        return [this._minSlider.value(), this._maxSlider.value()];
    },

    enable: function ( type ) {
        if ( !type || type === 'min' ) this._minSlider.enable();
        if ( !type || type === 'max' ) this._maxSlider.enable();

        if ( !this._minSlider.isDisabled() && !this._maxSlider.isDisabled() ) {
            this._$target.removeClass( 'disabled' );
            this._disabled = false;
        }

        this._setTouchAction( this._options.axis === 'horizontal'? 'pan-y' : 'pan-x' );
    },

    disable: function ( type ) {
        if ( !type || type === 'min' ) this._minSlider.disable();
        if ( !type || type === 'max' ) this._maxSlider.disable();

        if ( this._minSlider.isDisabled() && this._maxSlider.isDisabled() ) {
            this._$target.addClass( 'disabled' );
            this._disabled = true;
            this._setTouchAction( 'auto' );
        }
    },

    clear: function () {
        this._removeEvents();
        this.enable();
        if ( this._gAxis ) this._gAxis.clear();
        if ( this._minSlider ) this._minSlider.clear();
        if ( this._maxSlider ) this._maxSlider.clear();
        ixSnack.removePlugin( this._$target, 'range-slider' );
    },

    // =============== Private Methods =============== //

    _setOptions: function () {
        if ( this._options.values && this._options.values.length > 1 ) {
            this._options.values = [this._options.values[0].value, this._options.values[1].value];
        } else {
            this._options.values = [this._options.min, this._options.max];
        }

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

        this._options.values = this._correctValues( this._options.values );
    },

    _correctValues: function ( values ) {
        var minValue = values[0],
            maxValue = values[1];

        if ( minValue < this._options.min ) minValue = this._options.min;
        if ( maxValue > this._options.max ) maxValue = this._options.max;
        if ( minValue > maxValue ) minValue = maxValue;

        return [minValue, maxValue];
    },

    _setEvents: function () {
        this._onTouch = $B.bind( this._touchHandler, this );
        this._onDrag = $B.bind( this._dragHandler, this );

        this._minSlider = new ixSnack.BaseSlider( this._$minIcon, this._$minInput, this._options );
        this._minSlider.addListener( 'change', $B.bind( function (e) {
                var isChange = this._isChangeValue( e.value, this._maxValue );
                this._minValue = e.value;
                this._currentPer = this._minSlider.percent();

                this._setProgress();

                if ( e.isUserInput ) this._dispatch( 'slideStart', true, this._minSlider.type() );
                if ( this._maxSlider ) this._maxSlider.min( e.value, e.currentValue );
                if ( isChange ) this._dispatch( 'change', e.isUserInput || this._isMouseDown, this._minSlider.type() );
                if ( this._isMouseUp || e.isUserInput ) {
                    this._dispatch( 'slideEnd', true, this._minSlider.type() );
                }
            }, this))
            .addListener( 'mouseup', $B.bind( function (e) {
                this._currentPer = this._minSlider.percent();
                this._setProgress( true );
            }, this))
            .type( 'min' ).min( this._options.min ).max( this._options.values[1] ).value( this._options.values[0] ).setEvents();

        this._maxSlider = new ixSnack.BaseSlider( this._$maxIcon, this._$maxInput, this._options );
        this._maxSlider.addListener( 'change', $B.bind( function (e) {
                var isChange = this._isChangeValue( this._minValue, e.value );
                this._maxValue = e.value;
                this._currentPer = this._maxSlider.percent();

                this._setProgress();

                if ( e.isUserInput ) this._dispatch( 'slideStart', true, this._maxSlider.type() );
                if ( this._minSlider ) this._minSlider.max( e.value, e.currentValue );
                if ( isChange ) this._dispatch( 'change', e.isUserInput || this._isMouseDown, this._maxSlider.type() );
                if ( this._isMouseUp || e.isUserInput ) {
                    this._dispatch( 'slideEnd', true, this._maxSlider.type() );
                }
            }, this))
            .addListener( 'mouseup', $B.bind( function (e) {
                this._currentPer = this._maxSlider.percent();
                this._setProgress( true );
            }, this))
            .type( 'max' ).min( this._options.values[0] ).max( this._options.max ).value( this._options.values[1] ).setEvents();

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

                var currentPer = this._pxToPercent( this._getEventPos(e) );
                this._isMouseDown = true;
                this._activeSlider = this._getNearSlider( currentPer );

                this._dispatch( 'slideStart', true, this._activeSlider.type() );
                this._activeSlider.percent( currentPer );
                break;
            case 'touchcancel':
            case 'touchend':
                this._isMouseUp = true;
                this._docTouchEvent.removeListener();

                var currentPer = ( this._options.axis === 'horizontal' )? this._currentPer : 100 - this._currentPer;
                this._activeSlider.percent( currentPer, true );
                break;
            case 'touchmove':
                this._activeSlider.percent( this._pxToPercent(this._getEventPos(e)) );
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

                this._activeSlider = this._getNearSlider( currentPer );
                this._dispatch( 'slideStart', true, this._activeSlider.type() );
                this._activeSlider.percent( currentPer );
                break;
            case 'mouseup':
                this._isMouseUp = true;
                $( document ).off( 'mousemove', this._onDrag );
                $( document ).off( 'mouseup', this._onDrag );
                this._activeSlider.percent( currentPer, true );
                break;
            case 'mousemove':
                this._activeSlider.percent( currentPer );
                break;
        }
    },

    _setProgress: function ( isMouseUp ) {
        if ( !this._minSlider || !this._maxSlider ) return;

        var posPer, sizePer, style = {};

        if ( this._options.axis === 'horizontal' ) {
            posPer = this._minSlider.percent();
            sizePer = this._maxSlider.percent();
        } else {
            posPer = this._maxSlider.percent();
            sizePer = this._minSlider.percent();
        }

        style[this._offsetProp] = posPer + '%';
        style[this._sizeProp] = ( sizePer - posPer ) + '%';

        if ( isMouseUp && this._options.correctEndpoint && this._options.duration ) {
            this._$progress.stop().animate( style, this._options.duration );
        } else {
            this._$progress.stop().css( style );
        }
    },

    _isChangeValue: function ( minValue, maxValue ) {
        return ( this._minValue != minValue || this._maxValue != maxValue );
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

    _removeEvents: function () {
        if ( this._docTouchEvent ) this._docTouchEvent.clear();
        if ( this._touchEvent ) this._touchEvent.clear();
        this._setTouchAction( 'auto' );

        this._$slideBar.off( 'mousedown', this._onDrag );
        $( document ).off( 'mousemove mouseup', this._onDrag );
    },

    _getEventPos: function (e) {
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

    _getNearSlider: function ( per ) {
        var result = this._minSlider,
            min = this._minSlider.percent(),
            max = this._maxSlider.percent(),
            percent = ( this._options.axis === 'horizontal' )? per : 100 - per,
            minGap = Math.abs( min - percent ),
            maxGap = Math.abs( max - percent );

        if ( this._minSlider.isDisabled() || this._maxSlider.isDisabled() ) {
            if ( this._minSlider.isDisabled() ) result =  this._maxSlider;
        } else {
            if ( minGap === maxGap ) {
                if ( this._options.axis === 'horizontal' ) {
                    if ( this._currentPer < percent ) result = this._maxSlider;
                } else {
                    if ( this._currentPer > percent ) result = this._maxSlider;
                }
            } else if ( minGap > maxGap ) {
                result = this._maxSlider;
            }
        }

        return result.focus();
    },

    _dispatch: function ( type, isUser, sliderType ) {
        if ( type === 'init' ) {
            this._isInit = true;
        } else {
            if ( !this._isInit ) return;
        }

        if ( type === 'slideEnd' ) {
            this._isMouseDown = false;
            this._isMouseUp = false;
        }

        this._$target.triggerHandler( {type: 'ixRangeSlider:' + type, values: this.getValues(), userInteraction: isUser, currentType: sliderType} );
    }
}, 'ixSnack.RangeSlider');