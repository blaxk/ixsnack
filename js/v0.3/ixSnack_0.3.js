/**
 * ixSnack.js - Javascript UI Library
 * jQuery v1.8~ (http://jquery.com) + ixBand v0.8~ (http://ixband.com)
 * @version v0.3 - 160406
 * Licensed under the MIT, http://ixsnack.com
 */

;(function ( $, $B ) {
    var _ixSnack = {VERSION: '0.3'},
        _pluginId = 1,
        _pluginPool = {};

    $.fn.extend({
        ixOptions: function ( val1 ) {
            //setter
            if ( $B.object.is(val1) ) {
                return this.each( function ( idx, el ) {
                    var value = Utils.objToOptions( $(el).attr('data-ix-options'), val1 );
                    $( el ).attr( 'data-ix-options', value ).addClass( 'ix-options-apply' );
                });
            } else {
                var options = Utils.parseOptions( this.attr('data-ix-options') );

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

        ixSlideMax: function ( val1, val2 ) {
            return Utils.setPlugin( this, 'slide-max', SlideMax, val1, val2 );
        },

        ixSlideLite: function ( val1, val2 ) {
            return Utils.setPlugin( this, 'slide-lite', SlideLite, val1, val2 );
        },

        ixOverlayList: function ( val1, val2 ) {
            return Utils.setPlugin( this, 'overlay-list', OverlayList, val1, val2 );
        },

        ixRangeSlider: function ( val1, val2 ) {
            return Utils.setPlugin( this, 'range-slider', RangeSlider, val1, val2 );
        },

        ixSlider: function ( val1, val2 ) {
            return Utils.setPlugin( this, 'slider', Slider, val1, val2 );
        },

        ixRatioSize: function ( value ) {
            if ( value && $B.object.is(value) ) this.ixOptions( value );

            return this.each( function ( idx, el ) {
                var $el = $( el ),
                    options = Utils.parseOptions( $el.attr('data-ix-options') ),
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



    var ENDPOINT_DECREASE = 0.3,//끝점 감쇠 수치
        SWIPE_SENSITIVITY = 0.5;//swipe 민감도

    /**
     * Plugin에서 사용하는 공통기능
     */
    var Utils = {
        TRANSFORM: (function () {
            if ( !($B.ua.MSIE && $B.ua.DOC_MODE_IE10_LT) ) {
                var prefixes = 'transform WebkitTransform'.split( ' ' );
                for ( var i = 0; i < prefixes.length; ++i ) {
                    if ( document.createElement('div').style[prefixes[i]] !== undefined ) {
                        return $B.string.hyphenCase( prefixes[i] );
                    }
                }
            }

            return null;
        }()),

        setPlugin: function ( $target, pluginName, plugin, val1, val2 ) {
            //method 호출
            if ( typeof val1 === 'string' ) {
                //getter
                if ( /^get[A-Z]/.test(val1) ) {
                    return Utils.callPlugin( $target.eq(0), pluginName, val1, val2 );
                } else {
                    $target.each( function ( idx, el ) {
                        Utils.callPlugin( $(el), pluginName, val1, val2 );
                    });
                }
            } else {
                $target.each( function ( idx, el ) {
                    var $el = $( el );
                    if ( !Utils.hasPlugin($el, pluginName) ) {
                        //ix-options 입력
                        if ( $B.object.is(val1) ) $el.ixOptions( val1 );
                        Utils.addPlugin( $el, pluginName, new plugin($el) );
                    }
                });
            }

            return $target;
        },

        hasPlugin: function ( $target, pluginName ) {
            return ( $target.prop(pluginName) && $target.hasClass('ix-' + pluginName + '-apply') );
        },

        addPlugin: function ( $target, pluginName, plugin ) {
            $target.prop( pluginName, _pluginId ).addClass( 'ix-' + pluginName + '-apply' );
            _pluginPool[_pluginId] = plugin;
            _pluginId++;
        },

        removePlugin: function ( $target, pluginName ) {
            $target.removeProp( pluginName ).removeClass( 'ix-' + pluginName + '-apply' ).removeClass( 'ix-options-apply' );
            delete _pluginPool[$target.prop(pluginName)];
        },

        callPlugin: function ( $target, pluginName, method, val1, val2 ) {
            var pluginId = $target.prop( pluginName );
            if ( _pluginPool[pluginId] && typeof _pluginPool[pluginId][method] === 'function' ) {
                return _pluginPool[pluginId][method]( val1, val2 );
            }
        },

        objToOptions: function ( optionStr, obj ) {
            for ( var key in obj ) {
                var value = obj[key];

                if ( value || typeof value === 'number' ) {
                    var reKey = $B.string.hyphenCase( key ),
                        reg = new RegExp( reKey + '\\s*?:\\s*?([\\w\\-.,\\s\\/?&:=\\(\\)%]+);?', 'gi' );

                    if ( reg.test(optionStr) ) {
                        optionStr = optionStr.replace( reg, reKey + ':' + value + ';' );
                    } else {
                        if ( !/;\s*?$/.test(optionStr) ) optionStr += ';';
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
                    result[ $B.string.camelCase(n) ] = Utils.parseOptionValue( $B.string.trim(v) );
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
                    result.push( {value: Utils.parseDataType(v), unit: u || ''} );
                });
            } else {
                String( str ).replace( /([-\d\.\s]+|[a-z-]+)([a-z\%]+)?/, function ( str, v, u ) {
                    result = {value: Utils.parseDataType(v), unit: u || ''};
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
                } else if ( /^[0-9\.\-]+$/.test(str) ) {
                    str = Number( str );
                }
            }
            return str;
        },

        //data-ix-options 속성을 파싱하여 반환
        getOptions: function ( optionStr ) {
            var opt = Utils.parseOptions( optionStr ),
                defaultOpt = {
                    axis: ( opt.axis )? opt.axis.value : 'horizontal',
                    loop: ( opt.loop )? opt.loop.value : true,
                    duration: ( opt.duration )? opt.duration.value : 0,
                    autoPlay: ( opt.autoPlay )? opt.autoPlay.value : false,
                    delay: ( opt.delay )? opt.delay.value : 4000,
                    blockClickEvent: ( opt.blockClickEvent )? opt.blockClickEvent.value : false,
                    viewLength: ( opt.viewLength )? opt.viewLength.value : 1,
                    motionType: ( opt.motionType )? opt.motionType.value : 'slide',
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
                    disable: ( opt.disable )? opt.disable.value : false
                };

            defaultOpt.moveLength = ( opt.moveLength )? opt.moveLength.value : defaultOpt.viewLength;
            defaultOpt.easing = $B.string.camelCase( defaultOpt.easing );
            if ( defaultOpt.paging && defaultOpt.loop ) defaultOpt.paging = false;

            return defaultOpt;
        },

        //animation 이동
        move: function ( $el, pos, options, callback, data, notAni ) {
            var prop = '';

            if ( Utils.TRANSFORM ) {
                if ( $B.ua.TOUCH_DEVICE ) {
                    //TODO:크롬에서 튀는 현상 미해결
                    prop = Utils.TRANSFORM + ':translate3d(' + ( options.axis === 'horizontal' ? pos + ',0' : '0,' + pos ) + ',0);';
                } else {
                    prop = Utils.TRANSFORM + ':translate' + ( options.axis === 'horizontal' ? 'X' : 'Y' ) + '(' + pos + ');';
                }

                if ( notAni ) {
                    $B( $el ).transition( prop, 'none' );
                    if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                } else {
                    var easing = ( ixSnack.getCssEasing ) ? ixSnack.getCssEasing( options.easing ) : options.easing,
                        opt = Utils.TRANSFORM + ' ' + options.duration + 'ms ' + easing + ';';
                    autoComplete = ( typeof callback === 'function' )? setTimeout( function (e) {
                        //onTransitionEnd 이벤트가 발생하지 않을경우 대비
                        if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                        if ( autoComplete ) clearTimeout( autoComplete );

                    }, options.duration * 2 ) : null;

                    //style적용 바로 이후 실행될때 transition이 제대로 실행되기 위한
                    setTimeout( function (e) {
                        $B( $el ).transition( prop, opt, {onTransitionEnd: function (e) {
                            if ( typeof callback === 'function' ) {
                                callback.call( $el.get(0), {data: data} );
                            }

                            if ( autoComplete ) clearTimeout( autoComplete );
                        }}, data );
                    }, 1);
                }
            } else {
                prop = ( options.axis === 'horizontal' ) ? {left: pos} : {top: pos};

                if ( notAni ) {
                    $el.stop().css( prop );
                    if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                } else {
                    var easing = ( options.easing === 'ease' ) ? 'swing' : options.easing;
                    $el.stop().animate( prop, options.duration, easing, function () {
                        if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                    });
                }
            }
        },

        //해당 포지션으로 설정
        moveTo: function ( $el, pos, options, callback, data ) {
            this.move( $el, pos, options, callback, data, true );
        },

        opacity: function ( $el, value, options, callback, data, notAni ) {
            if ( Utils.TRANSFORM ) {
                if ( notAni ) {
                    $B( $el ).transition( 'opacity:' + value, 'none' );
                    if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                } else {
                    var autoComplete = ( typeof callback === 'function' )? setTimeout( function (e) {
                        //onTransitionEnd 이벤트가 발생하지 않을경우 대비
                        if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                        if ( autoComplete ) clearTimeout( autoComplete );
                    }, options.duration * 2 ) : null;

                    //style적용 바로 이후 실행될때 transition이 제대로 실행되기 위한
                    setTimeout( function (e) {
                        $B( $el ).transition( 'opacity:' + value, 'opacity ' + options.duration + 'ms ease;', function (e) {
                            if ( typeof callback === 'function' && autoComplete ) {
                                clearTimeout( autoComplete );
                                callback.call( this, {data: data} );
                            }
                        }, data );
                    }, 10);
                }
            } else {
                if ( notAni ) {
                    $el.stop().css( {opacity: value} );
                    if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                } else {
                    $el.stop().animate( {opacity: value}, options.duration, 'swing', function () {
                        if ( typeof callback === 'function' ) callback.call( this, {data: data} );
                    });
                }
            }
        }
    };


    /**
     * Slide Max
     * @constructor
     */
    var SlideMax = function ( $target ) {
        var _this = this,
            _$target = $target,
            _$viewport = _$target.find( '> .ix-list-viewport' ),
            _$ul = _$viewport.find( '> .ix-list-items' ),
            _$items, _$cloneItems;

        var _options = Utils.getOptions( _$target.attr('data-ix-options') ),
            _timer, _swipe, _listIndexManager, _thumbController;

        var _originLength, _totalLength, _itemSize, _viewportSize,
            _selectIdx = 0, _originIdx = -1, _oldOriginIdx = -1,  _currentPos = 0, _disabled = false, _endpoint = false;

        // =============== Public Methods =============== //
        this.startTimer = function () {
            if ( _timer ) _timer.reset().start();
        };

        this.stopTimer = function () {
            if ( _timer ) _timer.stop();
        };

        this.changeIndex = function ( originIdx ) {
            selectOriginIdx( originIdx );
        };

        this.next = function ( rangeLength, isInput ) {
            if ( _disabled ) return;
            _listIndexManager.next( rangeLength, isInput );
        };

        this.prev = function ( rangeLength, isInput ) {
            if ( _disabled ) return;
            _listIndexManager.prev( rangeLength, isInput );
        };

        this.clear = function () {
            this.stopTimer();
            removeEvents();
            removeSize();
            _$ul.stop();
            _$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
            if ( _$cloneItems ) _$cloneItems.remove();
            Utils.removePlugin( _$target, 'slide-max' );
        };

        this.resize = function () {
            _this.stopTimer();
            removeSize();
            setSize();
            moveItems( _selectIdx, 'none', true, true );
        };

        this.getCurrentIndex = function () {
            return _originIdx;
        };

        this.getTotalLength = function () {
            return _originLength;
        };

        // =============== Initialize =============== //
        initialize();

        // =============== Protected Methods =============== //
        function initialize () {
            getItems( true );
            setItems();
            setSize();
            setAutoPlay();
            addEvents();

            _options.originLength = _originLength;
            _options.totalLength = _totalLength;

            if ( _options.moveLength > _options.viewLength ) {
                _options.moveLength = _options.viewLength;
            }

            if ( !_options.duration ) _options.duration = 400;

            _thumbController = new ThumbController( _$target, _options, {
                onNext: thumbHandler,
                onPrev: thumbHandler,
                onIndex: thumbHandler
            });

            _listIndexManager = new ListIndexManager( _options, {
                onChange: listIndexEventHandler,
                onCorrect: listIndexEventHandler,
                onInit: listIndexEventHandler
            });

            dispatch( 'init' );
        }

        function thumbHandler (e) {
            switch ( e.type ) {
                case 'next':
                    _this.next();
                    break;
                case 'prev':
                    _this.prev();
                    break;
                case 'index':
                    _this.changeIndex( e.index );
                    break;
            }
        }

        function listIndexEventHandler (e) {
            switch ( e.type ) {
                case 'change':
                    dispatch( 'slideStart' );
                    _endpoint = e.endpoint;
                    _originIdx = Number( _$items.eq(e.index).attr('data-origin-idx') );
                    moveItems( e.index, _options.motionType );
                    break;
                case 'correct':
                    moveItems( e.index, 'none', true );
                    break;
                case 'init':
                    _endpoint = e.endpoint;
                    _originIdx = Number( _$items.eq(e.index).attr('data-origin-idx') );
                    moveItems( e.index, 'none', false, true );
                    break;
            }
        }

        //외부에서 origin index로 설정
        function selectOriginIdx ( originIdx ) {
            if ( originIdx > _originLength || originIdx < 0 ) return;

            if ( _originIdx < originIdx ) {
                _this.next( originIdx - _originIdx, true );
            } else if ( _originIdx > originIdx ) {
                _this.prev( _originIdx - originIdx, true );
            }
        }

        function getItems ( first ) {
            _$items = _$ul.find( '> .ix-list-item' );
            _totalLength = _$items.length;
            if ( first ) _originLength = _totalLength;
        }

        //아이템 origin 갯수 대비 실제 갯수 설정
        function setItems () {
            _$items.each( function ( idx, el ) {
                //origin-index 속성 추가
                $( el ).attr( 'data-origin-idx', idx );
            });

            if ( _options.loop && _originLength > _options.viewLength ) {
                cloneItems();
                getItems();
            }

            _$items.each( function ( idx, el ) {
                //index 속성 추가
                $( el ).attr( 'data-idx', idx );
            });
        }

        //아이템 복사
        function cloneItems () {
            var $firstItems = _$items.slice( _totalLength - _options.viewLength - 1, _totalLength ).clone(),
                $lastItems = _$items.slice( 0, _options.viewLength + 1 ).clone();

            if ( $firstItems.length ) $firstItems.insertBefore( _$items.eq(0) );
            if ( $lastItems.length ) _$ul.append( $lastItems );

            _options.firstCloneLength = $firstItems.length;
            _$cloneItems = $firstItems.add( $lastItems );
            _$cloneItems.addClass( 'ix-clone' );
        }

        function addEvents () {
            if ( _options.autoPlay ) _$target.on( 'mouseover mouseout', mouseHandler );

            if ( $B.ua.TOUCH_DEVICE && _totalLength > _options.viewLength ) {
                _swipe = new $B.mobile.Swipe( _$viewport.get(0), _options.axis, {
                    onAxis: function (e) {
                        if ( _disabled ) return;
                        _this.stopTimer();
                        dispatch( 'touchStart' );
                    },
                    onMove: function (e) {
                        if ( _disabled ) return;
                        if ( _options.motionType === 'slide' ) touchMove( e );
                    },
                    onSwipe: function (e) {
                        if ( _disabled ) return;
                        _this.startTimer();
                        dispatch( 'touchEnd' );

                        //이동값이 변동이 없으면 transitionend 이벤트가 발생하지 않기 때문
                        if ( (_options.axis === 'horizontal'? e.moveX : e.moveY) === 0 ) return;
                        swipe( e.swipe );
                    }
                }).sensitivity( SWIPE_SENSITIVITY );
            }
        }

        function touchMove (e) {
            var movePos = ( _options.axis === 'horizontal' )? e.growX : e.growY,
                isOverPos = isOverPosition( movePos + _currentPos ),
                pos = isOverPos? ( movePos * ENDPOINT_DECREASE ) + _currentPos : movePos + _currentPos;

            if ( isOverPos && _options.bounce || !isOverPos ) {
                Utils.moveTo( _$ul, pos + 'px', _options );
                _currentPos = pos;
            }
        }

        function swipe ( type ) {
            if ( type === 'left' || type === 'up' ) {
                _this.next();
            } else if ( type === 'right' || type === 'down' ) {
                _this.prev();
            } else {
                dispatch( 'slideStart' );
                moveItems( _selectIdx, _options.motionType );
            }
        }

        function isOverPosition ( current ) {
            var result = false, total = 0;

            if ( !_options.loop ) {
                if ( _options.paging ) {
                    total = indexToPosition( _options.viewLength * Math.floor(_totalLength / _options.viewLength) );
                } else if ( _options.correctEndpoint ) {
                    total = -( _totalLength * _itemSize - _viewportSize );
                } else {
                    total = indexToPosition( _totalLength - _options.viewLength );
                }

                if ( current > 0 ) {
                    result = true;
                } else if ( current < total ) {
                    result = true;
                }
            }

            return result;
        }

        function removeEvents () {
            _$target.off( 'mouseover mouseout', mouseHandler );
            _thumbController.clear();
            if ( _swipe ) _swipe.clear();
        }

        function mouseHandler (e) {
            if ( e.type === 'mouseover' ) {
                _this.stopTimer();
            } else {
                _this.startTimer();
            }
        }

        function getCorrectEndpoint ( pos, idx ) {
            if ( _options.correctEndpoint && !_options.loop && !_options.paging && _endpoint ) {
                var isOverPos = ( (_totalLength - idx) * _itemSize ) < _viewportSize;
                if ( isOverPos ) pos = -( _totalLength * _itemSize - _viewportSize );
            }
            return pos;
        }

        //아이템 이동
        function moveItems ( idx, motionType, isCorrect, isSilent ) {
            var nextPos = getCorrectEndpoint( indexToPosition(idx), idx ),
                isUnaltered = _oldOriginIdx === _originIdx;

            _disabled = true;
            _this.stopTimer();
            _thumbController.disable().setIndex( _originIdx, idx );

            if ( motionType === 'slide' ) {
                Utils.move( _$ul, nextPos + 'px', _options, moveComplete, {idx: idx, isCorrect: isCorrect, isSilent: isSilent, isUnaltered: isUnaltered} );
            } else {
                Utils.moveTo( _$ul, nextPos + 'px', _options, moveComplete, {idx: idx, isCorrect: isCorrect, isSilent: isSilent, isUnaltered: isUnaltered} );
            }

            _currentPos = nextPos;
            _selectIdx = idx;
            _oldOriginIdx = _originIdx;
        }

        function moveComplete (e) {
            if ( !e.data.isCorrect && _listIndexManager ) {
                _listIndexManager.correct( e.data.idx );
            }

            _thumbController.enable();
            _this.startTimer();
            _disabled = false;

            if ( !e.data.isSilent && !e.data.isCorrect ) {
                if ( !e.data.isUnaltered ) dispatch( 'change' );
                dispatch( 'slideEnd' );
            }
        }

        function setAutoPlay () {
            if ( !_options.autoPlay ) return;

            _timer = new $B.utils.Timer( _options.delay, _totalLength, {
                onTimer: function (e) {
                    if ( _options.opposite ) {
                        _this.prev();
                    } else {
                        _this.next();
                    }
                },
                onComplete: function (e) {
                    _this.startTimer();
                }
            }).start();
        }

        //좌표 반환
        function indexToPosition ( idx ) {
            return -( idx * _itemSize  );
        }

        //ul, li, viewport 사이즈 설정
        function setSize () {
            var sizeProp, viewportSizeProp, marginProps, itemStyle = {}, ulStyle = {},
                itemMargins = getItemMargins(), itemMarginTotal = itemMargins[0] + itemMargins[1];

            if ( _options.viewportRatio ) _$viewport.css( 'height', getViewportHeight() + 'px' );

            _itemSize = getItemSize();

            if ( !_options.includeMargin ) _itemSize += itemMarginTotal;

            if ( _options.axis === 'horizontal' ) {
                sizeProp = 'width';
                viewportSizeProp = 'innerWidth';
                marginProps = ['marginLeft', 'marginRight'];
            } else {
                sizeProp = 'height';
                viewportSizeProp = 'innerHeight';
                marginProps = ['marginTop', 'marginBottom'];
            }

            ulStyle[sizeProp] = ( _itemSize * _totalLength + 100 ) + 'px';
            itemStyle[sizeProp] = ( _itemSize - itemMarginTotal )   + 'px';
            itemStyle[marginProps[0]] = itemMargins[0] + 'px';
            itemStyle[marginProps[1]] = itemMargins[1] + 'px';
            if ( _totalLength > _options.viewLength ) ulStyle[marginProps[0]] = _options.datumPoint;

            _$items.css( itemStyle );
            _$ul.css( ulStyle );

            _viewportSize = _$viewport[viewportSizeProp]();
        }

        function getViewportHeight () {
            return $B( _$viewport.get(0) ).rect().width * ( _options.viewportRatio[1].value / _options.viewportRatio[0].value );
        }

        function getItemMargins () {
            var result = [];

            if ( _options.itemMargin ) {
                result = [_options.itemMargin[0].value, _options.itemMargin[1].value];
            } else {
                var margins = _$items.css( _options.axis === 'horizontal' ? ['marginLeft', 'marginRight'] : ['marginTop', 'marginBottom'] );
                $.each( margins, function ( key, value ) {
                    result.push( parseFloat(value) );
                });
            }

            return result;
        }

        function getItemSize ( ) {
            if ( _options.itemSize ) {
                return _options.itemSize.value;
            } else {
                var type = ( _options.axis === 'horizontal' )? 'width' : 'height';
                return $B( _$items.get(0) ).rect()[type];
            }
        }

        function removeSize () {
            _$viewport.attr( 'style', '' );
            _$ul.attr( 'style', '' );
            _$items.attr( 'style', '' );
        }

        function dispatch ( type ) {
            var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? _endpoint : undefined;
            _$target.triggerHandler( {type: 'ixSlideMax:' + type, currentIndex: _originIdx, totalLength: _originLength, endpoint: endpoint} );
        }
    };


    /**
     * Thumbnail, Next, Prev Controller 관리
     * @constructor
     */
    var ThumbController = function ( $target, options, dispatches ) {
        var _$controller = $target.find( '> .ix-controller' ),
            _$prevBtn = _$controller.find( '.ix-btn-prev' ),
            _$nextBtn = _$controller.find( '.ix-btn-next' ),
            _$thumbArea = _$controller.find( '.ix-thumbs' ),
            _$thumbs;

        var _thumbHtml = '',
            _isDisabled = false,
            _selectIdx = 0;

        // =============== Public Methods =============== //
        this.setIndex = function ( originIdx, idx ) {
            selectThumb( originIdx );
            setArrowState( idx );
            return this;
        };

        this.enable = function () {
            _isDisabled = false;
            return this;
        };

        this.disable = function () {
            _isDisabled = true;
            return this;
        };

        //등록된 이벤트와 설정 삭제
        this.clear = function () {
            _$prevBtn.off();
            _$nextBtn.off();
            _$thumbs.off( 'click', 'a.ix-btn' );
            _$thumbArea.html( _thumbHtml );
            _$controller.removeClass( 'disabled' );
            _$prevBtn.removeClass( 'disabled' );
            _$nextBtn.removeClass( 'disabled' );
        };

        // =============== Initialize =============== //
        initialize();

        // =============== Protected Methods =============== //
        function initialize () {
            setThumbs();
            addEvents();
            selectThumb( 0 );

            if ( options.originLength <= options.viewLength ) {
                _$prevBtn.addClass( 'disabled' );
                _$nextBtn.addClass( 'disabled' );
                _$controller.addClass( 'disabled' );
            }
        }

        //좌우화살표 상태 처리
        function setArrowState ( index ) {
            if ( options.originLength > options.viewLength && !options.loop ) {
                //prev
                if ( index > 0 ) {
                    _$prevBtn.removeClass( 'disabled' );
                } else {
                    _$prevBtn.addClass( 'disabled' );
                }

                //next
                if ( index < (options.totalLength - options.viewLength) ) {
                    _$nextBtn.removeClass( 'disabled' );
                } else {
                    _$nextBtn.addClass( 'disabled' );
                }
            }

            return this;
        }

        function setThumbs () {
            var result = '',
                thumbLength = ( options.paging )? Math.ceil( options.originLength / options.viewLength ) : options.originLength;

            _thumbHtml = _$thumbArea.html();

            var $div = $( '<div>' ).append( _$thumbArea.find('> .ix-thumb') ),
                thumbHtml = $div.html();

            for ( var i = 0; i < thumbLength; ++i ) {
                result += thumbHtml.replace( /<!--[-\s]*ix-index[\s-]*-->/gim, i );
            }

            _$thumbArea.html( result );
            _$thumbs = _$thumbArea.find( '> .ix-thumb' ).each( function ( idx, el ) {
                var thumbIdx = ( options.paging )? idx * options.viewLength : idx;
                $( el ).attr( 'data-idx', thumbIdx );
            });
        }

        function addEvents () {
            _$prevBtn.on( 'click', function (e) {
                e.preventDefault();
                if ( $(this).hasClass('disabled') || _isDisabled ) return;
                dispatch( 'prev' );
            });

            _$nextBtn.on( 'click', function (e) {
                e.preventDefault();
                if ( $(this).hasClass('disabled') || _isDisabled ) return;
                dispatch( 'next' );
            });

            _$thumbs.on( 'click', 'a.ix-btn', function (e) {
                e.preventDefault();
                if ( _isDisabled ) return;
                dispatch( 'index', $(e.currentTarget).closest('.ix-thumb' ).attr('data-idx') );
            });
        }

        function selectThumb ( idx ) {
            var thumbIdx = ( options.paging )? Math.ceil( idx / options.viewLength ) : idx;
            _$thumbs.removeClass( 'active' ).eq( thumbIdx ).addClass( 'active' );
            _selectIdx = idx;
        }

        function dispatch ( type, idx ) {
            _selectIdx = Number( idx );
            dispatches['on' + $B.string.capitalize(type)].call( this, {type: type, index: _selectIdx} );
        }
    };


    /**
     * 리스트형 Index Data 관리
     * @param {Object}      dispatches  전달 받을 이벤트들
     *      - {Function}    onChange    index가 변경되었으시 callback {type:'change', index, endpoint}
     *      - {Function}    onCorrect   rangeIndex 보정이 발생시 callback {type:'correct', index, endpoint}
     */
    var ListIndexManager = function ( options, dispatches ) {
        var _this = this,
            _options = options || {},
            _dispatches = ( typeof dispatches === 'object' ) ? dispatches : {};

        var _selectIdx = 0,
            _originStartIdx = 0, _lastCloneStartIdx = 0,
            _originLength = _options.originLength;

        // ========== Public Methods ========== //

        this.prev = function ( rangeLength, isInput ) {
            if ( _originLength <= _options.viewLength ) return;
            var moveLength = rangeLength || _options.moveLength;
            setNextIndex( -moveLength, isInput );
        };

        this.next = function ( rangeLength, isInput ) {
            if ( _originLength <= _options.viewLength ) return;
            var moveLength = rangeLength || _options.moveLength;
            setNextIndex( moveLength, isInput );
        };

        //이동이후 보정할게 있을때만 보정.
        this.correct = function ( selectIdx ) {
            if ( !_options.loop || _originLength <= _options.viewLength ) return;
            var correctType = getCorrectType( selectIdx );

            if ( correctType === 'next' ) {
                dispatch( 'correct', _originStartIdx + (selectIdx - _lastCloneStartIdx) );
            } else if ( correctType === 'prev' ) {
                dispatch( 'correct', _lastCloneStartIdx - (_originStartIdx - selectIdx) );
            } else {
                _selectIdx = selectIdx;
            }
        };

        // ========== Initialize ========== //
        initialize();

        // ========== Protected Methods ========== //
        function initialize () {
            if ( _options.loop && _originLength > _options.viewLength ) {
                _originStartIdx = _options.firstCloneLength;
                _lastCloneStartIdx = _originStartIdx + _originLength;
            }

            var initIndex = _originStartIdx;

            if ( _options.defaultIndex ) {
                if ( _options.loop ) {
                    _this.correct( _options.defaultIndex + _originStartIdx );
                    initIndex = _selectIdx;
                } else {
                    initIndex = getCorrectIndex( _options.defaultIndex );
                }
            }

            dispatch( 'init', initIndex );
        }

        function setNextIndex ( rangeLength, isInput ) {
            var nextSelectIdx = _selectIdx + rangeLength;

            if ( _options.loop ) {
                //datumPoint 설정시 1개 정도 더 보여야 해서
                if ( isInput ) {
                    if ( nextSelectIdx < 1 ) {
                        dispatch( 'correct', _lastCloneStartIdx - (_originStartIdx - _selectIdx) );
                        nextSelectIdx = _selectIdx + rangeLength;
                    } else if ( nextSelectIdx > _options.totalLength - 1 ) {
                        dispatch( 'correct', _originStartIdx + (_selectIdx - _lastCloneStartIdx) );
                        nextSelectIdx = _selectIdx + rangeLength;
                    }
                }
            } else {
                nextSelectIdx = getCorrectIndex( nextSelectIdx );
            }

            dispatch( 'change', nextSelectIdx );
        }

        //loop:false 일때 최소 최대치 보정값 반환
        function getCorrectIndex ( selectIdx ) {
            if ( selectIdx < 0 ) {
                selectIdx = 0;
            } else if ( selectIdx > _originLength - _options.viewLength ) {
                var rest = _originLength % _options.viewLength;

                //paging:true 면 마지막 index 보정
                if ( _options.paging && rest ) {
                    var totalPage = Math.ceil( _originLength / _options.viewLength ) - 1,
                        currentPage = Math.ceil( selectIdx / _options.viewLength );

                    if ( currentPage > totalPage ) {
                        selectIdx = _originLength - rest;
                    }
                } else {
                    selectIdx = _originLength - _options.viewLength;
                }
            }

            return selectIdx;
        }

        //loop:true 일때 보정타입 반환
        function getCorrectType ( selectIdx ) {
            var result = '',
                min = ( _options.datumPoint )? 1 : 0;

            if ( selectIdx + (_options.viewLength * 2) > _options.totalLength ) {
                result = 'next';
            } else if ( selectIdx - _options.viewLength < min ) {
                result = 'prev';
            }

            return result;
        }

        function getEndpoint ( selectIdx ) {
            var result = false;

            if ( !_options.loop ) {
                if ( _options.paging ) {
                    var totalPage = Math.ceil( _originLength / _options.viewLength ) - 1,
                        currentPage = Math.ceil( selectIdx / _options.viewLength );

                    if ( currentPage >= totalPage ) result = true;
                } else {
                    if ( selectIdx >= _originLength - _options.viewLength ) result = true;
                }
            }

            return result;
        }

        function dispatch ( type, idx ) {
            _selectIdx = idx;

            var eventName = 'on' + $B.string.capitalize( type );
            if ( _dispatches[eventName] ) _dispatches[eventName].call( this, {type: type, index: idx, endpoint: getEndpoint(idx)} );
        }
    };


    /**
     * Slide Lite
     * @constructor
     */
    var SlideLite = function ( $target ) {
        var _this = this,
            _$target = $target,
            _$viewport = _$target.find( '> .ix-list-viewport' ),
            _$ul = _$viewport.find( '> .ix-list-items' ),
            _$items;

        var _options = Utils.getOptions( _$target.attr('data-ix-options') ),
            _timer, _swipe, _thumbController;

        var _totalLength, _itemSize,
            _selectIdx = 0, _disabled = false,
            _centerIdx, _prevIdx, _nextIdx, _currentPos = 0;

        // =============== Public Methods =============== //
        this.startTimer = function () {
            if ( _timer ) _timer.reset().start();
        };

        this.stopTimer = function () {
            if ( _timer ) _timer.stop();
        };

        this.changeIndex = function ( idx ) {
            if ( idx > _totalLength || idx < 0 ) return;

            if ( _selectIdx < idx ) {
                this.next( idx );
            } else if ( _selectIdx > idx ) {
                this.prev( idx );
            }
        };

        this.next = function ( selectIdx, isSwipe ) {
            if ( _disabled ) return;
            selectMove( _selectIdx + 1, selectIdx, 'next', isSwipe );
        };

        this.prev = function ( selectIdx, isSwipe ) {
            if ( _disabled ) return;
            selectMove( _selectIdx - 1, selectIdx, 'prev', isSwipe );
        };

        this.resize = function () {
            _this.stopTimer();
            removeSize();
            setSize();
            arrangeItems( _selectIdx );
            _this.startTimer();
        };

        this.clear = function () {
            this.stopTimer();
            removeEvents();
            removeStyle();
            _$ul.stop();
            _$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
            Utils.removePlugin( _$target, 'slide-lite' );
        };

        this.getCurrentIndex = function () {
            return _selectIdx;
        };

        this.getTotalLength = function () {
            return _totalLength;
        };

        // =============== Initialize =============== //
        initialize();

        // =============== Protected Methods =============== //
        function initialize () {
            getItems();
            setItems();
            setSize();
            setAutoPlay();
            addEvents();

            _options.originLength = _totalLength;
            _options.totalLength = _totalLength;
            if ( _totalLength < 3 ) _options.loop = false;
            if ( _options.defaultIndex >= _totalLength || _options.defaultIndex < 0 ) _options.defaultIndex = 0;
            if ( !_options.duration ) _options.duration = 400;

            _thumbController = new ThumbController( _$target, _options, {
                onNext: thumbHandler,
                onPrev: thumbHandler,
                onIndex: thumbHandler
            }).setIndex( _options.defaultIndex, _options.defaultIndex );

            arrangeItems( _options.defaultIndex );
            _selectIdx = _centerIdx;
            dispatch( 'init' );
        }

        function thumbHandler (e) {
            switch ( e.type ) {
                case 'next':
                    _this.next();
                    break;
                case 'prev':
                    _this.prev();
                    break;
                case 'index':
                    _this.changeIndex( e.index );
                    break;
            }
        }

        function getItems () {
            _$items = _$ul.find( '> .ix-list-item' );
            _totalLength = _$items.length;
        }

        //아이템 origin 갯수 대비 실제 갯수 설정
        function setItems () {
            _$items.each( function ( idx, el ) {
                //origin-index 속성 추가
                $( el ).attr( 'data-idx', idx );
            }).css({
                position: 'absolute'
            });
        }

        function addEvents () {
            if ( _options.autoPlay ) _$target.on( 'mouseover mouseout', mouseHandler );

            if ( $B.ua.TOUCH_DEVICE && _totalLength > 1 ) {
                _swipe = new $B.mobile.Swipe( _$viewport.get(0), _options.axis, {
                    onAxis: function (e) {
                        if ( _disabled ) return;
                        _this.stopTimer();
                        dispatch( 'touchStart' );
                    },
                    onMove: function (e) {
                        if ( _disabled ) return;
                        if ( _options.motionType === 'slide' ) touchMove( e );
                    },
                    onSwipe: function (e) {
                        if ( _disabled ) return;
                        _this.startTimer();
                        dispatch( 'touchEnd' );

                        //이동값이 변동이 없으면 transitionend 이벤트가 발생하지 않기 때문
                        if ( (_options.axis === 'horizontal'? e.moveX : e.moveY) === 0 ) return;
                        swipe( e.swipe );
                    }
                }).sensitivity( SWIPE_SENSITIVITY );
            }

            $( window ).on( 'resize', _this.resize );
        }

        function touchMove (e) {
            var movePos = ( _options.axis === 'horizontal' )? e.growX : e.growY,
                isOverPos = isOverPosition( movePos + _currentPos ),
                pos = isOverPos? ( movePos * ENDPOINT_DECREASE ) + _currentPos : movePos + _currentPos;

            if ( isOverPos && _options.bounce || !isOverPos ) {
                Utils.moveTo( _$ul, pos + 'px', _options );
                _currentPos = pos;
            }
        }

        function swipe ( type ) {
            if ( type === 'left' || type === 'up' ) {
                _this.next();
            } else if ( type === 'right' || type === 'down' ) {
                _this.prev();
            } else {
                dispatch( 'slideStart' );
                moveItems( _selectIdx, 'none', _options.motionType );
            }
        }

        function isOverPosition ( current ) {
            var result = false;

            if ( !_options.loop ) {
                if ( _selectIdx <= 0 && current > -_itemSize ) {
                    result = true;
                } else if ( _selectIdx >= _totalLength - 1 && current < -_itemSize ) {
                    result = true;
                }
            }

            return result;
        }

        function selectMove ( nextIdx, selectIdx, moveProp ) {
            if ( typeof selectIdx === 'number' && nextIdx !== selectIdx ) {
                arrangeItems( selectIdx, moveProp );
                nextIdx = selectIdx;
            }

            nextIdx = correctSelectIdx( nextIdx );
            if ( nextIdx === _selectIdx ) moveProp = 'none';

            dispatch( 'slideStart' );
            moveItems( nextIdx, moveProp,  _options.motionType );
        }

        //최소 최대 index값 보정
        function correctSelectIdx ( idx ) {
            if ( idx > _totalLength - 1 ) {
                idx = _options.loop ? 0 : _totalLength - 1;
            } else if ( idx < 0 ) {
                idx = _options.loop ? _totalLength - 1 : 0;
            }

            return idx;
        }

        //아이템 배치
        function arrangeItems ( idx, moveType ) {
            var centerIdx = getCenterIdx( idx, moveType ),
                prevIdx = getPrevIdx( idx, moveType ),
                nextIdx = getNextIdx( idx, moveType ),
                posProp = ( _options.axis === 'horizontal' )? 'left' : 'top';

            if ( prevIdx > -1 ) _$items.eq( prevIdx ).css( posProp, '0px' ).show();
            _$items.eq( centerIdx ).css( posProp, _itemSize + 'px' ).show();
            if ( nextIdx > -1 ) _$items.eq( nextIdx ).css( posProp, (_itemSize * 2) + 'px' ).show();

            _$items.filter( function ( index ) {
                return ( prevIdx !== index && nextIdx !== index &&  centerIdx !== index );
            }).hide();

            Utils.moveTo( _$ul, -_itemSize + 'px', _options );

            _currentPos = -_itemSize;
            _centerIdx = centerIdx;
            _prevIdx = prevIdx;
            _nextIdx = nextIdx;
        }

        //아이템 이동
        function moveItems ( idx, moveType, motionType, isSilent ) {
            idx = correctSelectIdx( idx );

            var nextPos = -_itemSize;

            _disabled = true;
            _this.stopTimer();
            _thumbController.disable().setIndex( idx, idx );

            if ( moveType === 'next' ) {
                nextPos = -( _itemSize * 2 );
            } else if ( moveType === 'prev' ) {
                nextPos = 0;
            }

            if ( motionType === 'slide' ) {
                Utils.move( _$ul, nextPos + 'px', _options, moveComplete, {idx: idx, isSilent: isSilent} );
            } else {
                Utils.moveTo( _$ul, nextPos + 'px', _options, moveComplete, {idx: idx, isSilent: isSilent} );
            }

            _currentPos = nextPos;
        }

        function moveComplete (e) {
            var oldIdx = _selectIdx;

            _thumbController.enable();
            _this.startTimer();
            _disabled = false;
            _selectIdx = e.data.idx;

            arrangeItems( _selectIdx );

            if ( !e.data.isSilent ) {
                if ( oldIdx !== _selectIdx ) dispatch( 'change' );
                dispatch( 'slideEnd' );
            }
        }

        function isEndpoint () {
            return ( !_options.loop && _selectIdx === _totalLength - 1 );
        }

        //왼쪽에 위치할 Element Index
        function getPrevIdx ( idx, moveType ) {
            var result = moveType ? ( moveType === 'next' ? -1 : idx ) : idx - 1;
            return ( moveType === 'next' ? result : (_options.loop ? correctSelectIdx(result) : result) );
        }

        //오른쪽에 위치할 Element Index
        function getNextIdx ( idx, moveType ) {
            var result = moveType ? ( moveType === 'prev' ? -1 : idx ) : idx + 1;
            return ( moveType === 'prev' ? result : (_options.loop ? correctSelectIdx(result) : result) );
        }

        //중심에 위치할 Element Index
        function getCenterIdx ( idx, moveType ) {
            return moveType ? _selectIdx : idx;
        }

        function setAutoPlay () {
            if ( !_options.autoPlay || _totalLength < 2 ) return;

            _timer = new $B.utils.Timer( _options.delay, _totalLength, {
                onTimer: function (e) {
                    if ( _options.opposite ) {
                        _this.prev();
                    } else {
                        _this.next();
                    }
                },
                onComplete: function (e) {
                    _this.startTimer();
                }
            }).start();
        }

        //사이즈 설정
        function setSize () {
            var sizeProp, marginProps, itemStyle = {}, ulStyle = {},
                itemMargins = getItemMargins(), itemMarginTotal = itemMargins[0] + itemMargins[1];

            if ( _options.viewportRatio ) _$viewport.css( 'height', getViewportHeight() + 'px' );

            _itemSize = getItemSize();

            if ( !_options.includeMargin ) _itemSize += itemMarginTotal;

            if ( _options.axis === 'horizontal' ) {
                sizeProp = 'width';
                marginProps = ['marginLeft', 'marginRight'];
            } else {
                sizeProp = 'height';
                marginProps = ['marginTop', 'marginBottom'];
            }

            ulStyle[sizeProp] = ( _itemSize * _totalLength + 100 ) + 'px';
            itemStyle[sizeProp] = ( _itemSize - itemMarginTotal )   + 'px';
            itemStyle[marginProps[0]] = itemMargins[0] + 'px';
            itemStyle[marginProps[1]] = itemMargins[1] + 'px';

            _$items.css( itemStyle );
            _$ul.css( ulStyle );
        }

        function getItemMargins () {
            var result = [];

            if ( _options.itemMargin ) {
                result = [_options.itemMargin[0].value, _options.itemMargin[1].value];
            } else {
                var margins = _$items.css( _options.axis === 'horizontal' ? ['marginLeft', 'marginRight'] : ['marginTop', 'marginBottom'] );
                $.each( margins, function ( key, value ) {
                    result.push( parseFloat(value) );
                });
            }

            return result;
        }

        function getViewportHeight () {
            return $B( _$viewport.get(0) ).rect().width * ( _options.viewportRatio[1].value / _options.viewportRatio[0].value );
        }

        function getItemSize ( ) {
            if ( _options.itemSize ) {
                return _options.itemSize.value;
            } else {
                var type = ( _options.axis === 'horizontal' )? 'width' : 'height';
                return $B( _$items.get(_selectIdx) ).rect()[type];
            }
        }

        function removeSize () {
            var sizeProp = ( _options.axis === 'horizontal' ) ? 'width' : 'height';
            _$viewport.attr( 'style', '' );
            _$ul.css( sizeProp, '' );
            _$items.css( sizeProp, '' ).css( 'margin', '' );
        }

        function removeStyle () {
            _$viewport.attr( 'style', '' );
            _$ul.attr( 'style', '' );
            _$items.attr( 'style', '' );
        }

        function removeEvents () {
            _$target.off( 'mouseover mouseout', mouseHandler );
            _thumbController.clear();
            if ( _swipe ) _swipe.clear();
            $( window ).off( 'resize', _this.resize );
        }

        function mouseHandler (e) {
            if ( e.type === 'mouseover' ) {
                _this.stopTimer();
            } else {
                _this.startTimer();
            }
        }

        function dispatch ( type ) {
            var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? isEndpoint() : undefined;
            _$target.triggerHandler( {type: 'ixSlideLite:' + type, currentIndex: _selectIdx, totalLength: _totalLength, endpoint: endpoint} );
        }
    };


    /**
     * Overlay List
     * @constructor
     */
    var OverlayList = function ( $target ) {
        var _this = this,
            _$target = $target,
            _$viewport = _$target.find( '> .ix-list-viewport' ),
            _$ul = _$viewport.find( '> .ix-list-items' ),
            _$items;

        var _options = Utils.getOptions( _$target.attr('data-ix-options') ),
            _timer, _swipe, _thumbController;

        var _totalLength, _selectIdx = 0, _disabled = false;

        // =============== Public Methods =============== //
        this.startTimer = function () {
            if ( _timer ) _timer.reset().start();
        };

        this.stopTimer = function () {
            if ( _timer ) _timer.stop();
        };

        this.changeIndex = function ( idx ) {
            if ( idx > _totalLength || idx < 0 ) return;

            if ( _selectIdx < idx ) {
                this.next( idx );
            } else if ( _selectIdx > idx ) {
                this.prev( idx );
            }
        };

        this.next = function ( selectIdx ) {
            if ( _disabled ) return;
            var idx = correctSelectIdx( (typeof selectIdx === 'number')? selectIdx : _selectIdx + 1 );

            if ( _selectIdx != idx ) {
                dispatch( 'slideStart' );
                overlayItem( idx, _options.motionType );
            }
        };

        this.prev = function ( selectIdx ) {
            if ( _disabled ) return;
            var idx = correctSelectIdx( (typeof selectIdx === 'number')? selectIdx : _selectIdx - 1 );

            if ( _selectIdx != idx ) {
                dispatch( 'slideStart' );
                overlayItem( idx, _options.motionType );
            }
        };

        this.clear = function () {
            this.stopTimer();
            removeEvents();
            removeStyle();
            _$ul.stop();
            _$items.removeAttr( 'data-origin-idx' ).removeAttr( 'data-idx' );
            Utils.removePlugin( _$target, 'overlay-list' );
        };

        this.getCurrentIndex = function () {
            return _selectIdx;
        };

        this.getTotalLength = function () {
            return _totalLength;
        };

        // =============== Initialize =============== //
        initialize();

        // =============== Protected Methods =============== //
        function initialize () {
            getItems();
            setItems();
            setSize();
            setAutoPlay();
            addEvents();

            _options.originLength = _totalLength;
            _options.totalLength = _totalLength;
            if ( _options.defaultIndex >= _totalLength || _options.defaultIndex < 0 ) _options.defaultIndex = 0;
            if ( _options.motionType === 'slide' ) _options.motionType = 'overlay';
            if ( !_options.duration ) _options.duration = 400;

            _thumbController = new ThumbController( _$target, _options, {
                onNext: thumbHandler,
                onPrev: thumbHandler,
                onIndex: thumbHandler
            }).setIndex( _options.defaultIndex, _options.defaultIndex );

            overlayItem( _options.defaultIndex, 'none', true );
            dispatch( 'init' );
        }

        function thumbHandler (e) {
            switch ( e.type ) {
                case 'next':
                    _this.next();
                    break;
                case 'prev':
                    _this.prev();
                    break;
                case 'index':
                    _this.changeIndex( e.index );
                    break;
            }
        }

        function getItems () {
            _$items = _$ul.find( '> .ix-list-item' );
            _totalLength = _$items.length;
        }

        //아이템 origin 갯수 대비 실제 갯수 설정
        function setItems () {
            _$items.each( function ( idx, el ) {
                //origin-index 속성 추가
                $( el ).attr( 'data-idx', idx );
            }).css({
                position: 'absolute'
            });
        }

        function setAutoPlay () {
            if ( !_options.autoPlay || _totalLength < 2 ) return;

            _timer = new $B.utils.Timer( _options.delay, _totalLength, {
                onTimer: function (e) {
                    if ( _options.opposite ) {
                        _this.prev();
                    } else {
                        _this.next();
                    }
                },
                onComplete: function (e) {
                    _this.startTimer();
                }
            }).start();
        }

        function addEvents () {
            if ( _options.autoPlay ) _$target.on( 'mouseover mouseout', mouseHandler );

            if ( $B.ua.TOUCH_DEVICE && _totalLength > 1 ) {
                _swipe = new $B.mobile.Swipe( _$viewport.get(0), _options.axis, {
                    onAxis: function (e) {
                        if ( _disabled ) return;
                        _this.stopTimer();
                        dispatch( 'touchStart' );
                    },
                    onSwipe: function (e) {
                        if ( _disabled ) return;
                        _this.startTimer();
                        dispatch( 'touchEnd' );
                        swipe( e.swipe );
                    }
                }).sensitivity( SWIPE_SENSITIVITY );
            }
        }

        function swipe ( type ) {
            if ( type === 'left' || type === 'up' ) {
                _this.next();
            } else if ( type === 'right' || type === 'down' ) {
                _this.prev();
            }
        }

        //최소 최대 index값 보정
        function correctSelectIdx ( idx ) {
            if ( idx > _totalLength - 1 ) {
                idx = _options.loop ? 0 : _totalLength - 1;
            } else if ( idx < 0 ) {
                idx = _options.loop ? _totalLength - 1 : 0;
            }

            return idx;
        }

        //아이템 이동
        function overlayItem ( idx, motionType, isSilent ) {
            _disabled = true;
            _this.stopTimer();
            _thumbController.disable().setIndex( idx, idx );

            if ( motionType === 'overlay' ) {
                var $item = _$items.eq( idx ).show();
                Utils.opacity( $item, 0, _options, null, null, true );
                _$ul.append( $item );
                Utils.opacity( $item, 1, _options, overlayComplete, {idx: idx, isSilent: isSilent} );
            } else {
                _$items.eq( idx ).show().siblings().hide();
                overlayComplete( {data: {idx: idx, isSilent: isSilent}} );
            }
        }

        function overlayComplete (e) {
            var oldIdx = _selectIdx;

            _thumbController.enable();
            _this.startTimer();
            _disabled = false;
            _selectIdx = e.data.idx;

            if ( !e.data.isSilent ) {
                if ( oldIdx !== _selectIdx ) dispatch( 'change' );
                dispatch( 'slideEnd' );
            }
        }

        function isEndpoint () {
            return ( !_options.loop && _selectIdx === _totalLength - 1 );
        }

        function setSize () {
            if ( _options.viewportRatio ) _$viewport.css( 'height', getViewportHeight() + 'px' );
        }

        function getViewportHeight () {
            return $B( _$viewport.get(0) ).rect().width * ( _options.viewportRatio[1].value / _options.viewportRatio[0].value );
        }

        function removeStyle () {
            _$viewport.attr( 'style', '' );
            _$items.attr( 'style', '' );
        }

        function removeEvents () {
            _$target.off( 'mouseover mouseout', mouseHandler );
            _thumbController.clear();
            if ( _swipe ) _swipe.clear();
        }

        function mouseHandler (e) {
            if ( e.type === 'mouseover' ) {
                _this.stopTimer();
            } else {
                _this.startTimer();
            }
        }

        function dispatch ( type ) {
            var endpoint = ( 'init change slideEnd'.indexOf(type) > -1 )? isEndpoint() : undefined;
            _$target.triggerHandler( {type: 'ixOverlayList:' + type, currentIndex: _selectIdx, totalLength: _totalLength, endpoint: endpoint} );
        }
    };


    /**
     * Base Slider
     * @constructor
     */
    var BaseSlider = function ( $icon, $input, options, dispatches ) {
        var _this = this,
            _min, _max, _moveMin, _moveMax,  _value, _percent, _disabled = false, _type,
            _offsetProp = ( options.axis === 'horizontal' )? 'left' : 'top';


        // =============== Public Methods =============== //
        this.initialize = function () {
            addEvents();
            return this;
        };

        this.type = function ( val ) {
            if ( val ) {
                _type = val;
                return this;
            } else {
                return _type;
            }
        };

        this.min = function ( val, moveVal ) {
            if ( typeof val === 'number' ) {
                _min = val;
                _moveMin = ( typeof moveVal === 'number' )? moveVal : val;
                return this;
            } else {
                return _min;
            }
        };

        this.max = function ( val, moveVal ) {
            if ( typeof val === 'number' ) {
                _max = val;
                _moveMax = ( typeof moveVal === 'number' )? moveVal : val;
                return this;
            } else {
                return _max;
            }
        };

        this.value = function ( val, isAni, isUserInput ) {
            if ( typeof val === 'number' ) {
                if ( (options.correctEndpoint && isAni) || options.snap ) {
                    _value = valueToGapValue( correctValue(val) );
                } else {
                    _value = correctMoveValue( val );
                }

                setInputValue( true, ( isUserInput? false : true ), false );
                move( valueToPercent(_value), isAni, isUserInput );
                return this;
            } else {
                return valueToGapValue( _value );
            }
        };

        this.percent = function ( per, isAni ) {
            if ( typeof per === 'number' ) {
                per = correctPercent( per );
                this.value( percentToValue(per), isAni );
                return this;
            } else {
                return _percent;
            }
        };

        this.enable = function () {
            _disabled = false;
            $icon.removeClass( 'disabled' );
            $input.attr( 'disabled', false );
            return this;
        };

        this.disable = function () {
            _disabled = true;
            $icon.addClass( 'disabled' );
            $input.attr( 'disabled', true );
            return this;
        };

        this.focus = function () {
            $icon.focus();
            return this;
        };

        this.clear = function () {
            removeEvents();
            return this;
        };

        this.isDisabled = function () {
            return _disabled;
        };

        // =============== Protected Methods =============== //

        function addEvents () {
            $input.on( 'keydown focusin focusout', inputKeyHandler );
            $icon.on( 'keydown', iconKeyHandler );
        }

        function inputKeyHandler (e) {
            switch ( e.type ) {
                case 'keydown':
                    if ( isPermissionKeyCode(e.which) ) {
                        if ( isEnterKey(e.which) ) {
                            var value = _value;
                            setInputValue( false, false, true );
                            if ( value != _value ) _this.value( _value, false, true );
                        }
                    } else {
                        e.preventDefault();
                    }
                    break;
                case 'focusin':
                    setInputValue( true, false, true );
                    break;
                case 'focusout':
                    var value = _value;
                    setInputValue( false, true, true );
                    if ( value != _value ) {
                        _this.value( _value, false, true );
                        setInputValue( false, true, false );
                    }
                    break;
            }
        }

        function iconKeyHandler (e) {
            if ( _disabled ) return;
            var arrowKeyType = getArrowKeyType( e.which );

            if ( arrowKeyType ) e.preventDefault();

            if ( arrowKeyType === 'forward' ) {
                _this.value( _value + options.gap, false, true );
                setInputValue( false, true, false );
            } else if ( arrowKeyType === 'backward' ) {
                _this.value( _value - options.gap, false, true );
                setInputValue( false, true, false );
            }
        }

        function move ( percent, isAni, isUserInput ) {
            var moveProp = {},
                posPer = ( options.axis === 'horizontal' )? percent : 100 - percent;

            moveProp[_offsetProp] = posPer + '%';
            _percent = posPer;

            if ( isAni ) {
                $icon.stop().animate( moveProp, options.duration, function () {
                    dispatch( 'change', isUserInput );
                });

                if ( options.correctEndpoint && options.duration ) dispatch( 'mouseUp' );
            } else {
                $icon.stop().css( moveProp );
                dispatch( 'change', isUserInput );
            }
        }

        //최소, 최대값 보정
        function correctValue ( value ) {
            if ( value < _min ) {
                value = _min;
            } else if ( value > _max ) {
                value = _max;
            }

            return value;
        }

        function correctMoveValue ( value ) {
            if ( value < _moveMin ) {
                value = _moveMin;
            } else if ( value > _moveMax ) {
                value = _moveMax;
            }

            return value;
        }

        function correctPercent ( percent ) {
            if ( percent < 0 ) {
                percent = 0;
            } else if ( percent > 100 ) {
                percent = 100;
            }

            return percent;
        }

        function setInputValue ( isValue, isViewStr, isInput ) {
            var value = _value;

            if ( !isValue ) {
                value = $input.val();
                if ( !isNumber( value ) ) value = _value;
            }

            var rangeValue = valueToGapValue( value ),
                viewString = rangeValue;

            if ( isViewStr ) {
                viewString = correctValue( viewString );
                viewString = options.addFirstStr + valueToNumberFormat( viewString ) + options.addLastStr;
            }

            $input.val( viewString );

            if ( isInput ) {
                _value = correctMoveValue( rangeValue );
            }
        }

        function valueToGapValue ( value ) {
            var result = Math.round( value / options.gap ) * options.gap,
                nextValue = result + options.gap,
                prevValue = result - options.gap,
                rest = 0;

            if ( (nextValue > options.max) && (result < value) ) {
                rest = _max - result;

                if ( rest ) {
                    result += Math.round( (value - result) / rest ) * rest;
                }
            } else if ( (prevValue < options.min) && (result > value) ) {
                rest = _min - result;

                if ( rest ) {
                    result += Math.round( (value - result) / rest ) * rest;
                }
            }

            return result;
        }

        function percentToValue ( per ) {
            return ( (per / 100) * (options.max - options.min) ) + options.min;
        }

        function valueToPercent ( value ) {
            return ( value - options.min ) / ( options.max - options.min ) * 100;
        }

        function valueToNumberFormat ( value ) {
            if ( options.numberFormat ) value = $B.string.numberFormat( value );
            return value;
        }

        function isNumber ( value ) {
            return ( typeof Number(value) === 'number' );
        }

        function isPermissionKeyCode ( keyCode ) {
            //숫자키, 백스페이스, Delete, Tab, Shift, enter, -, ., 화살표키
            return ( (keyCode > 47 && keyCode < 58) || (keyCode > 95 && keyCode < 106)
            || keyCode == 8 || keyCode == 9 || keyCode == 16 || keyCode == 46 || isEnterKey(keyCode)
            || (keyCode == 189 || keyCode == 109) || (keyCode == 190 || keyCode == 110) || getArrowKeyType(keyCode) );
        }

        function getArrowKeyType ( keyCode ) {
            var result = undefined;
            if ( keyCode == 37 || keyCode == 40 ) {
                result = 'backward';
            } else if ( keyCode == 38 || keyCode == 39 ) {
                result = 'forward';
            }
            return result;
        }

        function isEnterKey ( keyCode ) {
            return ( keyCode == 13 );
        }

        function removeEvents () {
            $input.off( 'keydown focusin focusout', inputKeyHandler );
            $icon.off( 'keydown', iconKeyHandler );
        }

        function dispatch ( type, isUserInput ) {
            var callback = 'on' + $B.string.capitalize( type );
            dispatches[callback].call( _this, {type: type, value: _this.value(), currentValue: _value, isUserInput: isUserInput} );
        }
    };


    /**
     * Range Slider
     * @constructor
     */
    var RangeSlider = function ( $target ) {
        var _this = this,
            _$target = $target,
            _$minInput = _$target.find( '.ix-min-input' ),
            _$maxInput = _$target.find( '.ix-max-input' ),
            _$minIcon = _$target.find( '.ix-min-icon' ),
            _$maxIcon = _$target.find( '.ix-max-icon' ),
            _$slideBar = _$target.find( '.ix-slider-bar' ),
            _$progress = _$target.find( '.ix-progress' );

        var _options = Utils.getOptions( _$target.attr('data-ix-options') );

        var _minSlider, _maxSlider, _gAxis, _activeSlider, _touchEvent, _docTouchEvent,
            _currentPer = 0, _minValue, _maxValue, _offsetProp, _posProp, _sizeProp,
            _disabled = false, _isInit = false, _isMouseDown = false, _isMouseUp = false;

        // =============== Public Methods =============== //
        this.changeValues = function ( val ) {
            if ( val.length === 2 ) {
                var values = correctValues( val );
                _minSlider.max( values[1] ).value( values[0] );
                _maxSlider.min( values[0] ).value( values[1] );
            }
        };

        this.getValues = function () {
            return [_minSlider.value(), _maxSlider.value()];
        };

        this.enable = function ( type ) {
            if ( !type || type === 'min' ) _minSlider.enable();
            if ( !type || type === 'max' ) _maxSlider.enable();

            if ( !_minSlider.isDisabled() && !_maxSlider.isDisabled() ) {
                _$target.removeClass( 'disabled' );
                _disabled = false;
            }

            setTouchAction( _options.axis === 'horizontal'? 'pan-y' : 'pan-x' );
        };

        this.disable = function ( type ) {
            if ( !type || type === 'min' ) _minSlider.disable();
            if ( !type || type === 'max' ) _maxSlider.disable();

            if ( _minSlider.isDisabled() && _maxSlider.isDisabled() ) {
                _$target.addClass( 'disabled' );
                _disabled = true;
                setTouchAction( 'auto' );
            }
        };

        this.clear = function () {
            removeEvents();
            this.enable();
            if ( _gAxis ) _gAxis.clear();
            if ( _minSlider ) _minSlider.clear();
            if ( _maxSlider ) _maxSlider.clear();
            Utils.removePlugin( _$target, 'range-slider' );
        };

        // =============== Initialize =============== //
        initialize();

        // =============== Protected Methods =============== //
        function initialize () {
            setOptions();
            addEvents();
            setProgress();

            if ( typeof _options.disable === 'string' ) {
                _this.disable( _options.disable );
            } else if ( _options.disable ) {
                _this.disable();
            }

            dispatch( 'init', false );
        }

        function setOptions () {
            if ( _options.values && _options.values.length > 1 ) {
                _options.values = [_options.values[0].value, _options.values[1].value];
            } else {
                _options.values = [_options.min, _options.max];
            }

            if ( _options.max < _options.min ) _options.max = _options.min;
            if ( _options.snap ) _options.correctEndpoint = false;

            if ( _options.gap > _options.max - _options.min ) {
                _options.gap = _options.max - _options.min;
            }

            if ( _options.axis === 'horizontal' ) {
                _offsetProp = 'left';
                _posProp = 'pageX';
                _sizeProp = 'width';
            } else {
                _offsetProp = 'top';
                _posProp = 'pageY';
                _sizeProp = 'height';
            }

            _options.values = correctValues( _options.values );
        }

        function correctValues ( values ) {
            var minValue = values[0],
                maxValue = values[1];

            if ( minValue < _options.min ) minValue = _options.min;
            if ( maxValue > _options.max ) maxValue = _options.max;
            if ( minValue > maxValue ) minValue = maxValue;

            return [minValue, maxValue];
        }

        function addEvents () {
            _minSlider = new BaseSlider( _$minIcon, _$minInput, _options, {
                onChange: function (e) {
                    var isChange = isChangeValue( e.value, _maxValue );
                    _minValue = e.value;
                    _currentPer = this.percent();

                    setProgress();

                    if ( _maxSlider ) _maxSlider.min( e.value, e.currentValue );
                    if ( isChange ) dispatch( 'change', e.isUserInput || _isMouseDown, this.type() );
                    if ( _isMouseUp ) {
                        dispatch( 'slideEnd', true, this.type() );
                    }
                },
                onMouseUp: function (e) {
                    _currentPer = this.percent();
                    setProgress( true );
                }
            }).type( 'min' ).min( _options.min ).max( _options.values[1] ).value( _options.values[0] ).initialize();

            _maxSlider = new BaseSlider( _$maxIcon, _$maxInput, _options, {
                onChange: function (e) {
                    var isChange = isChangeValue( _minValue, e.value );
                    _maxValue = e.value;
                    _currentPer = this.percent();

                    setProgress();

                    if ( _minSlider ) _minSlider.max( e.value, e.currentValue );
                    if ( isChange ) dispatch( 'change', e.isUserInput || _isMouseDown, this.type() );
                    if ( _isMouseUp ) {
                        dispatch( 'slideEnd', true, this.type() );
                    }
                },
                onMouseUp: function (e) {
                    _currentPer = this.percent();
                    setProgress( true );
                }
            }).type( 'max' ).min( _options.values[0] ).max( _options.max ).value( _options.values[1] ).initialize();

            if ( $B.ua.TOUCH_DEVICE ) {
                setTouchAction( _options.axis === 'horizontal'? 'pan-y' : 'pan-x' );

                //_touchEvent = new $B.mobile.TouchEvent( _$slideBar );
                _docTouchEvent = new $B.mobile.TouchEvent( document );

                _gAxis = new $B.mobile.GestureAxis( _$slideBar, {
                    onAxis: function (e) {
                        if ( _disabled ) return;
                        _docTouchEvent.add( 'touchmove', touchHandler );
                        _docTouchEvent.add( 'touchend', touchHandler );
                        _docTouchEvent.add( 'touchcancel', touchHandler );

                        var currentPer = pxToPercent( getEventPos(e) );
                        _isMouseDown = true;
                        _activeSlider = getNearSlider( currentPer );

                        dispatch( 'slideStart', true, _activeSlider.type() );
                        _activeSlider.percent( currentPer );
                    }
                }, {aType: _options.axis});
            }

            _$slideBar.on( 'mousedown', dragHandler );
        }

        function touchHandler (e) {
            if ( _disabled ) return;
            e.preventDefault();
            e.stopPropagation();

            switch ( e.type ) {
                case 'touchcancel':
                case 'touchend':
                    _isMouseUp = true;
                    _docTouchEvent.remove( 'touchmove', touchHandler );
                    _docTouchEvent.remove( 'touchend', touchHandler );
                    _docTouchEvent.remove( 'touchcancel', touchHandler );

                    var currentPer = ( _options.axis === 'horizontal' )? _currentPer : 100 - _currentPer;
                    _activeSlider.percent( currentPer, true );
                    break;
                case 'touchmove':
                    _activeSlider.percent( pxToPercent(getEventPos(e)) );
                    break;
            }
        }

        function dragHandler (e) {
            if ( _disabled ) return;
            e.preventDefault();
            e.stopPropagation();

            var currentPer = pxToPercent( getEventPos(e) );

            switch ( e.type ) {
                case 'mousedown':
                    _isMouseDown = true;
                    $( document ).on( 'mousemove', dragHandler );
                    $( document ).on( 'mouseup', dragHandler );

                    _activeSlider = getNearSlider( currentPer );
                    dispatch( 'slideStart', true, _activeSlider.type() );
                    _activeSlider.percent( currentPer );
                    break;
                case 'mouseup':
                    _isMouseUp = true;
                    $( document ).off( 'mousemove', dragHandler );
                    $( document ).off( 'mouseup', dragHandler );
                    _activeSlider.percent( currentPer, true );
                    break;
                case 'mousemove':
                    _activeSlider.percent( currentPer );
                    break;
            }
        }

        function setProgress ( isMouseUp ) {
            if ( !_minSlider || !_maxSlider ) return;

            var posPer, sizePer, style = {};

            if ( _options.axis === 'horizontal' ) {
                posPer = _minSlider.percent();
                sizePer = _maxSlider.percent();
            } else {
                posPer = _maxSlider.percent();
                sizePer = _minSlider.percent();
            }

            style[_offsetProp] = posPer + '%';
            style[_sizeProp] = ( sizePer - posPer ) + '%';

            if ( isMouseUp && _options.correctEndpoint && _options.duration ) {
                _$progress.stop().animate( style, _options.duration );
            } else {
                _$progress.stop().css( style );
            }
        }

        function isChangeValue ( minValue, maxValue ) {
            return ( _minValue != minValue || _maxValue != maxValue );
        }

        //none, auto
        function setTouchAction ( state ) {
            if ( $B.ua.TOUCH_DEVICE && $B.ua.WINDOWS ) {
                _$slideBar.css({
                    '-ms-touch-action': state,
                    'touch-action': state
                });

                //마우스로 컨트롤시 드래그 방지
                if ( state == 'auto' ) {
                    _$slideBar.off( 'dragstart', dargStartHandler );
                } else {
                    _$slideBar.on( 'dragstart', dargStartHandler );
                }
            }
        }

        function dargStartHandler (e) {
            e.preventDefault();
        }

        function removeEvents () {
            if ( _docTouchEvent ) _docTouchEvent.clear();
            if ( _touchEvent ) _touchEvent.clear();
            setTouchAction( 'auto' );

            _$slideBar.off( 'mousedown', dragHandler );
            $( document ).off( 'mousemove mouseup', dragHandler );
        }

        function getEventPos ( e ) {
            var slidebarPos = _$slideBar.offset()[_offsetProp];

            if ( e.type === 'axis' || e.type.indexOf('touch') === -1 ) {
                return e[_posProp] - slidebarPos;
            } else {
                return e.touches[0][_posProp] - slidebarPos;
            }
        }

        function pxToPercent ( pos ) {
            var percent = pos / _$slideBar[_sizeProp]() * 100;
            return ( _options.axis === 'horizontal' )? percent : 100 - percent;
        }

        function getNearSlider ( per ) {
            var result = _minSlider,
                min = _minSlider.percent(),
                max = _maxSlider.percent(),
                percent = ( _options.axis === 'horizontal' )? per : 100 - per,
                minGap = Math.abs( min - percent ),
                maxGap = Math.abs( max - percent );

            if ( _minSlider.isDisabled() || _maxSlider.isDisabled() ) {
                if ( _minSlider.isDisabled() ) result =  _maxSlider;
            } else {
                if ( minGap === maxGap ) {
                    if ( _options.axis === 'horizontal' ) {
                        if ( _currentPer < percent ) result = _maxSlider;
                    } else {
                        if ( _currentPer > percent ) result = _maxSlider;
                    }
                } else if ( minGap > maxGap ) {
                    result = _maxSlider;
                }
            }

            return result.focus();
        }

        function dispatch ( type, isUser, sliderType ) {
            if ( type === 'init' ) {
                _isInit = true;
            } else {
                if ( !_isInit ) return;
            }

            if ( type === 'slideEnd' ) {
                _isMouseDown = false;
                _isMouseUp = false;
            }

            _$target.triggerHandler( {type: 'ixRangeSlider:' + type, values: _this.getValues(), userInteraction: isUser, currentType: sliderType} );
        }
    };


    /**
     * Slider
     * @constructor
     */
    var Slider = function ( $target ) {
        var _this = this,
            _$target = $target,
            _$input = _$target.find( '.ix-input' ),
            _$icon = _$target.find( '.ix-icon' ),
            _$slideBar = _$target.find( '.ix-slider-bar' ),
            _$progress = _$target.find( '.ix-progress' );

        var _options = Utils.getOptions( _$target.attr('data-ix-options') );

        var _slider, _gAxis, _touchEvent, _docTouchEvent,
            _value, _currentPer = 0, _offsetProp, _posProp, _sizeProp,
            _disabled = false, _isInit = false, _isMouseDown = false, _isMouseUp = false;

        // =============== Public Methods =============== //
        this.changeValue = function ( val ) {
            if ( val ) _slider.value( correctValue(val) );
        };

        this.getValue = function () {
            return _slider.value();
        };

        this.enable = function () {
            _slider.enable();
            _$target.removeClass( 'disabled' );
            _disabled = false;
            setTouchAction( _options.axis === 'horizontal'? 'pan-y' : 'pan-x' );
        };

        this.disable = function () {
            _slider.disable();
            _$target.addClass( 'disabled' );
            _disabled = true;
            setTouchAction( 'auto' );
        };

        this.clear = function () {
            removeEvents();
            this.enable();
            if ( _gAxis ) _gAxis.clear();
            if ( _slider ) _slider.clear();
            Utils.removePlugin( _$target, 'slider' );
        };

        // =============== Initialize =============== //
        initialize();

        // =============== Protected Methods =============== //
        function initialize () {
            setOptions();
            addEvents();
            setProgress();

            if ( _options.disable ) _this.disable();
            dispatch( 'init', false );
        }

        function setOptions () {
            if ( _options.max < _options.min ) _options.max = _options.min;
            if ( _options.snap ) _options.correctEndpoint = false;

            if ( _options.gap > _options.max - _options.min ) {
                _options.gap = _options.max - _options.min;
            }

            if ( _options.axis === 'horizontal' ) {
                _offsetProp = 'left';
                _posProp = 'pageX';
                _sizeProp = 'width';
            } else {
                _offsetProp = 'top';
                _posProp = 'pageY';
                _sizeProp = 'height';
            }

            if ( typeof _options.value !== 'number' ) _options.value = _options.min;
            _options.value = correctValue( _options.value );
        }

        function correctValue ( value ) {
            if ( value < _options.min ) value = _options.min;
            if ( value > _options.max ) value = _options.max;
            return value;
        }

        function addEvents () {
            _slider = new BaseSlider( _$icon, _$input, _options, {
                onChange: function (e) {
                    var isChange = isChangeValue( e.value );
                    _value = e.value;
                    _currentPer = this.percent();

                    setProgress();

                    if ( isChange ) dispatch( 'change', e.isUserInput || _isMouseDown );
                    if ( _isMouseUp ) dispatch( 'slideEnd', true );
                },
                onMouseUp: function (e) {
                    _currentPer = this.percent();
                    setProgress( true );
                }
            }).min( _options.min ).max( _options.max ).value( _options.value ).initialize();

            if ( $B.ua.TOUCH_DEVICE ) {
                setTouchAction( _options.axis === 'horizontal'? 'pan-y' : 'pan-x' );

                //_touchEvent = new $B.mobile.TouchEvent( _$slideBar );
                _docTouchEvent = new $B.mobile.TouchEvent( document );

                _gAxis = new $B.mobile.GestureAxis( _$slideBar, {
                    onAxis: function (e) {
                        if ( _disabled ) return;
                        _docTouchEvent.add( 'touchmove', touchHandler );
                        _docTouchEvent.add( 'touchend', touchHandler );
                        _docTouchEvent.add( 'touchcancel', touchHandler );

                        var currentPer = pxToPercent( getEventPos(e) );
                        _isMouseDown = true;

                        dispatch( 'slideStart', true );
                        _slider.focus().percent( currentPer );
                    }
                }, {aType: _options.axis});
            }

            _$slideBar.on( 'mousedown', dragHandler );
        }

        function touchHandler (e) {
            if ( _disabled ) return;
            e.preventDefault();
            e.stopPropagation();

            switch ( e.type ) {
                case 'touchcancel':
                case 'touchend':
                    _isMouseUp = true;
                    _docTouchEvent.remove( 'touchmove', touchHandler );
                    _docTouchEvent.remove( 'touchend', touchHandler );
                    _docTouchEvent.remove( 'touchcancel', touchHandler );

                    var currentPer = ( _options.axis === 'horizontal' )? _currentPer : 100 - _currentPer;
                    _slider.percent( currentPer, true );
                    break;
                case 'touchmove':
                    _slider.percent( pxToPercent(getEventPos(e)) );
                    break;
            }
        }

        function dragHandler (e) {
            if ( _disabled ) return;
            e.preventDefault();
            e.stopPropagation();

            var currentPer = pxToPercent( getEventPos(e) );

            switch ( e.type ) {
                case 'mousedown':
                    _isMouseDown = true;
                    $( document ).on( 'mousemove', dragHandler );
                    $( document ).on( 'mouseup', dragHandler );

                    dispatch( 'slideStart', true );
                    _slider.focus().percent( currentPer );
                    break;
                case 'mouseup':
                    _isMouseUp = true;
                    $( document ).off( 'mousemove', dragHandler );
                    $( document ).off( 'mouseup', dragHandler );
                    _slider.percent( currentPer, true );
                    break;
                case 'mousemove':
                    _slider.percent( currentPer );
                    break;
            }
        }

        function setProgress ( isMouseUp ) {
            if ( !_slider ) return;

            var style = {},
                percent = _slider.percent(),
                size = ( _options.axis === 'horizontal' )? percent : 100 - percent,
                pos = ( _options.axis === 'horizontal' )? 0 : percent;

            style[_sizeProp] = size + '%';
            style[_offsetProp] = pos + '%';

            if ( isMouseUp && _options.correctEndpoint && _options.duration ) {
                _$progress.stop().animate( style, _options.duration );
            } else {
                _$progress.stop().css( style );
            }
        }

        function isChangeValue ( val ) {
            return ( _value !== val );
        }

        //none, auto
        function setTouchAction ( state ) {
            if ( $B.ua.TOUCH_DEVICE && $B.ua.WINDOWS ) {
                _$slideBar.css({
                    '-ms-touch-action': state,
                    'touch-action': state
                });

                //마우스로 컨트롤시 드래그 방지
                if ( state == 'auto' ) {
                    _$slideBar.off( 'dragstart', dargStartHandler );
                } else {
                    _$slideBar.on( 'dragstart', dargStartHandler );
                }
            }
        }

        function dargStartHandler (e) {
            e.preventDefault();
        }

        function removeEvents () {
            if ( _docTouchEvent ) _docTouchEvent.clear();
            if ( _touchEvent ) _touchEvent.clear();
            setTouchAction( 'auto' );

            _$slideBar.off( 'mousedown', dragHandler );
            $( document ).off( 'mousemove mouseup', dragHandler );
        }

        function getEventPos ( e ) {
            var slidebarPos = _$slideBar.offset()[_offsetProp];

            if ( e.type === 'axis' || e.type.indexOf('touch') === -1 ) {
                return e[_posProp] - slidebarPos;
            } else {
                return e.touches[0][_posProp] - slidebarPos;
            }
        }

        function pxToPercent ( pos ) {
            var percent = pos / _$slideBar[_sizeProp]() * 100;
            return ( _options.axis === 'horizontal' )? percent : 100 - percent;
        }

        function dispatch ( type, isUser ) {
            if ( type === 'init' ) {
                _isInit = true;
            } else {
                if ( !_isInit ) return;
            }

            if ( type === 'slideEnd' ) {
                _isMouseDown = false;
                _isMouseUp = false;
            }

            _$target.triggerHandler( {type: 'ixSlider:' + type, value: _this.getValue(), userInteraction: isUser} );
        }
    };


    _ixSnack.ListIndexManager = ListIndexManager;
    _ixSnack.ThumbController = ThumbController;
    _ixSnack.utils = Utils;
    window.ixSnack = window.ixSnack || _ixSnack;
})( jQuery, ixBand );