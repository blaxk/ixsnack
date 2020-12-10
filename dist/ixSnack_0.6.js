/**
 * ixsnack - Javascript Library (jQuery plugin)
 * jQuery v1.9~ (http://jquery.com) + ixBand v1.0~ (http://ixband.com)
 * @version v0.6.4 (2012101609)
 * The MIT License (MIT), http://ixsnack.com
 */
;(function (window) {
    'use strict';

    var SUPPORT_MODULE = ( typeof module === 'object' && typeof module.exports === 'object' ),
    	SUPPORT_WINDOW = ( typeof window === 'object' );
    
    var window = SUPPORT_WINDOW ? window : {},
    	document = SUPPORT_WINDOW ? window.document : {},
    	navigator = SUPPORT_WINDOW ? window.navigator : {};
    
    if ( SUPPORT_MODULE ) {
    	var $B = require('ixband'),
    		$ = require('jquery');
    
    	var ixSnack = {};
    } else {
    	if ( window.ixSnack ) {
    		var MSG_OVERLAP_VARIABLE = '"ixSnack"이 중복 선언되어 정상 동작을 보장할 수 없습니다.';
    
    		if ( console ) {
    			if ( console.warn ) {
    				console.warn( MSG_OVERLAP_VARIABLE );
    			} else {
    				$B.log( MSG_OVERLAP_VARIABLE );
    			}
    		}
    	}
    
    	var ixSnack = window.ixSnack = {},
    		$B = window.ixBand || window.$B,
    		$ = window.jQuery || window.$;
    }
    
    
    
    var ENDPOINT_DECREASE = 0.3,//끝점 감쇠 수치
        SWIPE_SENSITIVITY = 0.5;//swipe 민감도
    
    var _pluginId = 1,
        _pluginPool = {};
    
    /**
     * Plugin에서 사용하는 공통기능
     */
    ixSnack = $B.object.extend(ixSnack, {
        VERSION: '0.6.4',
        MS_POINTER: ( navigator.pointerEnabled || navigator.msPointerEnabled ),
        TRANSFORM: (function () {
            if ( SUPPORT_WINDOW && !($B.ua.MSIE && $B.ua.DOC_MODE_IE10_LT) ) {
                var prefixes = 'transform WebkitTransform'.split( ' ' );
                for ( var i = 0; i < prefixes.length; ++i ) {
                    if ( document.createElement('div').style[prefixes[i]] !== undefined ) {
                        return $B.string.hyphenCase( prefixes[i] );
                    }
                }
            }
    
            return null;
        }()),
    
    	setPlugin: function ( $target, pluginName, plugin, val1, val2, val3 ) {
            //method 호출
            if ( typeof val1 === 'string' ) {
                //getter
                if ( /^get[A-Z]|^is[A-Z]/.test(val1) ) {
    				return ixSnack.callPlugin( $target.eq(0), pluginName, val1, val2, val3 );
                } else {
                    $target.each( function ( idx, el ) {
    					ixSnack.callPlugin( $(el), pluginName, val1, val2, val3 );
                    });
                }
            } else {
                $target.each( function ( idx, el ) {
                    var $el = $( el );
                    if ( !ixSnack.hasPlugin($el, pluginName) ) {
                        //ix-options 입력
                        if ( $B.object.is(val1) ) $el.ixOptions( val1 );
                        ixSnack.addPlugin( $el, pluginName, new plugin($el) );
                    }
                });
            }
    
            return $target;
        },
    
        hasPlugin: function ( $target, pluginName ) {
            return ( $target.prop('ix-' + pluginName) && $target.hasClass('ix-' + pluginName + '-apply') );
        },
    
        addPlugin: function ( $target, pluginName, plugin ) {
            $target.prop( 'ix-' + pluginName, _pluginId ).addClass( 'ix-' + pluginName + '-apply' );
            _pluginPool[_pluginId] = plugin;
            _pluginId++;
        },
    
        removePlugin: function ( $target, pluginName ) {
            $target.removeProp( 'ix-' + pluginName ).removeClass( 'ix-' + pluginName + '-apply' ).removeClass( 'ix-options-apply' );
            delete _pluginPool[$target.prop(pluginName)];
        },
    
    	callPlugin: function ( $target, pluginName, method, val1, val2 ) {
            var pluginId = $target.prop( 'ix-' + pluginName );
            if ( _pluginPool[pluginId] && typeof _pluginPool[pluginId][method] === 'function' ) {
    			return _pluginPool[pluginId][method]( val1, val2 );
            }
        },
    
        objToOptions: function ( optionStr, obj ) {
            for ( var key in obj ) {
                var value = obj[key];
    
                if ( value || typeof value === 'boolean' || typeof value === 'number' ) {
                    var reKey = $B.string.hyphenCase( key ),
                        reg = new RegExp( reKey + '\\s*?:\\s*?([\\w\\-.,\\s\\/?&:=\\(\\)%]+);?', 'gi' );
    
                    if ( reg.test(optionStr) ) {
                        optionStr = optionStr.replace( reg, reKey + ':' + value + ';' );
                    } else {
                        if ( optionStr && !/;\s*?$/.test(optionStr) ) optionStr += ';';
                        optionStr += ' ' + reKey + ':' + value;
                    }
                }
            }
    
            return optionStr;
        },
    
        //options 파싱
        parseOptions: function ( str ) {
            var result = {};
            String( str ).replace( /([a-z\-]+)\s*?:\s*?([\w\-.,\s\/?&:=\(\)%\*\!\~]+);?/g, function ( str, n, v ) {
                if ( n === 'add-first-str' || n === 'add-last-str' ) {
                    result[ $B.string.camelCase(n) ] = {value: decodeURIComponent(v), unit: ''};
                } else {
                    result[ $B.string.camelCase(n) ] = ixSnack.parseOptionValue( $B.string.trim(v) );
                }
            });
            return result;
        },
    
        //option의 value를 값과 단위로 분리, value가 1개 이상이면 배열로 반환
        parseOptionValue: function ( str ) {
            var result = {};
    
            if ( str.indexOf(' ') > -1 ) {
                result = [];
                String( str ).replace( /([-\d\.]+|[a-z-]+)([a-z\%]+)?/g, function ( str, v, u ) {
                    result.push( {value: ixSnack.parseDataType(v), unit: u || ''} );
                });
            } else {
                String( str ).replace( /([-\d\.\s]+|[a-z-]+)([a-z\%]+)?/, function ( str, v, u ) {
                    result = {value: ixSnack.parseDataType(v), unit: u || ''};
                });
            }
    
            return result;
        },
    
        parseDataType: function ( str ) {
            if ( str ) {
                if ( str.indexOf('true') > -1 ) {
                    str = Boolean( str );
                } else if ( str.indexOf('false') > -1 ) {
                    str = Boolean();
                } else if ( /^-*[0-9\.]+$/.test(str) ) {
                    str = Number( str );
                }
            }
            return str;
        },
    
        //data-ix-options 속성을 파싱하여 반환
        getOptions: function ( optionStr ) {
            var opt = ixSnack.parseOptions( optionStr ),
                defaultOpt = {
                    axis: ( opt.axis )? opt.axis.value : 'horizontal',
                    loop: ( opt.loop )? opt.loop.value : true,
                    duration: ( opt.duration )? opt.duration.value : 0,
                    autoPlay: ( opt.autoPlay )? opt.autoPlay.value : false,
                    delay: ( opt.delay )? opt.delay.value : 4000,
                    blockClickEvent: ( opt.blockClickEvent )? opt.blockClickEvent.value : false,
                    viewLength: ( opt.viewLength )? opt.viewLength.value : 1,
                    motionType: ( opt.motionType )? opt.motionType.value : '',
                    viewportRatio: ( opt.viewportRatio )? opt.viewportRatio : null,
                    easing: ( opt.easing )? opt.easing.value : 'ease',
                    itemSize: ( opt.itemSize )? opt.itemSize : null,
                    itemMargin: ( opt.itemMargin )? opt.itemMargin : null,
                    defaultIndex: ( opt.defaultIndex )? opt.defaultIndex.value : 0,
                    datumPoint: ( opt.datumPoint )? opt.datumPoint.value + opt.datumPoint.unit : 0,
                    opposite: ( opt.opposite )? opt.opposite.value : false,
                    paging: ( opt.paging )? opt.paging.value : false,
                    correctEndpoint: ( opt.correctEndpoint )? opt.correctEndpoint.value : false,
                    includeMargin: ( opt.includeMargin )? opt.includeMargin.value : false,
                    bounce: ( opt.bounce )? opt.bounce.value : true,
                    min: ( opt.min )? opt.min.value : null,
                    max: ( opt.max )? opt.max.value : null,
                    gap: ( opt.gap )? opt.gap.value : 1,
                    snap: ( opt.snap )? opt.snap.value : false,
                    values: ( opt.values )? opt.values : null,
                    numberFormat: ( opt.numberFormat )? opt.numberFormat.value : false,
                    addFirstStr: ( opt.addFirstStr )? opt.addFirstStr.value : '',
                    addLastStr: ( opt.addLastStr )? opt.addLastStr.value : '',
                    value: ( opt.value )? opt.value.value : null,
                    disable: ( opt.disable )? opt.disable.value : false,
                    touchDisable: ( opt.touchDisable )? opt.touchDisable.value : false,
                    currencyFormat: ( opt.currencyFormat )? opt.currencyFormat.value : '',
                    numberFixed: ( opt.numberFixed )? opt.numberFixed.value : 0,
                    swipeSensitivity: ( opt.swipeSensitivity )? opt.swipeSensitivity.value : SWIPE_SENSITIVITY
                };
    
            defaultOpt.moveLength = ( opt.moveLength )? opt.moveLength.value : defaultOpt.viewLength;
            defaultOpt.easing = $B.string.camelCase( defaultOpt.easing );
            if ( defaultOpt.paging && defaultOpt.loop ) defaultOpt.paging = false;
            if ( !defaultOpt.numberFormat ) defaultOpt.currencyFormat = '';
            if ( defaultOpt.defaultIndex < 0 ) defaultOpt.defaultIndex = 0;
    
            return defaultOpt;
        },
    
        //animation 이동
        move: function ( $el, pos, options, callback, data, notAni ) {
            if ( !$el.length ) return;
    
            var prop = '';
    
            if ( ixSnack.TRANSFORM ) {
                if ( $B.ua.TOUCH_DEVICE ) {
                    //TODO:크롬에서 튀는 현상 미해결
                    prop = ixSnack.TRANSFORM + ':translate3d(' + ( options.axis === 'horizontal' ? pos + ',0' : '0,' + pos ) + ',0);';
                } else {
                    prop = ixSnack.TRANSFORM + ':translate' + ( options.axis === 'horizontal' ? 'X' : 'Y' ) + '(' + pos + ');';
                }
    
                if ( notAni ) {
                    $B( $el ).transition( prop, 'none' );
    				$el.prop( 'ix-noneTransitionTime', new Date().getTime() );
                    if ( typeof callback === 'function' ) callback( {data: data} );
                } else {
                    var easing = ( ixSnack.getCssEasing ) ? ixSnack.getCssEasing( options.easing ) : options.easing,
                        opt = ixSnack.TRANSFORM + ' ' + options.duration + 'ms ' + easing + ';',
                        autoComplete = ( typeof callback === 'function' )? setTimeout( function (e) {
                            //onTransitionEnd 이벤트가 발생하지 않을경우 대비
                            if ( autoComplete ) clearTimeout( autoComplete );
                            if ( typeof callback === 'function' ) callback( {data: data} );
                        }, options.duration * 1.5 ) : null,
                        timeGap = new Date().getTime() - ( $el.prop('ix-noneTransitionTime') || 0 );
    
                    //style적용 바로 이후 실행될때 transition이 제대로 실행되기 위한
                    setTimeout( function (e) {
                        $B( $el ).transition( prop, opt, {onTransitionEnd: function (e) {
                            if ( autoComplete ) clearTimeout( autoComplete );
                            if ( typeof callback === 'function' ) callback( {data: data} );
                        }});
    				}, timeGap < 5? 30 : 0);//transition:none; 실행이후 1000/1초 이내로 transition을 실행하면 none이 무시되기 때문에 delay 처리
                }
            } else {
                prop = ( options.axis === 'horizontal' ) ? {left: pos} : {top: pos};
    
                if ( notAni ) {
                    $el.stop().css( prop );
                    if ( typeof callback === 'function' ) callback( {data: data} );
                } else {
                    var easing = ( options.easing === 'ease' ) ? 'swing' : options.easing;
                    $el.stop().animate( prop, options.duration, easing, function () {
                        if ( typeof callback === 'function' ) callback( {data: data} );
                    });
                }
            }
        },
    
        //해당 포지션으로 설정
        moveTo: function ( $el, pos, options, callback, data ) {
            this.move( $el, pos, options, callback, data, true );
        },
    
        size: function ( $el, value, options, callback, data, notAni ) {
            var prop = ( options.axis === 'horizontal' )? 'width' : 'height';
            this.animate( $el, prop, value, options, callback, data, notAni );
        },
    
        animate: function ( $el, prop, value, options, callback, data, notAni ) {
            if ( !$el.length ) return;
    
            if ( ixSnack.TRANSFORM ) {
                if ( notAni ) {
                    $B( $el ).transition( prop + ':' + value, 'none' );
    				$el.prop( 'ix-noneTransitionTime', new Date().getTime() );
                    if ( typeof callback === 'function' ) callback( {data: data} );
                } else {
                    var easing = ( ixSnack.getCssEasing ) ? ixSnack.getCssEasing( options.easing ) : options.easing,
                        autoComplete = ( typeof callback === 'function' )? setTimeout( function (e) {
                            //onTransitionEnd 이벤트가 발생하지 않을경우 대비
                            if ( autoComplete ) clearTimeout( autoComplete );
                            if ( typeof callback === 'function' ) callback( {data: data} );
                        }, options.duration * 1.5 ) : null,
    					timeGap = new Date().getTime() - ( $el.prop('ix-noneTransitionTime') || 0 );
    
                    //style적용 바로 이후 실행될때 transition이 제대로 실행되기 위한
                    setTimeout( function (e) {
                        $B( $el ).transition( prop + ':' + value, prop + ' ' + options.duration + 'ms ' + easing + ';', {onTransitionEnd: function (e) {
                            if ( autoComplete ) clearTimeout( autoComplete );
                            if ( typeof callback === 'function' ) callback( {data: data} );
                        }});
    				}, timeGap < 5? 30 : 0);//transition:none; 실행이후 1000/1초 이내로 transition을 실행하면 none이 무시되기 때문에 delay 처리
                }
            } else {
                var aniStyle = {};
                aniStyle[prop] = value;
    
                if ( notAni ) {
                    $el.stop().css( aniStyle );
                    if ( typeof callback === 'function' ) callback( {data: data} );
                } else {
                    var easing = ( options.easing === 'ease' ) ? 'swing' : options.easing;
                    $el.stop().animate( aniStyle, options.duration, easing, function () {
                        if ( typeof callback === 'function' ) callback( {data: data} );
                    });
                }
            }
        }
    });


    if ( $.fn && typeof $.fn.extend === 'function' ) {
    	$.fn.extend({
    		ixOptions: function ( val1 ) {
    			//setter
    			if ( $B.object.is(val1) ) {
    				return this.each( function ( idx, el ) {
    					var optionData = $( el ).attr( 'data-ix-options' ),
    						value = ( optionData )? ixSnack.objToOptions( optionData, val1 ) : ixSnack.objToOptions( '', val1 );
    
    					$( el ).attr( 'data-ix-options', value ).addClass( 'ix-options-apply' );
    				});
    			} else {
    				var options = ixSnack.parseOptions( this.attr('data-ix-options') );
    
    				if ( $B.string.is(val1) ) {
    					var option = options[$B.string.camelCase(val1)];
    					if ( option ) {
    						if ( $B.array.is(option) ) {
    							options = [
    								( option[0].unit )? option[0].value + option[0].unit : option[0].value,
    								( option[1].unit )? option[1].value + option[1].unit : option[1].value
    							];
    						} else {
    							options = ( option.unit )? option.value + option.unit : option.value;
    						}
    					} else {
    						options = undefined;
    					}
    				}
    
    				return options
    			}
    		},
    
    		ixSlideMax: function ( val1, val2, val3 ) {
    			return ixSnack.setPlugin( this, 'slide-max', ixSnack.SlideMax, val1, val2, val3 );
    		},
    
    		ixSlideLite: function ( val1, val2, val3 ) {
    			return ixSnack.setPlugin( this, 'slide-lite', ixSnack.SlideLite, val1, val2, val3 );
    		},
    
    		ixOverlayList: function ( val1, val2, val3 ) {
    			return ixSnack.setPlugin( this, 'overlay-list', ixSnack.OverlayList, val1, val2, val3 );
    		},
    
    		ixRangeSlider: function ( val1, val2, val3 ) {
    			return ixSnack.setPlugin( this, 'range-slider', ixSnack.RangeSlider, val1, val2, val3 );
    		},
    
    		ixSlider: function ( val1, val2, val3 ) {
    			return ixSnack.setPlugin( this, 'slider', ixSnack.Slider, val1, val2, val3 );
    		},
    
    		ixRatioSize: function ( value ) {
    			if ( value && $B.object.is(value) ) this.ixOptions( value );
    
    			return this.each( function ( idx, el ) {
    				var $el = $( el ),
    					options = ixSnack.parseOptions( $el.attr('data-ix-options') ),
    					axis = ( options.axis )? options.axis.value : 'horizontal',
    					controlType = ( options.controlType )? options.controlType.value : 'style',
    					width, height, apply = false;
    
    				if ( options.ratio ) {
    					if ( axis === 'horizontal' ) {
    						width = $el.width();
    						height = width * ( options.ratio[1].value / options.ratio[0].value );
    
    						if ( width ) {
    							if ( controlType === 'style' || controlType === 'all' ) $el.css( 'height', height + 'px' );
    							if ( controlType === 'attr' || controlType === 'all' ) $el.attr( 'height', height );
    							apply = true;
    						}
    					} else {
    						height = $el.height();
    						width = height * ( options.ratio[0].value / options.ratio[1].value );
    
    						if ( height ) {
    							if ( controlType === 'style' || controlType === 'all' ) $el.css( 'width', width + 'px' );
    							if ( controlType === 'attr' || controlType === 'all' ) $el.attr( 'width', width );
    							apply = true;
    						}
    					}
    
    					if ( apply ) $el.addClass( 'ix-ratio-size-apply' );
    				}
    			});
    		}
    	});
    }


ixSnack.BaseClass = $B.Class.extend({
        // =============== Public Methods =============== //
        getCurrentIndex: function () {
            return this._selectIdx;
        },
    
        getTotalLength: function () {
            return this._totalLength;
        },
    
        getComputedOption: function ( prop ) {
            if ( $B.isString(prop) ) {
                prop = $B.string.camelCase( prop );
    
                if ( this._options.hasOwnProperty(prop) ) {
                    return this._options[prop];
                }
            } else {
                return $B.object.clone( this._options );
            }
        },
    
        enable: function () {
            if ( this._swipe ) this._swipe.enable();
            if ( this._thumbController ) this._thumbController.enable();
            this._disabled = false;
        },
    
        disable: function () {
            if ( this._swipe ) this._swipe.disable();
            if ( this._thumbController ) this._thumbController.disable();
            this._disabled = true;
        }
    }, 'ixSnack.BaseClass');


ixSnack.ListIndexManager = $B.Class.extend({
        initialize: function ( options, dispatches ) {
            this._options = options || {};
            this._dispatches = ( typeof dispatches === 'object' ) ? dispatches : {};
            this._selectIdx = 0;
            this._originStartIdx = 0;
            this._lastCloneStartIdx = 0;
            this._originLength = this._options.originLength;
    
            if ( this._options.loop && this._originLength > this._options.viewLength ) {
                this._originStartIdx = this._options.firstCloneLength;
                this._lastCloneStartIdx = this._originStartIdx + this._originLength;
            }
    
            var initIndex = this._originStartIdx;
    
            if ( this._options.defaultIndex ) {
                if ( this._options.loop ) {
                    this.correct( this._options.defaultIndex + this._originStartIdx );
                    initIndex = this._selectIdx;
                } else {
                    initIndex = this._getCorrectIndex( this._options.defaultIndex );
                }
            }
    
            this._dispatch( 'init', initIndex );
        },
    
        // =============== Public Methods =============== //
    
        prev: function ( rangeLength, isInput ) {
            if ( this._originLength <= this._options.viewLength ) return;
            var moveLength = rangeLength || this._options.moveLength;
            this._setNextIndex( -moveLength, isInput );
        },
    
        next: function ( rangeLength, isInput ) {
            if ( this._originLength <= this._options.viewLength ) return;
            var moveLength = rangeLength || this._options.moveLength;
            this._setNextIndex( moveLength, isInput );
        },
    
        //이동이후 보정할게 있을때만 보정.
        correct: function ( selectIdx ) {
            if ( !this._options.loop || this._originLength <= this._options.viewLength ) return;
            var correctType = this._getCorrectType( selectIdx );
    
            if ( correctType === 'next' ) {
                this._dispatch( 'correct', this._originStartIdx + (selectIdx - this._lastCloneStartIdx) );
            } else if ( correctType === 'prev' ) {
                this._dispatch( 'correct', this._lastCloneStartIdx - (this._originStartIdx - selectIdx) );
            } else {
                this._selectIdx = selectIdx;
            }
        },
    
        // =============== Private Methods =============== //
    
        _setNextIndex: function ( rangeLength, isInput ) {
            var nextSelectIdx = this._selectIdx + rangeLength;
    
            if ( this._options.loop ) {
                //next, prev, changeIndex 를 이용하여 이동시킬때 보정을 거친후 이동
                if ( isInput ) {
    				var nextRangeIdx = ( rangeLength > 0 )? nextSelectIdx + this._options.viewLength : nextSelectIdx - this._options.viewLength;
    
                    if ( nextRangeIdx < 1 ) {
                        this._dispatch( 'correct', this._lastCloneStartIdx - (this._originStartIdx - this._selectIdx) );
                        nextSelectIdx = this._selectIdx + rangeLength;
                    } else if ( nextRangeIdx > this._options.totalLength - 1 ) {
                        this._dispatch( 'correct', this._originStartIdx + (this._selectIdx - this._lastCloneStartIdx) );
                        nextSelectIdx = this._selectIdx + rangeLength;
                    }
                }
            } else {
                nextSelectIdx = this._getCorrectIndex( nextSelectIdx );
            }
    
            this._dispatch( 'change', nextSelectIdx );
        },
    
        //loop:false 일때 최소 최대치 보정값 반환
        _getCorrectIndex: function ( selectIdx ) {
            if ( selectIdx < 0 ) {
                selectIdx = 0;
            } else if ( selectIdx > this._originLength - this._options.viewLength ) {
                var rest = this._originLength % this._options.viewLength;
    
                //paging:true 면 마지막 index 보정
                if ( this._options.paging && rest ) {
                    var totalPage = Math.ceil( this._originLength / this._options.viewLength ) - 1,
                        currentPage = Math.ceil( selectIdx / this._options.viewLength );
    
                    if ( currentPage > totalPage ) {
                        selectIdx = this._originLength - rest;
                    }
                } else {
                    selectIdx = this._originLength - this._options.viewLength;
                }
            }
    
            return selectIdx;
        },
    
        //loop:true 일때 보정타입 반환
        _getCorrectType: function ( selectIdx ) {
            var result = '',
                min = ( this._options.datumPoint )? 1 : 0;
    
            if ( selectIdx + (this._options.viewLength * 2) > this._options.totalLength ) {
                result = 'next';
            } else if ( selectIdx - this._options.viewLength < min ) {
                result = 'prev';
            }
    
            return result;
        },
    
        _getEndpoint: function ( selectIdx ) {
            var result = false;
    
            if ( !this._options.loop ) {
                if ( this._options.paging ) {
                    var totalPage = Math.ceil( this._originLength / this._options.viewLength ) - 1,
                        currentPage = Math.ceil( selectIdx / this._options.viewLength );
    
                    if ( currentPage >= totalPage ) result = true;
                } else {
                    if ( selectIdx >= this._originLength - this._options.viewLength ) result = true;
                }
            }
    
            return result;
        },
    
        _dispatch: function ( type, idx ) {
            this._selectIdx = idx;
    
            var eventName = 'on' + $B.string.capitalize( type );
            if ( this._dispatches[eventName] ) this._dispatches[eventName].call( this, {type: type, index: idx, endpoint: this._getEndpoint(idx)} );
        }
    
    }, 'ixSnack.ListIndexManager');


ixSnack.ThumbController = $B.Class.extend({
        initialize: function ( $target, options ) {
            this._$controller = $target.find( '> .ix-controller' );
            this._$prevBtn = this._$controller.find( '.ix-btn-prev' );
            this._$nextBtn = this._$controller.find( '.ix-btn-next' );
            this._$thumbArea = this._$controller.find( '.ix-thumbs' );
    
            this._options = options || {};
            this._isPrevButtonTag = this._isButtonTag( this._$prevBtn );
            this._isNextButtonTag = this._isButtonTag( this._$nextBtn );
            this._thumbHtml = '';
            this._isDisabled = false;
            this._isBlock = false;
            this._selectIdx = 0;
    
            this._setThumbs();
            this._setEvents();
            this._selectThumb( 0 );
    
            if ( this._options.originLength <= this._options.viewLength ) {
                this._$prevBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
                this._$nextBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
                this._$controller.addClass( 'disabled' );
                this._$thumbs.find( '.ix-btn' ).attr( 'aria-disabled', true );
            }
        },
    
        // =============== Public Methods =============== //
    
        setIndex: function ( originIdx, idx ) {
            this._selectThumb( originIdx );
            this._setArrowState( idx );
            return this;
        },
    
        enable: function () {
            this._isDisabled = false;
            return this;
        },
    
        disable: function () {
            this._isDisabled = true;
            return this;
        },
    
        block: function ( state ) {
            if ( typeof state === 'boolean' ) {
                this._isBlock = state;
                return this;
            } else {
                return this._isBlock;
            }
        },
    
        //등록된 이벤트와 설정 삭제
        clear: function () {
            this._$prevBtn.off( 'click', this._directionHandler );
            this._$nextBtn.off( 'click', this._directionHandler );
            this._$thumbs.off( 'click', '.ix-btn', this._thumbHandler );
            this._$thumbArea.html( this._thumbHtml );
            this._$controller.removeClass( 'disabled' );
            this._$prevBtn.removeClass( 'disabled' ).removeAttr( 'aria-disabled' );
            this._$nextBtn.removeClass( 'disabled' ).removeAttr( 'aria-disabled' );
            this._removeWaiAria();
        },
    
        // =============== Private Methods =============== //
    
        _selectThumb: function ( idx ) {
            var thumbIdx = ( this._options.paging )? Math.ceil( idx / this._options.viewLength ) : idx;
            this._$thumbs.removeClass( 'active' ).attr( 'aria-selected', false ).eq( thumbIdx ).addClass( 'active' ).attr( 'aria-selected', true );
            this._selectIdx = idx;
        },
    
        _setEvents: function () {
            this._directionHandler = $B.bind(function (e) {
                e.preventDefault();
                if ( $(e.currentTarget).hasClass('disabled') || this._isDisabled || this._isBlock ) return;
    
                if ( $(e.currentTarget).hasClass('ix-btn-prev') ) {
                    this._dispatch( 'prev' );
                } else {
                    this._dispatch( 'next' );
                }
            }, this);
    
            this._thumbHandler = $B.bind( function (e) {
                e.preventDefault();
                if ( this._isDisabled || this._isBlock ) return;
                this._dispatch( 'index', $(e.currentTarget).closest('.ix-thumb' ).attr('data-idx') );
            }, this);
    
            this._$prevBtn.on( 'click', this._directionHandler );
            this._$nextBtn.on( 'click', this._directionHandler );
            this._$thumbs.on( 'click', '.ix-btn', this._thumbHandler );
        },
    
        //좌우화살표 상태 처리
        _setArrowState: function ( index ) {
            if ( this._options.originLength > this._options.viewLength && !this._options.loop ) {
                //prev
                if ( index > 0 ) {
                    this._$prevBtn.removeClass( 'disabled' ).attr( 'aria-disabled', false );
                    if ( this._isPrevButtonTag ) this._$prevBtn.attr( 'disabled', false ).prop( 'disabled', false );
                } else {
                    this._$prevBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
                    if ( this._isPrevButtonTag ) this._$prevBtn.attr( 'disabled', true ).prop( 'disabled', true );
                }
    
                //next
                if ( index < (this._options.totalLength - this._options.viewLength) ) {
                    this._$nextBtn.removeClass( 'disabled' ).attr( 'aria-disabled', false );
                    if ( this._isNextButtonTag ) this._$nextBtn.attr( 'disabled', false ).prop( 'disabled', false );
                } else {
                    this._$nextBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
                    if ( this._isNextButtonTag ) this._$nextBtn.attr( 'disabled', true ).prop( 'disabled', true );
                }
            }
        },
    
        _setThumbs: function () {
            var result = '',
                thumbLength = ( this._options.paging )? Math.ceil( this._options.originLength / this._options.viewLength ) : this._options.originLength;
    
            this._thumbHtml = this._$thumbArea.html();
    
            var $div = $( '<div>' ).append( this._$thumbArea.find('> .ix-thumb') ),
                thumbHtml = $div.html();
    
            for ( var i = 0; i < thumbLength; ++i ) {
                result += thumbHtml.replace( /<!--[-\s]*ix-index[\s-]*-->/gim, i + 1 );
            }
    
            this._$thumbArea.html( result );
            this._$thumbs = this._$thumbArea.find( '> .ix-thumb' ).each( $B.bind(function ( idx, el ) {
                var thumbIdx = ( this._options.paging )? idx * this._options.viewLength : idx;
                $( el ).attr( 'data-idx', thumbIdx );
            }, this));
        },
    
        _isButtonTag: function ( $el ) {
            var result = false;
    
            if ( $el.get(0) ) {
                var nodeName = $el.get(0).nodeName;
    
                if ( /input/i.test(nodeName) ) {
                    result = /button/i.test( $el.attr('type') );
                } else {
                    result = /button/i.test( nodeName );
                }
            }
    
            return result;
        },
    
        _removeWaiAria: function () {
            this._$thumbs.removeAttr( 'aria-selected' );
        },
    
        _dispatch: function ( type, idx ) {
            this._selectIdx = Number( idx );
            this.dispatch( type, {index: this._selectIdx} );
        }
    }, 'ixSnack.ThumbController');


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


ixSnack.OverlayList.OverlayMotion = ixSnack.OverlayList.Motion.extend({
        //@override
        initialize: function ( $target, $ul, $items, options ) {
            this._$target = $target;
            this._$ul = $ul;
            this._$items = $items;
            this._options = options;
    
            this._totalLength = this._$items.length;
            this._selectIdx = this._options.defaultIndex;
    
            this._overlayItem( this._selectIdx, true, false );
        },
    
        // =============== Public Methods =============== //
    
        //@override
        next: function ( selectIdx ) {
            this._overlayItem( selectIdx, false, true );
        },
    
        //@override
        prev: function ( selectIdx ) {
            this._overlayItem( selectIdx, false, true );
        }
    
        // =============== Private Methods =============== //
    
    }, 'ixSnack.OverlayList.OverlayMotion');


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
})( typeof window === "object" ? window : undefined );