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
    VERSION: '',
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