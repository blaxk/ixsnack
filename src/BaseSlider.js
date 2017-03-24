/**
 * Base Slider
 * Event : change, mouseup
 * @param   {jQueryObject}    $icon
 * @param   {jQueryObject}    $input
 * @param   {Object}          options
 * @constructor
 */
ixSnack.BaseSlider = $B.Class.extend({
    initialize: function ( $icon, $input, options ) {
        this._$icon = $icon;
        this._$input = $input;
        this._options = options || {};
        this._disabled = false;
        this._offsetProp = ( this._options.axis === 'horizontal' )? 'left' : 'top';
    },

    // =============== Public Methods =============== //

    setEvents: function () {
        this._inputKeyHandler = $B.bind(function (e) {
            switch ( e.type ) {
                case 'keydown':
                    if ( this._isPermissionKeyCode( e.which ) ) {
                        if ( this._isEnterKey( e.which ) ) {
                            var value = this._value;
                            this._setInputValue( false, true, true );
                            if ( value != this._value ) this.value( this._value, false, true );
                        }
                    } else {
                        e.preventDefault();
                    }
                    break;
                case 'focusin':
                    this._setInputValue( true, false, true );
                    break;
                case 'focusout':
                    var value = this._value;
                    this._setInputValue( false, true, true );
                    if ( value != this._value ) this.value( this._value, false, true );
                    break;
            }
        }, this);

        this._iconKeyHandler = $B.bind(function (e) {
            if ( this._disabled ) return;
            var arrowKeyType = this._getArrowKeyType( e.which );

            if ( arrowKeyType ) e.preventDefault();

            if ( arrowKeyType === 'forward' ) {
                this.value( this._value + this._options.gap, false, true );
            } else if ( arrowKeyType === 'backward' ) {
                this.value( this._value - this._options.gap, false, true );
            }
        }, this);

        this._$input.on( 'keydown focusin focusout', this._inputKeyHandler );
        this._$icon.on( 'keydown', this._iconKeyHandler );

        return this;
    },

    type: function ( val ) {
        if ( val ) {
            this._type = val;
            return this;
        } else {
            return this._type;
        }
    },

    min: function ( val, moveVal ) {
        if ( typeof val === 'number' ) {
            this._min = val;
            this._moveMin = ( typeof moveVal === 'number' )? moveVal : val;
            return this;
        } else {
            return this._min;
        }
    },

    max: function ( val, moveVal ) {
        if ( typeof val === 'number' ) {
            this._max = val;
            this._moveMax = ( typeof moveVal === 'number' )? moveVal : val;
            return this;
        } else {
            return this._max;
        }
    },

    value: function ( val, isAni, isUserInput ) {
        if ( typeof val === 'number' ) {
            if ( !isNaN(val) ) {
                var isViewStr = ( typeof isUserInput === 'boolean'? isUserInput : true );

                if ( (this._options.correctEndpoint && isAni) || this._options.snap ) {
                    this._value = this._valueToGapValue( val );
                } else {
                    this._value = this._correctMoveValue( val );
                }

                this._setInputValue( true, isViewStr, false );
                this._move( this._valueToPercent(this._value), isAni, isUserInput );
            }
            return this;
        } else {
            return this._valueToGapValue( this._value );
        }
    },

    percent: function ( per, isAni ) {
        if ( typeof per === 'number' ) {
            per = this._correctPercent( per );
            this.value( this._percentToValue(per), isAni );
            return this;
        } else {
            return this._percent;
        }
    },

    enable: function () {
        this._disabled = false;
        this._$icon.removeClass( 'disabled' );
        this._$input.attr( 'disabled', false );
        return this;
    },

    disable: function () {
        this._disabled = true;
        this._$icon.addClass( 'disabled' );
        this._$input.attr( 'disabled', true );
        return this;
    },

    focus: function () {
        this._$icon.focus();
        return this;
    },

    clear: function () {
        this._removeEvents();
        return this;
    },

    isDisabled: function () {
        return this._disabled;
    },

    dispatch: function ( type, isUserInput ) {
        $B.Class.prototype.dispatch.call( this, type, {value: this.value(), currentValue: this._value, isUserInput: isUserInput})
        return this;
    },

    // =============== Private Methods =============== //

    _move: function ( percent, isAni, isUserInput ) {
        var moveProp = {},
            posPer = ( this._options.axis === 'horizontal' )? percent : 100 - percent;

        moveProp[this._offsetProp] = posPer + '%';
        this._percent = posPer;

        if ( isAni ) {
            this._$icon.stop().animate( moveProp, this._options.duration, $B.bind(function () {
                this.dispatch( 'change', isUserInput );
            }, this));

            if ( this._options.correctEndpoint && this._options.duration ) this.dispatch( 'mouseup' );
        } else {
            this._$icon.stop().css( moveProp );
            this.dispatch( 'change', isUserInput );
        }
    },

    //최소, 최대값 보정
    _correctValue: function ( value ) {
        if ( value < this._min ) {
            value = this._min;
        } else if ( value > this._max ) {
            value = this._max;
        }

        return value;
    },

    _correctMoveValue: function ( value ) {
        if ( value < this._moveMin ) {
            value = this._moveMin;
        } else if ( value > this._moveMax ) {
            value = this._moveMax;
        }

        return value;
    },

    _correctPercent: function ( percent ) {
        if ( percent < 0 ) {
            percent = 0;
        } else if ( percent > 100 ) {
            percent = 100;
        }

        return percent;
    },

    _setInputValue: function ( isValue, isViewStr, isInput ) {
        var value = this._value;

        if ( !isValue ) {
            value = this._$input.val();
            if ( !this._isNumber(value) ) value = this._value;
        }

        var rangeValue = this._valueToGapValue( value ),
            viewString = rangeValue;

        if ( isViewStr ) {
            viewString = this._options.addFirstStr + this._valueToNumberFormat( viewString ) + this._options.addLastStr;
        }

        this._$input.val( viewString );

        if ( isInput ) {
            this._value = this._correctMoveValue( rangeValue );
        }
    },

    _valueToGapValue: function ( value ) {
        var result = Math.round( value / this._options.gap ) * this._options.gap,
            nextValue = result + this._options.gap,
            prevValue = result - this._options.gap,
            rest = 0;

        if ( this._options.gap ) {
            if ( (nextValue > this._options.max) && (result < value) ) {
                rest = this._max - result;

                if ( rest ) {
                    result += Math.round( (value - result) / rest ) * rest;
                }
            } else if ( (prevValue < this._options.min) && (result > value) ) {
                rest = this._min - result;

                if ( rest ) {
                    result += Math.round( (value - result) / rest ) * rest;
                }
            }
        } else {
            result = value;
        }

        return this._correctValue( result );
    },

    _percentToValue: function ( per ) {
        return ( (per / 100) * (this._options.max - this._options.min) ) + this._options.min;
    },

    _valueToPercent: function ( value ) {
        return ( value - this._options.min ) / ( this._options.max - this._options.min ) * 100;
    },

    _valueToNumberFormat: function ( value ) {
        if ( this._options.numberFixed ) {
            value = Number( value ).toFixed( this._options.numberFixed );
        }

        if ( this._options.numberFormat ) {
            value = $B.string.numberFormat( value );

            if ( this._options.currencyFormat ) {
                value = this._getCurrencyFormat( value, this._options.currencyFormat );
            }
        }
        return value;
    },

    _getCurrencyFormat: function ( value, country ) {
        switch ( country ) {
            case 'de':
            case 'es':
            case 'nl':
            case 'it':
            case 'be':
                value = value.replace( /[.,]/g, function ( str ) {
                    return ( str === ',' )? '.' : ',';
                });
                break;
            case 'no':
            case 'fr':
            case 'sk':
            case 'pl':
                value = value.replace( /[.,]/g, function ( str ) {
                    return ( str === ',' )? ' ' : ',';
                });
                break;
        }

        return value;
    },

    _isPermissionKeyCode: function ( keyCode ) {
        //android는 input의 pattern속성을 넣어서 처리해 줘야 한다.
        if ( $B.ua.ANDROID ) {
            return true;
        } else {
            //숫자키, 백스페이스, Delete, Tab, Shift, enter, -, ., 화살표키
            return ( (keyCode > 47 && keyCode < 58) || (keyCode > 95 && keyCode < 106)
            || keyCode == 8 || keyCode == 9 || keyCode == 16 || keyCode == 46 || this._isEnterKey(keyCode)
            || (keyCode == 189 || keyCode == 109) || (keyCode == 190 || keyCode == 110) || this._getArrowKeyType(keyCode) );
        }
    },

    _getArrowKeyType: function ( keyCode ) {
        var result = undefined;
        if ( keyCode == 37 || keyCode == 40 ) {
            result = 'backward';
        } else if ( keyCode == 38 || keyCode == 39 ) {
            result = 'forward';
        }
        return result;
    },

    _isNumber: function ( value ) {
        var num = Number( value );
        return ( typeof num === 'number' && !isNaN(num) );
    },

    _isEnterKey: function ( keyCode ) {
        return ( keyCode == 13 );
    },

    _removeEvents: function () {
        this._$input.off( 'keydown focusin focusout', this._inputKeyHandler );
        this._$icon.off( 'keydown', this._iconKeyHandler );
    }
}, 'ixSnack.BaseSlider');